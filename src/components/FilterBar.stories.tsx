import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterBar } from "./FilterBar";
import type { FilterSpec } from "../services/filterEngine";
import { db } from "../db/schema";
import type { Tag } from "../types";

// Same reasoning as TagSelect.stories.tsx: FilterBar's Tags facet reads
// straight from the real TagsRepo/Dexie layer, so these stories seed the
// browser's actual IndexedDB via a Storybook loader before each render.
const SAMPLE_TAGS: Tag[] = [
  { id: "tag-cozy", name: "Cozy", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-metroidvania", name: "Metroidvania", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-coop", name: "Co-op", createdAt: Date.now(), updatedAt: Date.now() },
];

async function seedTags() {
  await db.tags.bulkPut(SAMPLE_TAGS);
}

function Demo({ initialSpec = {} as FilterSpec }: { initialSpec?: FilterSpec }) {
  const [spec, setSpec] = useState<FilterSpec>(initialSpec);
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <FilterBar spec={spec} onChange={setSpec} />
    </div>
  );
}

const meta = {
  title: "Components/FilterBar",
  component: FilterBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'The library filter dropdown — Status, Genres, Platforms, and Tags facets plus three numeric ranges (Release Year, Length, Rating). Click "Filters" to open the panel; the badge count on the button reflects every active facet. See `ActiveFilterBadges.stories.tsx` for the companion removable-badge row this component is normally paired with.',
      },
    },
  },
  loaders: [seedTags],
  // FilterBar is fully controlled; every story below drives spec/onChange
  // through its own Demo wrapper. These args exist only to satisfy the type
  // checker — see the Modal stories for the same pattern.
  args: {
    spec: {},
    onChange: () => {},
  },
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground ────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => <Demo />,
};

// ─── With active filters (badge count visible on the button) ─────────────────

export const WithActiveFilters: Story = {
  name: "With active filters",
  render: () => (
    <Demo
      initialSpec={{
        status: ["Playing", "Backlog"],
        genres: ["RPG"],
        rating: { min: 3 },
      }}
    />
  ),
};

// ─── Panel forced open, for visual reference without clicking through ────────

export const PanelOpen: Story = {
  name: "Panel open (forced, for reference)",
  parameters: {
    docs: {
      description: {
        story:
          "FilterBar manages its own open/closed state internally with no prop to force it — this story just clicks the trigger once on mount so the panel is visible without requiring interaction.",
      },
    },
  },
  render: () => {
    function ForceOpenDemo() {
      const [spec, setSpec] = useState<FilterSpec>({ status: ["Playing"], platforms: ["PC"] });
      return (
        <div
          style={{ display: "flex", justifyContent: "flex-end" }}
          ref={(el) => {
            // Click the trigger once, after mount, purely to demonstrate the
            // open panel in a static story — not a pattern used in the app.
            if (el && !el.dataset.opened) {
              el.dataset.opened = "true";
              requestAnimationFrame(() => el.querySelector("button")?.click());
            }
          }}
        >
          <FilterBar spec={spec} onChange={setSpec} />
        </div>
      );
    }
    return <ForceOpenDemo />;
  },
};
