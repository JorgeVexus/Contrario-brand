# Editorial Categories section design

## Objective

Create a native Shopify section that presents one to four featured collections as monochrome editorial cards. Every card is fully clickable, reveals a restrained image zoom on hover without changing its dimensions, and includes an `EXPLORE NOW` call to action.

## Component boundary

The feature is implemented as a new, self-contained `sections/editorial-categories.liquid` section. It does not alter Dawn's standard collection list or the existing generated category navigator. Section-scoped CSS owns the grid, card presentation, mobile scrolling, image effects, focus states, and responsive behavior.

The section depends only on Shopify collection objects, responsive image filters, standard theme variables, and the existing reveal-on-scroll setting.

## Content model

The section accepts a maximum of four `category` blocks. Each block provides:

- a Shopify collection selector;
- an optional custom image that overrides the collection featured image;
- an optional custom title that falls back to the collection title;
- editable CTA text with `EXPLORE NOW` as the default;
- an optional link override that falls back to the collection URL;
- desktop and mobile focal-point selectors;
- an accessible image-alt override.

A usable card requires either a collection URL or link override. In the theme editor, incomplete blocks remain visible as placeholders so merchants can select and configure them. On the storefront, incomplete blocks without a destination are omitted rather than rendered as fake links.

## Card behavior

Each card contains exactly one anchor covering the full card. The image, title, CTA, and accent are inside that anchor, avoiding nested interactive elements.

Images render through Shopify's responsive image pipeline. They are monochrome by default using a section-level grayscale toggle. The card clips overflow, and hover/focus-within scales only the image. The scale amount is configurable from 1.00 to 1.12 and defaults to 1.04. Card geometry never changes during interaction.

The section includes an adjustable dark overlay. Title and CTA colors, accent color, title size, CTA size, and content inset are editable. The title sits above the CTA near the lower-left edge by default. Both can be aligned left, center, or right at section level.

## Desktop layouts

The grid changes automatically according to the number of valid category blocks:

- One card: full-width panoramic card.
- Two cards: equal two-column layout.
- Three cards: the first card spans two rows on the left; the second and third stack on the right.
- Four cards: balanced two-by-two grid.

The merchant can configure maximum section width, horizontal gap, vertical gap, and desktop card height. The three-card layout uses the configured height for each secondary card and twice that height plus the gap for the leading card.

## Mobile layout

Cards become a horizontal scroll-snap rail. Each card occupies approximately 86% of the viewport width, leaving a visible preview of the next card. Native touch scrolling is used with no JavaScript dependency. The merchant can choose between enabling the rail or stacking cards vertically.

Mobile card height, gap, section gutters, and content inset are independently configurable. Scrollbars are visually hidden while keyboard and touch scrolling remain available.

## Section settings

The theme editor exposes:

- optional section eyebrow and heading;
- heading alignment and color;
- section background color;
- maximum content width;
- desktop and mobile card heights;
- desktop horizontal and vertical gaps;
- mobile gap and rail toggle;
- desktop and mobile section gutters;
- top and bottom padding;
- grayscale toggle;
- image brightness;
- overlay color and opacity;
- image zoom amount;
- title and CTA colors and responsive sizes;
- accent color;
- card content alignment and inset.

## Empty and missing-data states

- Custom image falls back to collection featured image.
- Missing all images displays Shopify's collection placeholder in the editor and storefront.
- Custom title falls back to collection title, then `Category` in the editor.
- Empty CTA text removes only the CTA line; the card remains clickable.
- A missing link uses the collection URL.
- A card with no usable destination is visible only in design mode.
- A section with no blocks displays an editor-only empty-state prompt and produces no empty storefront wrapper.

## Accessibility

- Each card is a single descriptive anchor.
- The link accessible name includes the resolved category title.
- Meaningful custom alt text is supported; otherwise card imagery uses an empty alt because the adjacent title names the destination.
- Focus-visible receives a high-contrast inset outline.
- Hover behavior is also triggered by keyboard focus.
- Motion is disabled under `prefers-reduced-motion: reduce`.
- Mobile scroll snap does not trap focus or require drag-only interaction.

## Default preset

The preset is named `Editorial categories` and creates two category blocks. Defaults use a near-black section background, grayscale images, 78% black overlay, white uppercase titles, lime CTA/accent, 1.04 image zoom, two columns on desktop, and an 86%-width mobile rail.

## Verification

Automated regression checks validate the section's schema, four-block limit, collection and custom-image fallbacks, one-anchor card structure, collection URL fallback, layout classes for one through four cards, mobile scroll snap, image-only transform, overflow clipping, grayscale default, focus state, reduced-motion handling, and preset values.

`node --check` validates the regression script. Both feature and cart regressions run before integration. `shopify theme check --fail-level error` validates Liquid and schema. Final visual acceptance requires testing one-, two-, three-, and four-card configurations in Shopify's desktop and mobile editors.
