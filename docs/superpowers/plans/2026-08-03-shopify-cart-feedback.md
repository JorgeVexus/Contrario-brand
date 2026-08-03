# Shopify Cart Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add immediate, accessible loading feedback to Shopify bulk quick-add updates and guarantee a useful image or placeholder for every cart line item.

**Architecture:** Extend the existing `QuickOrderList` and `QuickAddBulk` state toggles instead of adding a new request layer. Liquid resolves cart images server-side through a deterministic fallback chain, while focused regression checks inspect the exported JavaScript and Liquid because this theme export has no test framework or catalog runtime.

**Tech Stack:** Shopify Liquid, custom elements, vanilla JavaScript, CSS, Node.js regression script.

---

## File map

- Create `tests/cart-feedback.test.js`: focused regression checks for JavaScript loading behavior and Liquid fallbacks.
- Modify `assets/quick-order-list.js`: mark the changed row and totals busy during a queued request.
- Modify `assets/quick-order-list.css`: style row/total busy states using existing theme conventions.
- Modify `snippets/quick-order-list.liquid`: provide a visible totals spinner and stable hook.
- Modify `assets/quick-add-bulk.js`: expose busy state and correct empty-cart detection.
- Modify `assets/quick-add.css`: make single-variant progress feedback visible and prevent repeated interaction.
- Modify `sections/main-cart-items.liquid`: resolve a cart image fallback or native placeholder.
- Modify `snippets/cart-drawer.liquid`: use the same image fallback in the drawer.

### Task 1: Establish regression checks

**Files:**
- Create: `tests/cart-feedback.test.js`

- [ ] Write a Node.js test that reads the theme files and asserts: row and totals busy hooks exist; busy cleanup exists; `items.length.length` is absent; both cart templates resolve `item.image`, variant image, product image, and `placeholder_svg_tag`.
- [ ] Run `node tests/cart-feedback.test.js` and verify it fails because the new hooks and fallbacks are absent.

### Task 2: Add quick-order loading feedback

**Files:**
- Modify: `assets/quick-order-list.js`
- Modify: `assets/quick-order-list.css`
- Modify: `snippets/quick-order-list.liquid`

- [ ] Pass the changed quantity input to `toggleLoading(true, target)` before it enters the request queue.
- [ ] In `toggleLoading`, resolve the closest `.variant-item`, toggle `aria-busy`, disable only that row's quantity controls, and toggle its existing spinner.
- [ ] Toggle `aria-busy` and the new spinner on `.quick-order-list__total` while preserving stale values.
- [ ] Clear all row and totals busy states in the request `finally` path, including failures.
- [ ] Add CSS that uses the existing opacity and transition variables without changing layout.
- [ ] Run `node tests/cart-feedback.test.js`; the quick-order assertions must pass while remaining tasks may still fail.

### Task 3: Correct single-variant bulk feedback

**Files:**
- Modify: `assets/quick-add-bulk.js`
- Modify: `assets/quick-add.css`

- [ ] Mark the component `aria-busy="true"` and disable its quantity controls before `/cart/update.js`.
- [ ] Restore interactivity and remove the busy attribute in `finally`.
- [ ] Replace `parsedState.items.length.length === 0` with `parsedState.items.length === 0`.
- [ ] Raise the existing progress indicator into the visible stacking context and reduce stale-control opacity while busy.
- [ ] Run `node tests/cart-feedback.test.js`; all JavaScript feedback assertions must pass.

### Task 4: Add cart image fallbacks

**Files:**
- Modify: `sections/main-cart-items.liquid`
- Modify: `snippets/cart-drawer.liquid`

- [ ] Assign `cart_item_image` from `item.image`, then `item.variant.featured_image`, then `item.product.featured_image`.
- [ ] Render the existing linked `<img>` with `cart_item_image` when present.
- [ ] Otherwise render Shopify's `product-1` placeholder with the product title as accessible text.
- [ ] Run `node tests/cart-feedback.test.js`; all assertions must pass.

### Task 5: Final verification

**Files:**
- Verify all modified theme and test files.

- [ ] Run `node --check` on both modified JavaScript assets and the regression test.
- [ ] Run the full regression script and confirm zero failures.
- [ ] Search for `items.length.length`, unresolved test markers, and accidental placeholders.
- [ ] Review the final diff manually against the approved design.
- [ ] Record that live Shopify preview verification remains pending until the theme is uploaded or served with Shopify catalog data.

### Task 6: Version-control handoff

**Files:**
- Track the complete project after implementation verification.

- [ ] Confirm the exact theme directory that should become the repository root.
- [ ] Connect it to `https://github.com/JorgeVexus/Contrario-brand.git` without overwriting remote history.
- [ ] Inspect remote branches before the first push and reconcile any existing files safely.
- [ ] Commit the verified theme, tests, specification, and plan with a focused message.
