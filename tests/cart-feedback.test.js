const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const themeRoot = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(themeRoot, relativePath), 'utf8');

const quickOrderJs = read('assets/quick-order-list.js');
const quickOrderCss = read('assets/quick-order-list.css');
const quickOrderLiquid = read('snippets/quick-order-list.liquid');
const quickAddBulkJs = read('assets/quick-add-bulk.js');
const quickAddCss = read('assets/quick-add.css');
const cartTemplates = [read('sections/main-cart-items.liquid'), read('snippets/cart-drawer.liquid')];

assert.match(quickOrderJs, /toggleRowLoading\(target, loading\)/, 'quick order exposes row loading state');
assert.match(quickOrderJs, /toggleTotalsLoading\(loading\)/, 'quick order exposes totals loading state');
assert.match(quickOrderJs, /aria-busy/, 'quick order exposes accessible busy state');
assert.match(quickOrderJs, /\.finally\([\s\S]*toggleLoading\(false\)/, 'quick order clears loading after requests');
assert.match(quickOrderLiquid, /quick-order-list__total-loading/, 'quick order totals include a visible spinner');
assert.match(quickOrderCss, /\[aria-busy='true'\]/, 'quick order styles busy states');

assert.doesNotMatch(quickAddBulkJs, /items\.length\.length/, 'single-variant empty-cart check is valid');
assert.match(quickAddBulkJs, /toggleLoading\(true\)/, 'single-variant quick add enters loading state');
assert.match(quickAddBulkJs, /toggleLoading\(false\)/, 'single-variant quick add leaves loading state');
assert.match(quickAddCss, /quick-add-bulk\[aria-busy='true'\]/, 'single-variant busy state is styled');

for (const template of cartTemplates) {
  assert.match(template, /assign cart_item_image = item\.image/, 'cart image starts with the line-item image');
  assert.match(template, /item\.variant\.featured_image/, 'cart image falls back to the variant image');
  assert.match(template, /item\.product\.featured_image/, 'cart image falls back to the product image');
  assert.match(template, /placeholder_svg_tag/, 'cart image falls back to a Shopify placeholder');
}

console.log('cart feedback regression checks passed');
