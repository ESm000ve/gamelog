import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StarRatingInput } from "./StarRating";

interface DemoProps {
  initial?: number;
  size?: number;
}

// StarRatingInput is fully controlled (value/onChange owned by the caller),
// so every story wraps it in a small stateful demo and shows the live value
// next to it — useful for confirming clicks, hover-preview, and the keyboard
// (arrow keys / Home / End) all land on the value they claim to.
function Demo({ initial = 0, size = 26 }: DemoProps) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
      <StarRatingInput value={value} onChange={setValue} size={size} />
      <span style={{ color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)", fontVariantNumeric: "tabular-nums" }}>
        {value.toFixed(1)} / 5
      </span>
    </div>
  );
}

const meta = {
  title: "Components/StarRating/Input",
  component: StarRatingInput,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Editable rating control — 10 half-star hit targets (`n - 1 + offset` for `n` in 1–5, `offset` in [0.5, 1]) rendered as a `role=\"radiogroup\"` of `role=\"radio\"` buttons. Fixed in an earlier pass of this audit: originally had no `aria-checked`/roving `tabIndex`, so a screen reader user had no way to perceive the current value and keyboard users needed 10 Tab presses to get past it. Now supports `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown` (±0.5) and `Home`/`End` (min/max), with focus following the selection. Used directly in only 2 of 41 files (`LogEditor.tsx`, `CoverCard.tsx`'s rate popover).",
      },
    },
  },
  // value/onChange are owned by each story's Demo wrapper, not by args — see
  // the Modal stories for the same pattern and why.
  args: {
    value: 0,
    onChange: () => {},
  },
} satisfies Meta<typeof StarRatingInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground ────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => <Demo initial={3} />,
};

// ─── Starting values ────────────────────────────────────────────────────────────

export const Unrated: Story = {
  name: "Unrated (0)",
  render: () => <Demo initial={0} />,
};

export const HalfStarStart: Story = {
  name: "Starts at 3.5",
  render: () => <Demo initial={3.5} />,
};

export const FullStart: Story = {
  name: "Starts at 5 (max)",
  render: () => <Demo initial={5} />,
};

// ─── Sizes seen in real usage ───────────────────────────────────────────────────

export const CoverCardSize: Story = {
  name: "Size 22 (CoverCard rate popover)",
  render: () => <Demo initial={2.5} size={22} />,
};

export const LogEditorSize: Story = {
  name: "Size 24 (LogEditor)",
  render: () => <Demo initial={4} size={24} />,
};

export const DefaultSize: Story = {
  name: "Size 26 (default)",
  render: () => <Demo initial={2} size={26} />,
};

// ─── Keyboard behavior note ─────────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: "Keyboard navigation (try it)",
  parameters: {
    docs: {
      description: {
        story:
          "Click a star to focus the control, then use ArrowLeft/ArrowRight (±0.5), Home (0.5), and End (5) — focus and `aria-checked` both follow the selection, matching standard radiogroup keyboard behavior.",
      },
    },
  },
  render: () => <Demo initial={2.5} />,
};
