# Campaign Hero section design

## Objective

Create a reusable, full-width Shopify hero section inspired by the approved monochrome editorial reference. Merchants must be able to change its media, content, positioning, styling, links, and responsive behavior entirely through the theme editor.

## Visual direction

The default composition uses a full-bleed campaign photograph, optional grayscale treatment, and a directional dark overlay. Large uppercase display type sits near the lower-left edge with tight leading and tracking. A compact high-contrast CTA follows the headline. The mobile composition uses an independent image and focal point, moves the content closer to the lower edge, and scales the type without sacrificing line breaks or button visibility.

The section follows Contrario's existing Montserrat typography and square, high-contrast controls. It does not add decorative cards, glass effects, rounded content containers, or a separate visual language.

## Component boundary

The feature is implemented as a new `sections/campaign-hero.liquid` section with section-scoped styles. It does not modify Dawn's standard image banner, so theme updates and existing banners remain unaffected.

The section owns:

- responsive media rendering;
- overlay and image treatment;
- content positioning and width;
- semantic content blocks;
- CTA rendering;
- section-specific responsive and motion behavior.

It depends only on Shopify Liquid objects, standard theme CSS variables, and the existing global animation setting.

## Editable media settings

The section provides:

- desktop image;
- optional mobile image, falling back to the desktop image;
- desktop height presets: adapt, 500px, 650px, 800px, and full viewport;
- mobile height presets: adapt, 500px, 650px, and full viewport;
- desktop and mobile focal-point selectors;
- grayscale toggle;
- image brightness control;
- overlay color and opacity;
- overlay style: solid, left gradient, right gradient, bottom gradient, or none.

Images use Shopify's responsive image pipeline with explicit widths, sizes, dimensions, lazy loading, and `fetchpriority="high"` when the section is first on the page. If no image exists, the editor displays Shopify's lifestyle placeholder.

## Editable layout settings

Desktop and mobile expose independent content positions using a nine-point grid, text alignment, content maximum width, and horizontal/vertical padding. Section settings also control top and bottom spacing outside the hero.

Content remains inside safe viewport gutters. On mobile, the title and CTAs cannot overflow horizontally, and buttons become full width only when enabled by the merchant.

## Content blocks

Blocks are reorderable and optional:

1. Eyebrow: short campaign label with editable text, color, size, and letter spacing.
2. Heading: inline rich text with preserved author line breaks, semantic heading level, color, responsive size, weight, uppercase toggle, line height, and letter spacing.
3. Text: rich text with color, responsive size, and maximum width inherited from the content container.
4. Buttons: up to two CTAs, each with label, URL, primary/outline style, background, text, border, and hover colors. Empty labels render nothing.

The section permits one eyebrow, one heading, one text block, and one buttons block. Its preset includes a heading and one CTA matching the approved visual direction.

## Optional interaction

The content may use the theme's existing reveal-on-scroll behavior. A section setting controls a subtle image scale-on-load effect. Motion is disabled under `prefers-reduced-motion: reduce`.

The entire hero is not made clickable when interactive CTA blocks exist, preventing nested links and ambiguous keyboard behavior.

## Accessibility and failure behavior

- The merchant can supply image alt text; otherwise decorative campaign media uses an empty alt attribute.
- The heading level is selectable from `h1`, `h2`, and `h3`.
- CTA focus states remain visible and inherit accessible theme conventions.
- Text contrast is supported by adjustable overlay and color settings.
- Missing mobile media falls back to desktop media.
- Missing all media renders a placeholder in the editor without breaking layout.
- Missing content blocks leave a media-only hero with no empty content wrapper.
- Invalid or empty links render button text without a link only inside the theme editor; storefront output omits unusable CTAs.

## Default preset

The preset is named `Campaign hero` and starts with:

- 650px desktop height and 650px mobile height;
- grayscale enabled;
- left-gradient black overlay at 55% strength;
- bottom-left positioning on desktop and mobile;
- uppercase 72px desktop / 42px mobile heading;
- heading text `ONE LIFE.<br>ONE CHANCE.`;
- lime primary CTA labeled `SHOP NEW ARRIVALS`;
- restrained reveal animation enabled.

## Verification

Automated regression checks validate the section schema, required setting IDs, responsive image branches, content block limits, accessibility attributes, reduced-motion rule, and absence of external dependencies.

`node --check` validates the regression script. `shopify theme check --fail-level error` validates the complete theme. Final acceptance requires previewing desktop and mobile variants in Shopify's theme editor, including missing-image, media-only, long-heading, two-button, and reduced-motion cases.
