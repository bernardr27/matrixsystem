const { Octokit } = require('@octokit/rest');

class GitHubPlugin {
    constructor() {
        this.name = 'github';
        this.display_name = 'GitHub Architect';
        this.description = 'Source code repository management and issue tracking.';
        this.integration_type = 'devops'; // 'notification', 'devops', 'webhook'
        this.rateLimit = 5000; // API requests per hour (approx)

        // Config will be injected at runtime
        this.octokit = null;
    }

    /**
     * Initialize the Octokit client with config
     */
    initClient(config) {
        // support both 'access_token' (legacy) and 'api_key' fields
        const token = config.api_key || config.access_token || process.env.GITHUB_TOKEN;

        if (!token) {
            throw new Error('Missing GitHub Access Token');
        }

        if (!this.octokit) {
            this.octokit = new Octokit({
                auth: token,
                userAgent: 'matrix-sentinel/3.0'
            });
        }

        // Extract owner/repo from config or env
        // Expected config: { extra_settings: { owner: 'user', repo: 'repo' } }
        // Or process.env.GITHUB_REPO = 'user/repo'
        let owner = 'bernardr27';
        let repo = 'matrixsystem';

        if (config.extra_settings?.owner && config.extra_settings?.repo) {
            owner = config.extra_settings.owner;
            repo = config.extra_settings.repo;
        } else if (process.env.GITHUB_REPO) {
            const parts = process.env.GITHUB_REPO.split('/');
            if (parts.length === 2) {
                owner = parts[0];
                repo = parts[1];
            }
        }

        return { owner, repo };
    }

    /**
     * Execute a GitHub Action
     * @param {string} action - 'status', 'issues', 'create_issue', 'commits'
     * @param {object} params - Action specific parameters
     * @param {object} config - Integration configuration
     */
    async execute(action, params, config) {
        const { owner, repo } = this.initClient(config);

        switch (action) {
            case 'status':
                return await this.getRepoStatus(owner, repo);

            case 'issues':
                return await this.getIssues(owner, repo, params);

            case 'create_issue':
                return await this.createIssue(owner, repo, params);

            case 'commits':
                return await this.getRecentCommits(owner, repo, params);

            case 'notify':
                // Not a notification provider, but could create an issue as a "notification"
                if (params.severity === 'critical') {
                    return await this.createIssue(owner, repo, {
                        title: `[CRITICAL] ${params.title || 'System Alert'}`,
                        body: params.message
                    });
                }
                return { skipped: true, reason: 'GitHub is not a primary notification channel' };

            case 'trigger_workflow':
                return await this.triggerWorkflow(owner, repo, params);

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    // --- Actions ---

    async getRepoStatus(owner, repo) {
        const { data } = await this.octokit.repos.get({ owner, repo });
        return {
            name: data.name,
            private: data.private,
            stars: data.stargazers_count,
            forks: data.forks_count,
            issues: data.open_issues_count,
            updated_at: data.updated_at,
            url: data.html_url
        };
    }

    async getIssues(owner, repo, params = {}) {
        const { data } = await this.octokit.issues.listForRepo({
            owner,
            repo,
            state: params.state || 'open',
            per_page: params.limit || 5,
            sort: 'updated',
        });

        return data.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            user: issue.user.login,
            url: issue.html_url,
            created_at: issue.created_at
        }));
    }

    async createIssue(owner, repo, params) {
        if (!params.title) throw new Error('Issue title required');

        const { data } = await this.octokit.issues.create({
            owner,
            repo,
            title: params.title,
            body: params.body || 'No description provided.',
            labels: params.labels || ['matrix-auto']
        });

        return {
            number: data.number,
            url: data.html_url,
            title: data.title
        };
    }

    async getRecentCommits(owner, repo, params) {
        const { data } = await this.octokit.repos.listCommits({
            owner,
            repo,
            per_page: params.limit || 5
        });

        return data.map(commit => ({
            sha: commit.sha.substring(0, 7),
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url
        }));
    }

    async triggerWorkflow(owner, repo, params) {
        const workflow_id = params.workflow_id || 'matrix-shadow.yml';
        const ref = params.ref || 'main';
        const inputs = params.inputs || {};

        const { data } = await this.octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id,
            ref,
            inputs
        });

        return {
            success: true,
            workflow_id,
            ref,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = GitHubPlugin;
