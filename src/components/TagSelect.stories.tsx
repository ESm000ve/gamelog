import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TagSelect } from "./TagSelect";
import { db } from "../db/schema";
import type { Tag } from "../types";

// TagSelect reads its tag list from TagsRepo (real Dexie/IndexedDB), not from
// props — there's no mocking layer to inject fake data through. Storybook
// runs in a real browser with real IndexedDB, so the cleanest option is to
// seed the same database the app itself uses, via a Storybook `loader` that
// runs (and is awaited) before each story mounts. `bulkPut` is an upsert, so
// re-seeding on every reload is safe and idempotent.
const SAMPLE_TAGS: Tag[] = [
  { id: "tag-cozy", name: "Cozy", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-metroidvania", name: "Metroidvania", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-coop", name: "Co-op", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-story-rich", name: "Story-rich", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-roguelike", name: "Roguelike", createdAt: Date.now(), updatedAt: Date.now() },
  { id: "tag-difficult", name: "Difficult", createdAt: Date.now(), updatedAt: Date.now() },
];

async function seedTags() {
  await db.tags.bulkPut(SAMPLE_TAGS);
}

async function clearTags() {
  await db.tags.clear();
}

function Demo({ initialIds = [] as string[] }: { initialIds?: string[] }) {
  const [value, setValue] = useState<string[]>(initialIds);
  return (
    <div style={{ width: 360 }}>
      <TagSelect value={value} onChange={setValue} />
    </div>
  );
}

const meta = {
  title: "Components/TagSelect",
  component: TagSelect,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Reads and writes tags through the real `TagsRepo`/Dexie data layer — there's no prop-level mock for it. These stories seed the browser's actual IndexedDB with sample tags via a Storybook `loader` before each render (see the story source). Type in the input to see autocomplete filtering, press Enter to create a new tag, or Backspace on an empty input to remove the last selected tag.",
      },
    },
  },
  loaders: [seedTags],
  // TagSelect is fully controlled; every story below drives value/onChange
  // through its own Demo wrapper (see the Modal stories for the same
  // pattern). These args exist only to satisfy the type checker.
  args: {
    value: [],
    onChange: () => {},
  },
} satisfies Meta<typeof TagSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Interactive playground ────────────────────────────────────────────────────

export const Playground: Story = {
  render: () => <Demo />,
};

// ─── Pre-selected tags ──────────────────────────────────────────────────────────

export const WithSelectedTags: Story = {
  name: "With tags already selected",
  render: () => <Demo initialIds={["tag-cozy", "tag-metroidvania"]} />,
};

// ─── Empty database — the "create new" path ────────────────────────────────────

export const NoExistingTags: Story = {
  name: "No tags in database yet",
  loaders: [clearTags],
  parameters: {
    docs: {
      description: {
        story:
          'With an empty tag table, typing anything shows only the "Create …" option — this is the first-run state for a fresh install.',
      },
    },
  },
  render: () => <Demo />,
};
