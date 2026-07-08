import type { Meta, StoryObj } from "@storybook/react-vite";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "var(--space-8)" }}>
      <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: "var(--space-3)", color: "var(--apple-label)" }}>
        {title}
      </h2>
      <div style={{ fontSize: "var(--font-size-base)", lineHeight: 1.6, color: "var(--apple-secondary-label)" }}>
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--apple-font-mono, monospace)",
        background: "var(--apple-fill)",
        color: "var(--apple-label)",
        padding: "1px var(--space-1)",
        borderRadius: "var(--radius-sm)",
        fontSize: "0.92em",
      }}
    >
      {children}
    </code>
  );
}

function WelcomePage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 800, marginBottom: "var(--space-2)", color: "var(--apple-label)" }}>
        Gamelog Design System
      </h1>
      <p style={{ fontSize: "var(--font-size-lg)", color: "var(--apple-secondary-label)", marginBottom: "var(--space-8)", lineHeight: 1.5 }}>
        A component library for Gamelog, an Apple HIG-styled game-tracking desktop app
        (React + TypeScript + Electron) — documenting the shared component layer that
        came out of a full design-system audit and remediation pass.
      </p>

      <Section title="What's in here">
        <p style={{ marginBottom: "var(--space-3)" }}>Two categories, matching the codebase's own folder structure:</p>
        <ul style={{ paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li><Code>UI/</Code> — generic, reusable primitives (<Code>components/ui/</Code>): Button, Modal.</li>
          <li><Code>Components/</Code> — domain-specific components (<Code>components/</Code>): StatusChip, StarRating, CoverCard, TagSelect, FilterBar.</li>
        </ul>
        <p style={{ marginTop: "var(--space-3)" }}>
          Use the <strong style={{ color: "var(--apple-label)" }}>theme</strong> and{" "}
          <strong style={{ color: "var(--apple-label)" }}>accent</strong> dropdowns in the toolbar
          above to switch every story across light/dark mode and all 8 accent colors — every
          component here is built entirely on CSS custom properties from <Code>theme.css</Code>,
          so nothing is hardcoded and every combination is real.
        </p>
      </Section>

      <Section title="How this library was built">
        <p style={{ marginBottom: "var(--space-3)" }}>
          This wasn't written from a blank slate — it's the output of a multi-pass audit against
          the live app:
        </p>
        <ol style={{ paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <li><strong style={{ color: "var(--apple-label)" }}>Audit</strong> — scored token adoption, component reuse, and accessibility across all 41 source files.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>Remediation</strong> — fixed the highest-leverage findings: undefined token references, a status-color collision affecting 5 distinct statuses, missing dialog accessibility (focus traps, <Code>aria-modal</Code>, Escape-to-close) on 3 modal-style components, hardcoded hex colors, and converted 28 files from hand-rolled <Code>{"<button>"}</Code>s to the shared Button component.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>Token sweep</strong> — replaced exact-match raw pixel values in <Code>padding</Code>/<Code>margin</Code>/<Code>fontSize</Code> with their <Code>var(--space-*)</Code>/<Code>var(--font-size-*)</Code> tokens across all 41 files (607 substitutions), leaving genuinely off-scale values flagged rather than silently rounded.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>Component deep-dive</strong> — StarRating/StarRatingInput and CoverCard got a full states/variants/a11y review, surfacing and fixing a rating-scale display bug, missing <Code>radiogroup</Code>/<Code>radio</Code> ARIA semantics on the rating input, and a keyboard-focus gap on CoverCard's cover tile.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>This Storybook</strong> — every real variant and state of the 7 shared components above, built from the actual component props (not hardcoded mockups), with <Code>@storybook/addon-a11y</Code> running an automated accessibility check on every story.</li>
        </ol>
      </Section>

      <Section title="Findings surfaced along the way">
        <p style={{ marginBottom: "var(--space-3)" }}>A few things worth knowing if you're browsing the individual component docs:</p>
        <ul style={{ paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <li><strong style={{ color: "var(--apple-label)" }}>StatusChip</strong> — the original audit scored it "used in 5 files." That was wrong: the <Code>{"<StatusChip>"}</Code> component itself has zero real render sites in the app. Only its exported color-map constants get reused, with each consumer hand-rolling its own status pill markup.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>Modal</strong> — used directly in exactly 1 of 41 files, and even there without its <Code>title</Code> prop, so the built-in header and close button are never exercised in production.</li>
          <li><strong style={{ color: "var(--apple-label)" }}>Button</strong>'s loading spinner references a <Code>@keyframes spin</Code> that doesn't exist anywhere in the app's CSS.</li>
        </ul>
        <p style={{ marginTop: "var(--space-3)" }}>Each of these is documented directly on its component's docs page, not just here.</p>
      </Section>
    </div>
  );
}

const meta = {
  title: "Welcome",
  component: WelcomePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {};
