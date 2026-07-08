import type { StorybookConfig } from "@storybook/react-vite";
import type { UserConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Set the base path so asset URLs resolve correctly on GitHub Pages
  // (served at /gamelog/, not at the root).
  viteFinal: async (config: UserConfig) => {
    if (process.env.NODE_ENV === "production") {
      config.base = "/gamelog/";
    }
    return config;
  },
};

export default config;
