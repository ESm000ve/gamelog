import type { Preview, Decorator } from "@storybook/react-vite";
import "../src/styles/index.css";

// theme.css keys off two attributes on <html>: data-theme (light/dark) and
// data-accent (8 accent options). Wiring both to Storybook's toolbar means
// every story is reviewable across all 16 real token combinations without
// any per-story code.
const THEMES = ["dark", "light"] as const;
const ACCENTS = [
  "indigo",
  "green",
  "blue",
  "orange",
  "pink",
  "gold",
  "purple",
  "red",
] as const;

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) || "dark";
  const accent = (context.globals.accent as string) || "indigo";

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-accent", accent);

  return (
    <div
      style={{
        background: "var(--apple-window-bg)",
        color: "var(--apple-label)",
        fontFamily: "var(--apple-font-text)",
        minHeight: "100vh",
        padding: "var(--space-8)",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Fail the a11y check on real violations, not just incomplete/needs-review results.
      test: "error",
    },
    options: {
      storySort: {
        order: ["Welcome", "UI", "Components"],
      },
    },
  },
  initialGlobals: {
    theme: "dark",
    accent: "indigo",
  },
  globalTypes: {
    theme: {
      description: "Light / dark mode (theme.css data-theme)",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: THEMES.map((t) => ({ value: t, title: t })),
        dynamicTitle: true,
      },
    },
    accent: {
      description: "Accent color (theme.css data-accent)",
      toolbar: {
        title: "Accent",
        icon: "paintbrush",
        items: ACCENTS.map((a) => ({ value: a, title: a })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
