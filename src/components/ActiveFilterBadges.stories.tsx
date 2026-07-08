import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActiveFilterBadges } from "./FilterBar";
import type { FilterSpec } from "../services/filterEngine";
import { db } from "../db/schema";
import type { Tag } from "../types";

const SAMPLE_TAGS: Tag[] = [
  { id: "tag-cozy", name: "Cozy", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-metroidvania", name: "Metroidvania", createdAt: Date.now(), updatedAt: Date.now() },
];

async function seedTags() {
  await db.tags.bulkPut(SAMPLE_TAGS);
}

function Demo({ initialSpec }: { initialSpec: FilterSpec }) {
  const [spec, setSpec] = useState<FilterSpec>(initialSpec);
  return <ActiveFilterBadges spec={spec} onChange={setSpec} />;
}

const meta = {
  title: "Components/FilterBar/ActiveFilterBadges",
  component: ActiveFilterBadges,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Removable-badge row that normally sits next to `FilterBar` — one badge per active facet value (including resolved tag names, not raw IDs), plus a \"Clear all\" action. Renders nothing (`return null`) when no filters are active — see the Empty story.",
      },
    },
  },
  loaders: [seedTags],
  args: {
    spec: {},
    onChange: () => {},
  },
} satisfies Meta<typeof ActiveFilterBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Demo
      initialSpec={{
        status: ["Playing"],
        genres: ["RPG", "Indie"],
        platforms: ["Nintendo Switch"],
        tagIds: ["tag-cozy"],
        releaseYear: { min: 2015 },
        rating: { min: 3 },
      }}
    />
  ),
};

export const SingleFilter: Story = {
  name: "One active filter",
  render: () => <Demo initialSpec={{ status: ["Backlog"] }} />,
};

export const TagFilterResolvesName: Story = {
  name: "Tag filter (resolves ID → name)",
  render: () => <Demo initialSpec={{ tagIds: ["tag-metroidvania"] }} />,
};

export const Empty: Story = {
  name: "No active filters (renders nothing)",
  parameters: {
    docs: {
      description: {
        story: "With an empty spec, this component returns `null` — there's no empty state to show, just nothing in the layout.",
      },
    },
  },
  render: () => <Demo initialSpec={{}} />,
};
