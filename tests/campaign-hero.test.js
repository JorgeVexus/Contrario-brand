const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sectionPath = path.resolve(__dirname, '../sections/campaign-hero.liquid');
assert.ok(fs.existsSync(sectionPath), 'campaign hero section exists');

const source = fs.readFileSync(sectionPath, 'utf8');
const requiredPatterns = [
  [/desktop_image = section\.settings\.image \| default: section\.settings\.image_mobile/, 'mobile-only media still renders'],
  [/section\.settings\.image_mobile/, 'mobile image setting is rendered'],
  [/section\.settings\.image/, 'desktop image setting is rendered'],
  [/image_tag:/, 'responsive Shopify image tag is used'],
  [/fetchpriority/, 'image fetch priority is controlled'],
  [/placeholder_svg_tag/, 'missing media has a placeholder'],
  [/filter:[^;]*grayscale/, 'grayscale treatment is supported'],
  [/prefers-reduced-motion:\s*reduce/, 'reduced motion is respected'],
  [/overlay_style/, 'overlay modes are rendered'],
  [/desktop_content_position/, 'desktop content position is rendered'],
  [/mobile_content_position/, 'mobile content position is rendered'],
  [/when 'eyebrow'/, 'eyebrow block is rendered'],
  [/when 'heading'/, 'heading block is rendered'],
  [/when 'text'/, 'text block is rendered'],
  [/when 'buttons'/, 'buttons block is rendered'],
  [/heading_level/, 'semantic heading level is rendered'],
  [/button_link_1 != blank/, 'first CTA requires a usable link'],
  [/button_link_2 != blank/, 'second CTA requires a usable link'],
  [/section\.blocks\.size > 0/, 'empty content wrapper is omitted'],
  [/aspect-ratio:/, 'adapt height preserves media proportions'],
  [/request\.design_mode/, 'unlinked CTA labels remain visible in the editor'],
];

for (const [pattern, message] of requiredPatterns) assert.match(source, pattern, message);

const schemaMatch = source.match(/{% schema %}([\s\S]*?){% endschema %}/);
assert.ok(schemaMatch, 'section contains a schema');
const schema = JSON.parse(schemaMatch[1]);

const settingIds = new Set(schema.settings.map(({ id }) => id).filter(Boolean));
for (const id of [
  'image', 'image_mobile', 'desktop_height', 'mobile_height', 'desktop_focal_point', 'mobile_focal_point',
  'enable_grayscale', 'image_brightness', 'overlay_color', 'overlay_opacity', 'overlay_style',
  'desktop_content_position', 'mobile_content_position', 'desktop_alignment', 'mobile_alignment',
  'content_max_width', 'desktop_padding_horizontal', 'mobile_padding_horizontal', 'enable_image_motion',
]) assert.ok(settingIds.has(id), `schema exposes ${id}`);

const positionOptions = schema.settings.find(({ id }) => id === 'desktop_content_position').options;
assert.equal(positionOptions.length, 9, 'desktop supports all nine content positions');

const blocks = Object.fromEntries(schema.blocks.map((block) => [block.type, block]));
for (const type of ['eyebrow', 'heading', 'text', 'buttons']) {
  assert.ok(blocks[type], `${type} block exists`);
  assert.equal(blocks[type].limit, 1, `${type} block is limited to one instance`);
}

const headingLevels = blocks.heading.settings.find(({ id }) => id === 'heading_level').options.map(({ value }) => value);
assert.deepEqual(headingLevels, ['h1', 'h2', 'h3'], 'heading levels are semantic and constrained');

const preset = schema.presets.find(({ name }) => name === 'Campaign hero');
assert.ok(preset, 'Campaign hero preset exists');
assert.equal(preset.settings.enable_grayscale, true, 'preset starts in monochrome');
assert.equal(preset.settings.overlay_style, 'gradient-left', 'preset starts with left gradient');
assert.equal(preset.settings.desktop_content_position, 'bottom-left', 'preset starts bottom-left');
assert.ok(preset.blocks.some(({ type }) => type === 'heading'), 'preset includes heading');
assert.ok(preset.blocks.some(({ type }) => type === 'buttons'), 'preset includes CTA');

console.log('campaign hero regression checks passed');
