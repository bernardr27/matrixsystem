/**
 * Matrix Voice Commands
 * 
 * Voice trigger patterns for Ghost Command AI assistant.
 * These patterns are matched against voice input to execute Matrix tools.
 */

export type VoiceCommand = {
    id: string;
    patterns: string[];        // Voice patterns to match
    action: string;            // ghost_bridge command to execute
    response: string;          // AI response to speak
    params?: Record<string, string>; // Optional parameters
    requiresConfirmation?: boolean;  // Ask for confirmation before executing
};

export const VOICE_COMMANDS: VoiceCommand[] = [
    // ═══════════════════════════════════════════════════════════════════════
    // TRIAGE COMMANDS
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: 'triage_health',
        patterns: [
            'check health',
            'health check',
            'how healthy is',
            'run triage',
            'scan for issues',
            'code health'
        ],
        action: 'triage:oracle',
        response: 'Running health scan now...',
    },
    {
        id: 'triage_fix',
        patterns: [
            'fix issues',
            'clean up code',
            'run purge',
            'fix the code',
            'auto fix'
        ],
        action: 'triage:purge:fix',
        response: 'Starting auto-fix. This will clean up lint issues and dead code.',
        requiresConfirmation: true
    },
    {
        id: 'triage_evolve',
        patterns: [
            'scan for improvements',
            'find improvements',
            'run evolve',
            'what can be improved',
            'suggest improvements'
        ],
        action: 'triage:evolve',
        response: 'Scanning for improvement opportunities...',
    },
    {
        id: 'triage_watch',
        patterns: [
            'watch health',
            'monitor health',
            'start monitoring',
            'live health'
        ],
        action: 'triage:watch',
        response: 'Starting live health monitoring...',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEPLOY COMMANDS
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: 'deploy_verify',
        patterns: [
            'verify build',
            'check build',
            'can we deploy',
            'is it ready to deploy',
            'pre-deploy check'
        ],
        action: 'deploy:verify',
        response: 'Running pre-deployment verification...',
    },
    {
        id: 'deploy_preview',
        patterns: [
            'deploy to preview',
            'deploy preview',
            'staging deploy',
            'test deployment'
        ],
        action: 'deploy:preview',
        response: 'Deploying to preview environment...',
        requiresConfirmation: true
    },
    {
        id: 'deploy_production',
        patterns: [
            'deploy to production',
            'go live',
            'ship it',
            'deploy to prod',
            'production deploy'
        ],
        action: 'deploy:production',
        response: 'Initiating production deployment. This will update the live site.',
        requiresConfirmation: true
    },
    {
        id: 'deploy_rollback',
        patterns: [
            'roll back',
            'rollback',
            'revert deployment',
            'undo deploy',
            'go back'
        ],
        action: 'deploy:rollback',
        response: 'Preparing to rollback to previous deployment.',
        requiresConfirmation: true
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BACKUP COMMANDS
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: 'backup_create',
        patterns: [
            'create backup',
            'backup now',
            'save backup',
            'back it up',
            'make a backup'
        ],
        action: 'backup:create',
        response: 'Creating backup of all applications...',
    },
    {
        id: 'backup_list',
        patterns: [
            'list backups',
            'show backups',
            'what backups',
            'backup history'
        ],
        action: 'backup:list',
        response: 'Here are your recent backups...',
    },
    {
        id: 'backup_restore',
        patterns: [
            'restore backup',
            'restore from backup',
            'recover backup',
            'load backup'
        ],
        action: 'backup:restore',
        response: 'Which backup would you like to restore?',
        requiresConfirmation: true
    },
    {
        id: 'backup_cloud',
        patterns: [
            'sync to cloud',
            'cloud backup',
            'upload backup',
            'save to cloud'
        ],
        action: 'backup:cloud',
        response: 'Syncing backup to cloud storage...',
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM COMMANDS
    // ═══════════════════════════════════════════════════════════════════════
    {
        id: 'system_status',
        patterns: [
            'system status',
            'how is the system',
            'status check',
            'is everything running'
        ],
        action: 'system:status',
        response: 'Checking system status...',
    },
    {
        id: 'analytics_insights',
        patterns: [
            'show analytics',
            'show insights',
            'usage stats',
            'how am I doing'
        ],
        action: 'analytics:insights',
        response: 'Loading your analytics dashboard...',
    },
    {
        id: 'achievements_profile',
        patterns: [
            'show achievements',
            'my achievements',
            'check my level',
            'show my profile',
            'how much XP'
        ],
        action: 'achievements:profile',
        response: 'Loading your achievement profile...',
    }
];

/**
 * Match voice input to a command
 */
export function matchVoiceCommand(input: string): VoiceCommand | null {
    const normalizedInput = input.toLowerCase().trim();

    for (const command of VOICE_COMMANDS) {
        for (const pattern of command.patterns) {
            if (normalizedInput.includes(pattern.toLowerCase())) {
                return command;
            }
        }
    }

    return null;
}

/**
 * Extract app name from voice input
 */
export function extractAppName(input: string): string | null {
    const normalizedInput = input.toLowerCase().trim();
    const appPatterns = [
        /(?:on|for|in|check|scan|deploy|backup)\s+([\w-]+)/i,
        /([\w-]+)\s+(?:health|status|deployment|backup)/i,
    ];

    const knownApps = ['reflect', 'nexus', 'ghost-command', 'ghost', 'matrix', 'matrix-hub', 'matrixhub'];
    const aliasMap: Record<string, string> = {
        'matrix': 'nexus',
        'matrix-hub': 'nexus',
        'matrixhub': 'nexus',
    };

    for (const pattern of appPatterns) {
        const match = input.match(pattern);
        if (match) {
            const normalized = match[1].toLowerCase();
            if (knownApps.includes(normalized)) {
                return aliasMap[normalized] || normalized;
            }
        }
    }

    if (normalizedInput.includes('matrix hub')) {
        return 'nexus';
    }

    return null;
}

export default VOICE_COMMANDS;
