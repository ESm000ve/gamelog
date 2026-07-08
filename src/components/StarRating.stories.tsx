import type { Meta, StoryObj } from "@storybook/react-vite";
import { StarRating } from "./StarRating";

const meta = {
  title: "Components/StarRating/Display",
  component: StarRating,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Read-only rating display. Worth calling out: this is one of the few places in the codebase that gets ARIA right on the first try — the whole row is wrapped in a single `role=\"img\"` with a computed `aria-label` (\"4.5 out of 5 stars\"), and every individual star icon is `aria-hidden`, so a screen reader hears one clean announcement instead of five fragments. Used directly in only 2 of 41 files (`LogEditor.tsx`, `GameDetailScreen.tsx`); a bug where `LibraryTableView.tsx` displayed the same 0–5 `rating` value with a hardcoded `/ 10` suffix was found and fixed in an earlier pass of this audit.",
      },
    },
  },
  argTypes: {
    rating: {
      control: { type: "range", min: 0, max: 5, step: 0.5 },
      description: "0–5 in 0.5 steps.",
    },
    size: {
      control: { type: "number", min: 8, max: 32 },
      description: "Icon size in px. Real usage: 11 (default, CoverCard-style contexts), 12 (LogEditor), 14 (GameDetailScreen).",
    },
    showValue: { control: "boolean" },
  },
  args: {
    rating: 4.5,
    size: 11,
    showValue: true,
  },
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground ────────────────────────────────────────────────────

export const Playground: Story = {};

// ─── Rating values ──────────────────────────────────────────────────────────────

export const WholeNumber: Story = {
  name: "Whole number (3.0)",
  args: { rating: 3 },
};

export const HalfStar: Story = {
  name: "Half star (3.5)",
  args: { rating: 3.5 },
};

export const ZeroRating: Story = {
  name: "Zero (0.0)",
  args: { rating: 0 },
};

export const PerfectRating: Story = {
  name: "Perfect (5.0)",
  args: { rating: 5 },
};

// ─── Value label ────────────────────────────────────────────────────────────────

export const WithoutValue: Story = {
  name: "Without numeric value",
  args: { showValue: false },
};

// ─── Sizes seen in real usage ───────────────────────────────────────────────────

export const DefaultSize: Story = {
  name: "Size 11 (default)",
  args: { size: 11 },
};

export const LogEditorSize: Story = {
  name: "Size 12 (LogEditor)",
  args: { size: 12 },
};

export const GameDetailSize: Story = {
  name: "Size 14 (GameDetailScreen)",
  args: { size: 14 },
};

// ─── Every 0.5 increment at once, for visual reference ────────────────────────

export const AllValues: Story = {
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {Array.from({ length: 11 }, (_, i) => i * 0.5).map((r) => (
        <StarRating key={r} rating={r} size={14} />
      ))}
    </div>
  ),
};
