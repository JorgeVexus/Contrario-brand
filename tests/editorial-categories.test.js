const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sectionPath = path.resolve(__dirname, '../sections/editorial-categories.liquid');
assert.ok(fs.existsSync(sectionPath), 'editorial categories section exists');
const source = fs.readFileSync(sectionPath, 'utf8');

const patterns = [
  [/block\.settings\.custom_link\s*\|\s*default:\s*block\.settings\.collection\.url/, 'link falls back to collection URL'],
  [/block\.settings\.image\s*\|\s*default:\s*block\.settings\.collection\.featured_image/, 'image falls back to collection media'],
  [/block\.settings\.title\s*\|\s*default:\s*block\.settings\.collection\.title/, 'title falls back to collection title'],
  [/request\.design_mode/, 'incomplete blocks remain visible in editor'],
  [/image_tag:/, 'responsive Shopify images are used'],
  [/placeholder_svg_tag/, 'missing image has a placeholder'],
  [/filter:[^;]*grayscale/, 'grayscale image treatment exists'],
  [/overflow:\s*hidden/, 'card geometry clips image zoom'],
  [/\.editorial-categories__card:hover\s+\.editorial-categories__image/, 'hover transforms only the image'],
  [/\.editorial-categories__card:focus-visible/, 'keyboard focus is visible'],
  [/prefers-reduced-motion:\s*reduce/, 'reduced motion is respected'],
  [/editorial-categories--count-1/, 'single-card layout exists'],
  [/editorial-categories--count-2/, 'two-card layout exists'],
  [/editorial-categories--count-3/, 'three-card layout exists'],
  [/editorial-categories--count-4/, 'four-card layout exists'],
  [/scroll-snap-type:\s*x mandatory/, 'mobile rail uses scroll snap'],
  [/scroll-snap-align:\s*start/, 'mobile cards snap from the leading edge'],
  [/block\.settings\.cta_text/, 'CTA is editable'],
];
for (const [pattern, message] of patterns) assert.match(source, pattern, message);

assert.equal((source.match(/<a\b/g) || []).length, 1, 'card template contains one anchor and no nested links');

const schemaMatch = source.match(/{% schema %}([\s\S]*?){% endschema %}/);
assert.ok(schemaMatch, 'section contains a schema');
const schema = JSON.parse(schemaMatch[1]);
const settingIds = new Set(schema.settings.map(({ id }) => id).filter(Boolean));
for (const id of [
  'eyebrow', 'heading', 'heading_alignment', 'heading_color', 'background_color', 'max_width',
  'desktop_card_height', 'mobile_card_height', 'column_gap', 'row_gap', 'mobile_gap', 'mobile_rail',
  'desktop_gutter', 'mobile_gutter', 'padding_top', 'padding_bottom', 'enable_grayscale',
  'image_brightness', 'overlay_color', 'overlay_opacity', 'image_zoom', 'title_color', 'title_size',
  'title_size_mobile', 'cta_color', 'cta_size', 'accent_color', 'content_alignment', 'content_inset',
]) assert.ok(settingIds.has(id), `schema exposes ${id}`);

assert.equal(schema.max_blocks, 4, 'section accepts at most four category blocks');
assert.equal(schema.blocks.length, 1, 'section exposes only category blocks');
const category = schema.blocks[0];
assert.equal(category.type, 'category', 'block type is category');
const blockIds = new Set(category.settings.map(({ id }) => id).filter(Boolean));
for (const id of ['collection', 'image', 'title', 'cta_text', 'custom_link', 'desktop_focal_point', 'mobile_focal_point', 'image_alt']) {
  assert.ok(blockIds.has(id), `category block exposes ${id}`);
}

const preset = schema.presets.find(({ name }) => name === 'Editorial categories');
assert.ok(preset, 'Editorial categories preset exists');
assert.equal(preset.blocks.length, 2, 'preset starts with two categories');
assert.equal(preset.settings.enable_grayscale, true, 'preset starts in monochrome');
assert.equal(preset.settings.image_zoom, 104, 'preset uses restrained 1.04 zoom');
assert.equal(category.settings.find(({ id }) => id === 'cta_text').default, 'EXPLORE NOW', 'CTA default matches design');

console.log('editorial categories regression checks passed');
