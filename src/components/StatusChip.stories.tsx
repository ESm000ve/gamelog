import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusChip, STATUS_COLORS } from "./StatusChip";
import type { Status } from "../types";

const meta = {
  title: "Components/StatusChip",
  component: StatusChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "**Real adoption correction:** the design-system audit originally scored this component 8/10, \"used in 5 files.\" That figure conflated two different things — the `<StatusChip>` **component** has **zero** real JSX usages anywhere in the app; what's actually used in those 5 files is its exported `STATUS_COLORS`/`STATUS_SUBTLE` color-map constants, each consumer (`CoverCard`, `LogEditor`, `LibraryTableView`, `StatsScreen`, `GameDetailScreen`) hand-rolling its own status pill/badge markup around those colors instead of rendering this component. Also worth noting: this file also exports `COMPLETION_COLORS`/`COMPLETION_SUBTLE` for the separate `Completion` taxonomy (Completed/Mastered/Abandoned/Shelved), but `StatusChip`'s own `label` prop only accepts `Status | \"All\"` — there's no way to render a completion chip through this component at all, which is exactly why `LibraryTableView` hand-rolls its completion badges separately.",
      },
    },
  },
  argTypes: {
    label: {
      control: "select",
      options: ["All", "Wishlist", "Backlog", "Playing", "Played"],
    },
    active: { control: "boolean" },
    compact: { control: "boolean", description: "Tighter padding (3px 10px, off-scale — flagged, not tokenized) vs. default (6px var(--space-3))." },
    hideCount: { control: "boolean" },
    count: { control: "number" },
    dotColor: {
      control: "color",
      description: "Free-form — the component does not derive this from `label` automatically. Callers pass STATUS_COLORS[status] themselves.",
    },
  },
  args: {
    label: "Playing",
    active: true,
    compact: false,
    hideCount: false,
    count: 12,
    dotColor: STATUS_COLORS.Playing,
    onClick: () => {},
  },
} satisfies Meta<typeof StatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground ────────────────────────────────────────────────────

export const Playground: Story = {};

// ─── Active / inactive ──────────────────────────────────────────────────────────

export const Active: Story = {
  args: { active: true },
};

export const Inactive: Story = {
  args: { active: false },
};

// ─── Compact vs default padding ────────────────────────────────────────────────

export const Compact: Story = {
  args: { compact: true },
};

export const DefaultSize: Story = {
  name: "Default (non-compact)",
  args: { compact: false },
};

// ─── Count display ──────────────────────────────────────────────────────────────

export const WithCount: Story = {
  args: { count: 12, hideCount: false },
};

export const WithoutCount: Story = {
  name: "No count (hideCount)",
  args: { hideCount: true },
};

export const ZeroCount: Story = {
  name: "Count of 0",
  args: { count: 0 },
};

// ─── No dot (e.g. the "All" filter option never needs one) ───────────────────

export const NoDot: Story = {
  name: 'No dot color (e.g. "All")',
  args: { label: "All", dotColor: undefined, count: 47 },
};

// ─── All four real Status values, correctly dot-colored ──────────────────────

export const AllStatuses: Story = {
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {(["Wishlist", "Backlog", "Playing", "Played"] as Status[]).map((status) => (
        <StatusChip
          key={status}
          label={status}
          dotColor={STATUS_COLORS[status]}
          active
          count={Math.floor(Math.random() * 40) + 1}
          onClick={() => {}}
        />
      ))}
    </div>
  ),
};

// ─── Realistic composition: a filter row with one active selection ───────────
// ─── (the pattern the component's props clearly imply, even though no real ──
// ─── screen in the app actually composes it this way)                     ──

export const FilterRow: Story = {
  name: "Realistic composition — filter row",
  parameters: { layout: "padded", controls: { disable: true } },
  render: () => {
    function Demo() {
      const [active, setActive] = useState<Status | "All">("All");
      const counts: Record<Status | "All", number> = {
        All: 82,
        Wishlist: 14,
        Backlog: 31,
        Playing: 4,
        Played: 33,
      };
      const options: (Status | "All")[] = ["All", "Wishlist", "Backlog", "Playing", "Played"];
      return (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {options.map((opt) => (
            <StatusChip
              key={opt}
              label={opt}
              dotColor={opt === "All" ? undefined : STATUS_COLORS[opt]}
              active={active === opt}
              count={counts[opt]}
              onClick={() => setActive(opt)}
            />
          ))}
        </div>
      );
    }
    return <Demo />;
  },
};
