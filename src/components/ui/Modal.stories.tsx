import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { X } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface DemoProps {
  title?: string;
  width?: number | string;
  children: React.ReactNode;
}

// Modal is fully controlled (isOpen/onClose owned by the caller) and renders
// null while closed, so every story below wraps it in a small stateful demo
// that starts open — so the canvas isn't blank — and exposes a real "Open
// modal" trigger so the close/reopen cycle, Escape key, and backdrop-click
// can all be exercised by hand from the story canvas.
function ModalDemo({ title, width, children }: DemoProps) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div style={{ padding: "var(--space-8)" }}>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Open modal
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} width={width}>
        {children}
      </Modal>
    </div>
  );
}

const Footer = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--space-2)",
      padding: "var(--space-4) var(--space-5)",
      borderTop: "1px solid var(--apple-separator)",
    }}
  >
    {children}
  </div>
);

const Body = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: "var(--space-5)", color: "var(--apple-secondary-label)", fontSize: "var(--font-size-base)", lineHeight: 1.5 }}>
    {children}
  </div>
);

const meta = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "**Real adoption note:** `Modal` is used directly in exactly **1 of 41** files (`LogEditor.tsx`) — and even there, without the `title` prop, so its built-in header and close button never render; `LogEditor` builds its own header and close button entirely inside `children` instead. Five other components (`ShareListModal`, `RouletteModal`, `YearInReviewModal`, plus the two below with proper reimplementations) build their own modal shell rather than composing this one — see the design-system audit for the full breakdown.",
      },
    },
  },
  // Every story below drives isOpen/onClose through its own ModalDemo wrapper
  // (Modal is a controlled component, so a static arg can't represent "open"
  // in any meaningful way). These args exist only to satisfy Modal's required
  // props for the type checker — none of the `render` functions read them.
  args: {
    isOpen: true,
    onClose: () => {},
    children: null,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── With title (built-in header + close button) ─────────────────────────────

export const WithTitle: Story = {
  render: () => (
    <ModalDemo title="Edit Details" width={470}>
      <Body>
        This is the default configuration: a <code>title</code> renders the built-in header,
        an <code>aria-labelledby</code> pointing at it, and the circular close button in the
        top right.
      </Body>
      <Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Save</Button>
      </Footer>
    </ModalDemo>
  ),
};

// ─── Without title — the only pattern actually used in the app ───────────────

export const WithoutTitle: Story = {
  name: "Without title (real usage — LogEditor.tsx)",
  parameters: {
    docs: {
      description: {
        story:
          "Matches `LogEditor.tsx`'s actual usage: no `title` prop, so `Modal` renders no header and **no close button of its own** — the consumer builds its own header (cover thumbnail, game title, close icon) inside `children`. Worth flagging: any future consumer that omits `title` without also building a custom close affordance would ship a dialog with no visible way to close it besides Escape or clicking the backdrop. Not fixed here (stories only) — logged for a future pass.",
      },
    },
  },
  render: () => (
    <ModalDemo width={470}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-5) var(--space-5) var(--space-4)",
          borderBottom: "1px solid var(--apple-separator)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 58,
            borderRadius: "var(--radius-sm)",
            background: "var(--apple-tertiary-bg)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, fontWeight: 700, color: "var(--apple-label)", fontSize: "var(--font-size-lg)" }}>
          Hollow Knight
        </div>
        <button
          aria-label="Close"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--apple-fill)",
            color: "var(--apple-secondary-label)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      </div>
      <Body>Custom header built entirely in `children`, exactly like the real `LogEditor` modal.</Body>
    </ModalDemo>
  ),
};

// ─── Width variants ────────────────────────────────────────────────────────────

export const Narrow: Story = {
  name: "Narrow width (320)",
  render: () => (
    <ModalDemo title="Remove from library?" width={320}>
      <Body>This will permanently delete this game and its logged sessions.</Body>
      <Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Remove</Button>
      </Footer>
    </ModalDemo>
  ),
};

export const Wide: Story = {
  name: "Wide width (640)",
  render: () => (
    <ModalDemo title="Import Settings" width={640}>
      <Body>
        Wider content area for forms or data with more horizontal room to breathe — width is a
        plain number/string prop, not a size-preset system, so any value works.
      </Body>
      <Footer>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Continue</Button>
      </Footer>
    </ModalDemo>
  ),
};

// ─── Scrolling body content ────────────────────────────────────────────────────

export const LongContent: Story = {
  name: "Long content (scrolls within 92vh)",
  parameters: {
    docs: {
      description: {
        story:
          "The dialog panel caps at `maxHeight: 92vh` with `overflowY: auto` on the body, so long content scrolls inside the modal instead of pushing it off-screen.",
      },
    },
  },
  render: () => (
    <ModalDemo title="Release Notes" width={470}>
      <Body>
        {Array.from({ length: 12 }).map((_, i) => (
          <p key={i} style={{ marginBottom: "var(--space-3)" }}>
            Version 1.{12 - i}.0 — Added backlog roulette, fixed a crash when importing large
            Steam libraries, and rebalanced the year-in-review persona scoring.
          </p>
        ))}
      </Body>
    </ModalDemo>
  ),
};

// ─── Closed state, with a real trigger to open it ─────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`Modal` renders `null` entirely while `isOpen` is `false` — there's no hidden/collapsed DOM to inspect, just nothing. Click \"Open modal\" to mount it.",
      },
    },
  },
  render: () => {
    function ClosedDemo() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div style={{ padding: "var(--space-8)" }}>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Open modal
          </Button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Now Open">
            <Body>This mounted only after the trigger was clicked.</Body>
          </Modal>
        </div>
      );
    }
    return <ClosedDemo />;
  },
};
