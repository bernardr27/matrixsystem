/** @type {import('@storybook/nextjs').StorybookConfig} */
const config = {
  stories: ['../apps/**/src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: {
    autodocs: true
  }
};

export default config;
