import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
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

// Generate Timeline Helper
const generateTimeline = async (repoId) => {
    // 1. Clear existing events for this repo
    await pool.query('DELETE FROM timeline_events WHERE repo_id = $1', [repoId]);

    // 2. Fetch all commits sorted by time
    const commitsResult = await pool.query(
        'SELECT * FROM commits WHERE repo_id = $1 ORDER BY committed_at ASC',
        [repoId]
    );
    const commits = commitsResult.rows;

    const events = [];
    const seenBranches = new Set();

    for (const commit of commits) {
        let eventType = 'COMMIT';
        let parents = commit.parent_hashes || [];

        // Detect Branch Start
        if (commit.branch_name && !seenBranches.has(commit.branch_name)) {
            seenBranches.add(commit.branch_name);
            // We can mark it as a special commit or just a separate event. 
            // For simplicity in graph building, let's treat the commit ITSELF as the event.
            // But we might want to know if it started a branch.
        }

        // Detect Merge
        if (parents.length > 1) {
            eventType = 'MERGE';
        }

        events.push({
            repo_id: repoId,
            event_type: eventType,
            payload: {
                branch: commit.branch_name,
                author: commit.author,
                message: commit.message,
                commit_hash: commit.commit_hash,
                parents: parents,
                is_branch_start: (commit.branch_name && seenBranches.has(commit.branch_name) && !seenBranches.has(commit.branch_name + '_logged')) ? true : false
                // Logic for is_branch_start needs to be cleaner.
                // Re-doing logic below.
            },
            event_time: commit.committed_at
        });
    }

    // Simplification: Redo loop to be cleaner
    const refinedEvents = [];
    const processedBranches = new Set();

    for (const commit of commits) {
        let type = 'COMMIT';
        const parents = commit.parent_hashes || [];

        let isBranchStart = false;
        if (commit.branch_name && !processedBranches.has(commit.branch_name)) {
            processedBranches.add(commit.branch_name);
            isBranchStart = true;
        }

        if (parents.length > 1) {
            type = 'MERGE';
        } else if (isBranchStart) {
            // Optional: Distinct type for branch start, or just attribute
            type = 'BRANCH_START';
        }

        refinedEvents.push({
            repo_id: repoId,
            event_type: type,
            payload: {
                branch: commit.branch_name,
                author: commit.author,
                message: commit.message,
                commit_hash: commit.commit_hash,
                parents: parents
            },
            event_time: commit.committed_at
        });
    }

    // Use refinedEvents
    for (const event of refinedEvents) {
        await pool.query(
            'INSERT INTO timeline_events (repo_id, event_type, payload, event_time) VALUES ($1, $2, $3, $4)',
            [event.repo_id, event.event_type, event.payload, event.event_time]
        );
    }
};

// Endpoints
app.post('/generate-timeline', async (req, res) => {
    const { repoId } = req.body;
    if (!repoId) return res.status(400).json({ error: 'repoId is required' });

    try {
        await generateTimeline(repoId);
        res.json({ message: 'Timeline generated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate timeline', details: err.message });
    }
});

app.get('/timeline/:repoId', async (req, res) => {
    const { repoId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM timeline_events WHERE repo_id = $1 ORDER BY event_time ASC',
            [repoId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Timeline Processor Service running on port ${PORT}`);
});
