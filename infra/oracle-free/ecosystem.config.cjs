module.exports = {
  apps: [
    {
      name: "matrix-sentinel",
      cwd: "/opt/matrix",
      script: "apps/ghost-command/core/sentinel.cjs",
      args: "--headless",
      interpreter: "node",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        MATRIX_CLOUD_MODE: "true",
        MATRIX_ALLOW_LOCAL_SENTINEL: "1"
      }
    },
    {
      name: "matrix-ghost-runner",
      cwd: "/opt/matrix",
      script: "apps/ghost-command/core/ghost-runner.cjs",
      interpreter: "node",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        MATRIX_CLOUD_MODE: "true",
        MATRIX_ALLOW_LOCAL_RUNNER: "1"
      }
    }
  ]
};
