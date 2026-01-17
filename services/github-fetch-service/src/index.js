import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { Octokit } from 'octokit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const { Pool } = pg;

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// GitHub Client
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Helper to update repository status (if we had a status field on the repo, but checking the prompt we have analyzed_at)
const updateRepoStatus = async (id) => {
    await pool.query('UPDATE repositories SET analyzed_at = NOW() WHERE id = $1', [id]);
};

// Analyze Repo Endpoint
app.post('/analyze-repo', async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repo URL is required' });
    }

    // Parse Owner and Repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        return res.status(400).json({ error: 'Invalid GitHub URL' });
    }
    const owner = match[1];
    const repo = match[2].replace('.git', '');

    try {
        // 1. Fetch Repo Metadata
        console.log(`Fetching metadata for ${owner}/${repo}`);
        const { data: repoData } = await octokit.request('GET /repos/{owner}/{repo}', {
            owner,
            repo
        });

        // 2. Store Repo in DB
        let repoId;
        const existingRepo = await pool.query('SELECT id FROM repositories WHERE owner = $1 AND name = $2', [owner, repo]);

        if (existingRepo.rows.length > 0) {
            repoId = existingRepo.rows[0].id;
            // Update existing repo info if needed? For now just reuse ID.
            console.log(`Repo ${owner}/${repo} already exists with ID ${repoId}`);
        } else {
            const newRepo = await pool.query(
                'INSERT INTO repositories (owner, name, url) VALUES ($1, $2, $3) RETURNING id',
                [owner, repo, repoUrl]
            );
            repoId = newRepo.rows[0].id;
            console.log(`Created new repo ${owner}/${repo} with ID ${repoId}`);
        }

        // Response immediately to client while processing continues in background?
        // User requirement: "Real-time progress" is optional. For simplicity, let's await the process or just return "processing" and let client poll.
        // The prompt says "Generate timeline generation logic" and "Input validation for repo URLs".
        // "Timeline Processor Service" converts raw data. Fetch service just fetches.
        // So Fetch service should probably just dump everything into DB.

        // 3. Fetch Branches
        console.log(`Fetching branches for ${owner}/${repo}`);
        const { data: branches } = await octokit.request('GET /repos/{owner}/{repo}/branches', {
            owner,
            repo,
            per_page: 100 // Handle pagination if needed for huge repos
        });

        for (const branch of branches) {
            // Store Branch
            // We need to upsert branches
            const branchResult = await pool.query(
                'SELECT id FROM branches WHERE repo_id = $1 AND name = $2',
                [repoId, branch.name]
            );

            let branchId;
            if (branchResult.rows.length > 0) {
                branchId = branchResult.rows[0].id;
                await pool.query('UPDATE branches SET head_sha = $1 WHERE id = $2', [branch.commit.sha, branchId]);
            } else {
                // creator and created_at are hard to get from branch API directly, usually inferred from commits
                await pool.query(
                    'INSERT INTO branches (repo_id, name, head_sha) VALUES ($1, $2, $3)',
                    [repoId, branch.name, branch.commit.sha]
                );
            }
        }

        // 4. Fetch Commits (Per branch? Or all commits?)
        // Using 'GET /repos/{owner}/{repo}/commits' lists commits.
        // To get full history, we might need to page through everything.
        // Let's fetch the main branch commits or iterate all branches?
        // Iterating all branches might result in duplicates, but we can handle that in DB with ON CONFLICT or check existence.
        // Efficient way: Fetch all commits from default branch, then fetch commits from other branches that are not in DB?
        // Simpler way for MVP: Just fetch last 100-300 commits from all branches. Or just default branch?
        // "Commit history per branch" -> implies we should check each branch.

        // Let's iterate branches and fetch commits, avoiding duplicates.
        console.log(`Fetching commits for ${owner}/${repo}`);

        // We'll limit to last 100 commits per branch for MVP speed, or page a bit.
        // Ideally we walk the graph.

        for (const branch of branches) {
            console.log(`Fetching commits for branch ${branch.name}`);
            const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
                owner,
                repo,
                sha: branch.name,
                per_page: 50 // Limit for MVP
            });

            for (const commitData of commits) {
                const sha = commitData.sha;
                const authorName = commitData.commit.author.name;
                const msg = commitData.commit.message;
                const date = commitData.commit.author.date;
                const parents = commitData.parents.map(p => p.sha);

                // Check if commit exists
                const existingCommit = await pool.query('SELECT id FROM commits WHERE commit_hash = $1', [sha]);
                if (existingCommit.rows.length === 0) {
                    await pool.query(
                        'INSERT INTO commits (repo_id, branch_name, author, message, commit_hash, committed_at, parent_hashes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [repoId, branch.name, authorName, msg, sha, date, parents]
                    );
                } else {
                    // Should we update branch_name? A commit can belong to multiple branches. `branch_name` in commits table is a simplification.
                    // Ideally `commits` table shouldn't have `branch_name` if it's many-to-many, but user prompt requested `branch` column in `commits` table.
                    // We'll leave it as the first branch we found it on.
                }
            }
        }

        // Mark as analyzed
        await updateRepoStatus(repoId);

        // Trigger Timeline Processor? 
        // Or just return success and let Frontend call Processor. 
        // Let's trigger it via HTTP call or just let frontend do it.
        // User flow: "Frontend requests timeline". Probably triggers generation if needed?
        // Let's return success here.

        res.json({ message: 'Repository analyzed successfully', repoId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to analyze repository', details: err.message });
    }
});

// Get Status (for polling)
app.get('/repo/:owner/:repo/status', async (req, res) => {
    const { owner, repo } = req.params;
    try {
        const result = await pool.query('SELECT analyzed_at FROM repositories WHERE owner = $1 AND name = $2', [owner, repo]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Repo not found' });
        res.json({ analyzed_at: result.rows[0].analyzed_at });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`GitHub Fetch Service running on port ${PORT}`);
});
