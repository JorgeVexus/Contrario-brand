# Editorial Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully editable Shopify section for one to four clickable monochrome collection cards with editorial desktop layouts and a mobile scroll-snap rail.

**Architecture:** Add one self-contained Online Store 2.0 section with collection blocks and responsive Shopify images. Liquid resolves collection content and link fallbacks; section-scoped CSS controls automatic layouts, clipping, image-only hover zoom, mobile scrolling, and accessibility states without JavaScript.

**Tech Stack:** Shopify Liquid, JSON section schema, responsive image filters, CSS Grid, CSS scroll snap, Node.js assertions, Shopify Theme Check.

---

### Task 1: Establish the regression contract

**Files:**
- Create: `tests/editorial-categories.test.js`

- [ ] Assert that `sections/editorial-categories.liquid` exists and has a valid JSON schema.
- [ ] Require a four-block maximum, collection/custom-image/title/link fallbacks, one anchor per rendered card, responsive images, placeholders, grayscale, clipping, image-only transform, focus-visible, reduced motion, four count-based layouts, scroll snap, and the approved preset defaults.
- [ ] Run `node tests/editorial-categories.test.js` and confirm failure because the section is absent.

### Task 2: Implement collection cards and fallbacks

**Files:**
- Create: `sections/editorial-categories.liquid`
- Test: `tests/editorial-categories.test.js`

- [ ] Resolve each block's destination from link override then collection URL, image from custom image then collection featured image, and title from custom title then collection title.
- [ ] Render one full-card anchor with image, title, optional CTA, and accent; show incomplete blocks only in design mode.
- [ ] Render responsive `image_tag` output or Shopify's collection placeholder.
- [ ] Run the regression and confirm card/fallback assertions pass.

### Task 3: Implement responsive editorial layout

**Files:**
- Modify: `sections/editorial-categories.liquid`
- Test: `tests/editorial-categories.test.js`

- [ ] Add one-, two-, three-, and four-card desktop layouts based on the valid-card count.
- [ ] Add fixed card clipping and image-only hover/focus scale controlled by a section zoom variable.
- [ ] Add the optional mobile scroll-snap rail with an 86% card width and vertical-stack fallback.
- [ ] Add focus-visible and reduced-motion behavior.
- [ ] Run the regression and confirm all layout and interaction assertions pass.

### Task 4: Add complete editable schema

**Files:**
- Modify: `sections/editorial-categories.liquid`
- Test: `tests/editorial-categories.test.js`

- [ ] Add section heading, colors, maximum width, heights, gaps, gutters, padding, grayscale, brightness, overlay, zoom, typography, alignment, and inset controls.
- [ ] Add category block settings for collection, image, title, CTA, link override, focal points, and alt text with limit four.
- [ ] Add the `Editorial categories` preset containing two blocks and approved monochrome/lime defaults.
- [ ] Parse and validate every schema requirement in the regression test.

### Task 5: Verify and integrate

**Files:**
- Verify: `sections/editorial-categories.liquid`
- Verify: `tests/editorial-categories.test.js`
- Verify: existing feature regressions.

- [ ] Run `node --check tests/editorial-categories.test.js`.
- [ ] Run editorial categories, campaign hero, and cart regression scripts.
- [ ] Run `shopify theme check --path . --fail-level error` and require exit code 0.
- [ ] Review the diff against the approved specification and run `git diff --check`.
- [ ] Integrate into `main`, preserve any Shopify-generated remote commits, rerun tests, and push normally without force.
