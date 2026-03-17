// =============================================================================
// Matrix System — PM2 Ecosystem for AWS EC2
// Manages all 5 Next.js apps + Sentinel + Ghost Runner
// =============================================================================

const APP_DIR = process.env.APP_DIR || '/opt/matrix';

const sharedEnv = {
  NODE_ENV: 'production',
  MATRIX_CLOUD_MODE: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
};

module.exports = {
  apps: [
    // --- Next.js Web Apps (standalone output) ---
    {
      name: 'matrix-citadel',
      cwd: APP_DIR,
      script: `${APP_DIR}/apps/citadel/.next/standalone/apps/citadel/server.js`,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '512M',
      env: {
        ...sharedEnv,
        PORT: 3005,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'matrix-reflect',
      cwd: APP_DIR,
      script: `${APP_DIR}/apps/reflect/.next/standalone/apps/reflect/server.js`,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '512M',
      env: {
        ...sharedEnv,
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'matrix-nexus',
      cwd: APP_DIR,
      script: `${APP_DIR}/apps/nexus/.next/standalone/apps/nexus/server.js`,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '512M',
      env: {
        ...sharedEnv,
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'matrix-rocket',
      cwd: APP_DIR,
      script: `${APP_DIR}/apps/rocket-command/.next/standalone/apps/rocket-command/server.js`,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '512M',
      env: {
        ...sharedEnv,
        PORT: 4000,
        HOSTNAME: '0.0.0.0',
      },
    },
    {
      name: 'matrix-ghost',
      cwd: APP_DIR,
      script: `${APP_DIR}/apps/ghost-command/.next/standalone/apps/ghost-command/server.js`,
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '512M',
      env: {
        ...sharedEnv,
        PORT: 5173,
        HOSTNAME: '0.0.0.0',
      },
    },

    // --- Core Backend Services ---
    {
      name: 'matrix-sentinel',
      cwd: APP_DIR,
      script: 'apps/ghost-command/core/sentinel.cjs',
      args: '--headless',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      max_memory_restart: '256M',
      env: {
        ...sharedEnv,
        MATRIX_ALLOW_LOCAL_SENTINEL: '1',
      },
    },
    {
      name: 'matrix-ghost-runner',
      cwd: APP_DIR,
      script: 'apps/ghost-command/core/ghost-runner.cjs',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      max_memory_restart: '256M',
      env: {
        ...sharedEnv,
        MATRIX_ALLOW_LOCAL_RUNNER: '1',
      },
    },
  ],
};
