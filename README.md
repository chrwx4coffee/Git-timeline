# GitHub Repository Timeline Visualizer

A microservice-based platform to analyze GitHub repositories and visualize their history as an interactive timeline.

## Architecture

- **Auth Service**: Node.js/Express (Port 3001) - User management & JWT Auth.
- **GitHub Fetch Service**: Node.js/Express (Port 3002) - Fetches data from GitHub API.
- **Timeline Processor Service**: Node.js/Express (Port 3003) - Processes commits into timeline events.
- **Frontend**: React + Vite + Tailwind (Port 3000) - Interactive D3.js visualization.
- **Database**: PostgreSQL (Port 5432).

## Prerequisites

- Docker & Docker Compose
- GitHub Personal Access Token (PAT)

## Setup

1.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your details.
    ```bash
    cp .env.example .env
    # Edit .env and add your GITHUB_TOKEN
    ```

2.  **Start Services**:
    ```bash
    docker-compose up --build
    ```

3.  **Access Application**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1.  Register a new account.
2.  Login.
3.  Enter a public GitHub repository URL (e.g., `https://github.com/facebook/react`).
4.  Wait for the analysis to complete.
5.  View the interactive timeline.

## Development

- Services are located in `services/`.
- Database init script is in `database/init.sql`.
- Changes to source code in `services/` will require a rebuild or restart depending on the setup (currently setup for production build in Docker, but `nodemon`/`vite` are configured in `package.json` for local dev if run outside Docker).
