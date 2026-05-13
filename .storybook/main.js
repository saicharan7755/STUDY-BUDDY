import { defineConfig } from '@storybook/react/dist/common';

const config = defineConfig({
  stories: ['../src/**/*.stories.{js,jsx}'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-controls',
  ],
  framework: {
    name: '@storybook/react',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  core: {
    disableTelemetry: true,
  },
});

export default config;
