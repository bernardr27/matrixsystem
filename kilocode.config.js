/**
 * Kilocode Configuration
 * Code generation CLI for Matrix V9 Singularity
 * 
 * Reference: brain share/KILOCODE_INTEGRATION_GUIDE.md
 */

module.exports = {
  projectName: 'Matrix V9 Singularity',
  projectRoot: process.cwd(),
  
  /**
   * Application configuration
   * Maps app names to their respective ports and root directories
   */
  apps: {
    citadel: {
      name: 'Citadel Sovereign OS',
      port: 3005,
      root: 'apps/citadel',
      type: 'nextjs',
      description: 'Premium login UI + V9 HUD',
    },
    reflect: {
      name: 'Reflect v9.0',
      port: 3000,
      root: 'apps/reflect',
      type: 'nextjs',
      description: 'Universal Pattern consensus + 3D Mind Matrix',
    },
    nexus: {
      name: 'Nexus Analytics',
      port: 3001,
      root: 'apps/nexus',
      type: 'nextjs',
      description: 'Real-time analytics hub',
    },
    rocket: {
      name: 'Rocket Command',
      port: 4000,
      root: 'apps/rocket-command',
      type: 'nextjs',
      description: 'AGI pipeline executor',
    },
    ghost: {
      name: 'Ghost Command',
      port: 5173,
      root: 'apps/ghost-command',
      type: 'nextjs',
      description: 'Multi-protocol operations core',
    },
  },

  /**
   * Database configuration
   */
  database: {
    provider: 'supabase',
    url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  /**
   * Generation templates configuration
   */
  templates: {
    api: {
      language: 'typescript',
      framework: 'nextjs',
      auth: 'supabase', // Include Supabase auth by default
      errorHandling: 'next-response', // Use Next.js Response object
      middleware: true, // Include middleware support
    },
    component: {
      language: 'typescript',
      framework: 'react',
      styling: 'tailwind', // Use Tailwind CSS
      testing: true, // Generate test files
      storybook: true, // Generate Storybook stories
      hooks: true, // Generate custom hooks
    },
    hook: {
      language: 'typescript',
      testing: true,
      documentation: true,
    },
    schema: {
      provider: 'supabase',
      generateTypes: true,
      generateMigrations: true,
    },
  },

  /**
   * Shared libraries configuration
   * Path to @matrix-lib packages
   */
  libs: {
    root: 'libs',
    packages: [
      'supabase',
      'ui',
      'hooks',
      'types',
      'utils',
    ],
  },

  /**
   * Code generation patterns
   */
  patterns: {
    apiPrefix: '/api',
    componentDir: 'components',
    hookDir: 'hooks',
    libDir: 'lib',
    typeDir: 'types',
  },

  /**
   * Output directories by app
   * Where generated code will be created
   */
  output: {
    citadel: {
      api: 'apps/citadel/src/app/api',
      components: 'apps/citadel/src/components',
      hooks: 'apps/citadel/src/hooks',
      lib: 'apps/citadel/src/lib',
      types: 'apps/citadel/src/types',
    },
    reflect: {
      api: 'apps/reflect/src/app/api',
      components: 'apps/reflect/src/components',
      hooks: 'apps/reflect/src/hooks',
      lib: 'apps/reflect/src/lib',
      types: 'apps/reflect/src/types',
    },
    nexus: {
      api: 'apps/nexus/src/app/api',
      components: 'apps/nexus/src/components',
      hooks: 'apps/nexus/src/hooks',
      lib: 'apps/nexus/src/lib',
      types: 'apps/nexus/src/types',
    },
    rocket: {
      api: 'apps/rocket-command/src/app/api',
      components: 'apps/rocket-command/src/components',
      hooks: 'apps/rocket-command/src/hooks',
      lib: 'apps/rocket-command/src/lib',
      types: 'apps/rocket-command/src/types',
    },
    ghost: {
      api: 'apps/ghost-command/src/app/api',
      components: 'apps/ghost-command/src/components',
      hooks: 'apps/ghost-command/src/hooks',
      lib: 'apps/ghost-command/src/lib',
      types: 'apps/ghost-command/src/types',
    },
  },

  /**
   * Development server configuration
   */
  dev: {
    turbopack: true, // Use Turbopack for faster builds
    hotReload: true,
    openBrowser: false,
  },

  /**
   * Build configuration
   */
  build: {
    optimization: true,
    minify: true,
    sourceMap: true,
  },

  /**
   * Feature flags
   */
  features: {
    supabaseIntegration: true,
    discordIntegration: true,
    telegramIntegration: true,
    openaiIntegration: true,
    groqIntegration: true,
    designAutomation: true,
    mobileScaffolding: true,
    qualityGateEnforcement: true,
    errorTracking: false, // Will be enabled in Phase 3
    performanceMonitoring: false, // Will be enabled in Phase 4
  },

  /**
   * Monorepo configuration
   */
  monorepo: {
    type: 'npm-workspaces',
    useTurbo: true,
    parallelBuild: true,
  },

  /**
   * Upgrade playbooks distilled from external workflow research.
   * These are consumed by scripts/tools/video_upgrade_playbook.cjs.
   */
  upgradePlaybooks: {
    web3d: {
      targetApp: 'reflect',
      outcome: '3D hero and premium interaction surfaces',
      stack: ['antigravity', 'spline', 'tailwind', 'framer-motion'],
      phases: [
        'inspiration_capture',
        'hero_structure',
        'motion_polish',
        'deployment_readiness',
      ],
    },
    mobile: {
      targetApp: 'rocket',
      outcome: 'mobile-first UX and app shell prototypes',
      stack: ['flutter', 'stitch', 'supabase'],
      phases: [
        'app_spec',
        'screen_scaffold',
        'state_and_data',
        'qa_and_ship',
      ],
    },
    quality: {
      targetApp: 'monorepo',
      outcome: 'fewer AI-regressions through enforced validation',
      stack: ['turbo', 'eslint', 'typescript', 'tests'],
      phases: [
        'small_scopes',
        'explicit_specs',
        'gate_checks',
        'post_merge_review',
      ],
    },
  },
};
