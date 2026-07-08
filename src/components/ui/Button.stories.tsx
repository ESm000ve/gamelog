import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Upload, Trash2, Plus } from "lucide-react";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger"],
      description: "Visual style. Drives background/border/color entirely from theme.css tokens.",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Controls padding, minHeight, fontSize, and borderRadius — all token-driven per size step.",
    },
    loading: {
      control: "boolean",
      description: "Shows a spinner and forces disabled.",
    },
    disabled: {
      control: "boolean",
    },
    children: {
      control: "text",
    },
  },
  args: {
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
    children: "Button",
    onClick: () => {},
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground — every control live ─────────────────────────────

export const Playground: Story = {};

// ─── One story per variant (real usage: LogEditor.tsx, SettingsScreen.tsx) ──

export const Primary: Story = {
  args: { variant: "primary", children: "Save" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Cancel" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Share & Export" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancel" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Remove" },
};

// ─── One story per size ───────────────────────────────────────────────────────

export const Small: Story = {
  args: { size: "sm", children: "Add 3 games" },
};

export const Medium: Story = {
  args: { size: "md", children: "Button" },
};

export const Large: Story = {
  args: { size: "lg", children: "Add Game" },
};

// ─── States ────────────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: { loading: true, children: "Save" },
  parameters: {
    docs: {
      description: {
        story:
          "**Known issue, not fixed in this pass (stories only):** the loading spinner's inline style references `animation: \"spin 1s linear infinite\"`, but no `@keyframes spin` is defined anywhere in the app's CSS — only `@keyframes pulse` exists in `globals.css`. The `Loader2` icon currently renders static instead of spinning. Flagging here since the story surfaces it directly; logged for a future fix pass.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Wipe & Replace" },
};

// ─── Composition: icon + text (real usage: SettingsScreen.tsx export/import) ──

export const WithLeadingIcon: Story = {
  name: "With icon (leading)",
  args: {
    variant: "secondary",
    children: (
      <>
        <Download size={18} />
        Export Backup
      </>
    ),
  },
};

export const WithLeadingIconPrimary: Story = {
  name: "With icon (leading, primary)",
  args: {
    variant: "primary",
    children: (
      <>
        <Upload size={18} />
        Import Backup...
      </>
    ),
  },
};

export const DangerWithIcon: Story = {
  name: "With icon (danger)",
  args: {
    variant: "danger",
    children: (
      <>
        <Trash2 size={16} />
        Wipe & Replace
      </>
    ),
  },
};

export const SmallWithIcon: Story = {
  name: "With icon (small)",
  args: {
    variant: "primary",
    size: "sm",
    children: (
      <>
        <Plus size={14} />
        Add 3 games
      </>
    ),
  },
};

// ─── Composition: full-width (real usage: AddToListSheet.tsx, SingleListScreen.tsx) ──

export const FullWidth: Story = {
  args: {
    variant: "secondary",
    children: "Cancel",
    style: { width: "100%" },
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

// ─── Showcase matrices — every variant/size combination at once, for visual ──
// ─── reference and regression checking without clicking through Controls.  ──

export const AllVariants: Story = {
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  ),
};

export const AllStates: Story = {
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="primary">Default</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
};
