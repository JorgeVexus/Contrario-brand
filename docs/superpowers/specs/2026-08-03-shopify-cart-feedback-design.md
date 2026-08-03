# Shopify cart feedback and product-image fallback

## Objective

Improve confidence during Shopify cart updates by making the existing quick-order loading state visible at the point of interaction and by ensuring cart line items always have a useful visual representation.

## Scope

The change applies to the bulk quick-add modal used by products with multiple variants, the single-variant bulk quick-add component, and the main `/cart` line-item template. It also corrects the empty-cart state check in the single-variant component.

## Quick-add loading behavior

When a quantity changes, the affected variant row becomes busy immediately and remains busy until its queued cart request settles. Its quantity controls are temporarily non-interactive, its existing loading spinner becomes visible, and the row exposes `aria-busy="true"`.

At the same time, the `Total items / Product total` area exposes `aria-busy="true"`, uses the theme's existing spinner, and visually reduces the prominence of the stale values. The existing values remain visible so the layout does not jump. Other variant rows remain usable.

When Shopify returns successfully, the existing section-rendering flow replaces totals and variant data with the server response before clearing the busy state. On failure, all busy states are cleared and the theme's existing cart error message remains responsible for explaining the failure.

The single-variant bulk quick-add uses the same interaction principle: its quantity component is marked busy and temporarily non-interactive while its progress feedback is visible.

## Cart product images

The main cart and cart drawer resolve the line-item image in this order:

1. `item.image`
2. `item.variant.featured_image`
3. `item.product.featured_image`
4. Shopify's native product placeholder

The resolved image is used consistently for URL, alternative text, aspect ratio, and dimensions. The placeholder receives the product title as accessible alternative text. This prevents a blank media cell even when a line item does not provide its own image.

## Related correction

The expression `parsedState.items.length.length === 0` in the single-variant quick-add flow is replaced with a valid empty-cart check based on `parsedState.items.length === 0`.

## Styling

All visual feedback reuses the theme's existing spinner, colors, spacing scale, opacity conventions, and motion duration. No new visual language, overlay, or optimistic price calculation is introduced.

## Verification

Regression checks will cover:

- Busy state appears before a quick-order cart request begins.
- Only the changed variant row is disabled.
- Totals expose visible and accessible loading feedback.
- Busy states clear after both successful and failed requests.
- Single-variant empty-cart detection uses the correct item count.
- Main cart and cart drawer use the complete image fallback chain.
- JavaScript syntax and Liquid structure remain valid.

Manual verification in a Shopify preview remains necessary for the final AJAX timing and rendered catalog images because a static theme export does not include storefront cart responses or product records.
