# Campaign Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, fully editable Shopify campaign hero matching the approved monochrome editorial direction.

**Architecture:** Add one self-contained Online Store 2.0 section whose Liquid handles responsive media and reorderable content blocks while section-scoped CSS handles positioning, styling, and motion. A Node regression script validates the contract of the section before Shopify Theme Check validates Liquid and schema compatibility.

**Tech Stack:** Shopify Liquid, JSON section schema, responsive Shopify images, scoped CSS, Node.js assertions, Shopify Theme Check.

---

### Task 1: Create the regression contract

**Files:**
- Create: `tests/campaign-hero.test.js`

- [ ] Write assertions that require `sections/campaign-hero.liquid`, desktop/mobile image branches, responsive `image_tag`, scoped section styles, grayscale and reduced-motion rules, overlay modes, nine-position layout controls, four block types, block limits, semantic heading levels, CTA guards, preset defaults, and valid JSON schema extraction.
- [ ] Run `node tests/campaign-hero.test.js` and confirm it fails because `sections/campaign-hero.liquid` does not exist.

### Task 2: Implement media and layout

**Files:**
- Create: `sections/campaign-hero.liquid`
- Test: `tests/campaign-hero.test.js`

- [ ] Add desktop and mobile image selection with desktop fallback, responsive widths, explicit dimensions, `sizes="100vw"`, appropriate loading, and first-section fetch priority.
- [ ] Add a Shopify placeholder for missing media.
- [ ] Add section-scoped variables for height, focal point, brightness, grayscale, overlay, content position, maximum width, and gutters.
- [ ] Add desktop/mobile height classes and all nine alignment positions.
- [ ] Add optional image reveal motion plus a reduced-motion override.
- [ ] Run the regression test and confirm media/layout assertions pass.

### Task 3: Implement editable content blocks

**Files:**
- Modify: `sections/campaign-hero.liquid`
- Test: `tests/campaign-hero.test.js`

- [ ] Render optional eyebrow, heading, text, and buttons blocks in merchant-defined order.
- [ ] Preserve heading line breaks, expose `h1`/`h2`/`h3`, and apply responsive typography through block-scoped variables.
- [ ] Render at most two usable CTA links with primary and outline styles; omit empty labels or URLs on storefront.
- [ ] Avoid rendering the content wrapper when all blocks are blank.
- [ ] Run the regression test and confirm all content assertions pass.

### Task 4: Add complete Shopify schema and preset

**Files:**
- Modify: `sections/campaign-hero.liquid`
- Test: `tests/campaign-hero.test.js`

- [ ] Define media, layout, typography, spacing, and motion section settings with explicit defaults and ranges.
- [ ] Define one-instance eyebrow, heading, text, and buttons blocks with all approved editable fields.
- [ ] Add a `Campaign hero` preset using grayscale, left gradient, bottom-left alignment, headline, and lime CTA defaults.
- [ ] Parse the schema in the regression test and confirm the IDs, limits, options, and preset values are present.

### Task 5: Verify and integrate

**Files:**
- Verify: `sections/campaign-hero.liquid`
- Verify: `tests/campaign-hero.test.js`
- Verify: `docs/superpowers/specs/2026-08-03-campaign-hero-design.md`

- [ ] Run `node --check tests/campaign-hero.test.js`.
- [ ] Run `node tests/campaign-hero.test.js` and the existing cart regression test.
- [ ] Run `shopify theme check --path . --fail-level error` and require exit code 0.
- [ ] Review the diff against every requirement in the approved specification.
- [ ] Commit the section, tests, specification, and plan; push `main` to `origin` only after all verification is green.
- [ ] Record that final catalog-image and exact viewport approval require Shopify theme-editor preview.
