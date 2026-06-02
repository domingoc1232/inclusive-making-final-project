'use strict';
const fs = require('fs');
const path = require('path');

global.self = {};

const hue = path.join(__dirname, '..', 'hue');
eval(fs.readFileSync(path.join(hue, 'colorUtils.js'), 'utf8'));
eval(fs.readFileSync(path.join(hue, 'daltonize.js'), 'utf8'));
eval(fs.readFileSync(path.join(hue, 'contrast.js'), 'utf8'));
eval(fs.readFileSync(path.join(hue, 'colorFixer.js'), 'utf8'));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log('  PASS: ' + msg);
    passed++;
  } else {
    console.log('  FAIL: ' + msg);
    failed++;
  }
}

function simHex(hex, type) {
  const { hexToRgb, rgbToHex } = self.colorUtils;
  const sim = self.daltonize.simulateColor(hexToRgb(hex), type);
  return rgbToHex(sim.r, sim.g, sim.b);
}

function simHsl(hex, type) {
  return self.colorFixer.hexToHsl(simHex(hex, type));
}

function hueDiff(hexA, hexB) {
  const a = self.colorFixer.hexToHsl(hexA);
  const b = self.colorFixer.hexToHsl(hexB);
  return Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
}

// ── daltonize.js ──────────────────────────────────────────────────────────────
console.log('\n── daltonize.js ──');

const { hexToRgb, rgbToHex } = self.colorUtils;
const { simulateColor } = self.daltonize;

{
  const sim = simulateColor(hexToRgb('#CC0000'), 'protanopia');
  assert(sim.r !== 204 || sim.g !== 0 || sim.b !== 0,
    'protanopia: #CC0000 shifts from input (got ' + rgbToHex(sim.r, sim.g, sim.b) + ')');
  assert(sim.b < 20,
    'protanopia: #CC0000 has near-zero blue after simulation (b=' + sim.b + ')');
}

{
  const sim = simulateColor(hexToRgb('#00AA00'), 'protanopia');
  assert(sim.r !== 0 || sim.g !== 170 || sim.b !== 0,
    'protanopia: #00AA00 shifts from input (got ' + rgbToHex(sim.r, sim.g, sim.b) + ')');
  assert(sim.r > 50,
    'protanopia: #00AA00 gains red channel (r=' + sim.r + ')');
}

{
  const sRed = simHex('#CC0000', 'protanopia');
  const sGreen = simHex('#00AA00', 'protanopia');
  const diff = hueDiff(sRed, sGreen);
  assert(diff < 30,
    'protanopia: simulated red+green are hue-similar (diff=' + diff.toFixed(1) + '° <30)');
}

{
  const sim = simulateColor(hexToRgb('#0000EE'), 'tritanopia');
  assert(sim.r !== 0 || sim.g !== 0 || sim.b !== 238,
    'tritanopia: #0000EE shifts from input (got ' + rgbToHex(sim.r, sim.g, sim.b) + ')');
  assert(sim.g > 100,
    'tritanopia: #0000EE gains green channel (g=' + sim.g + ')');
}

{
  const sim = simulateColor(hexToRgb('#D63B2F'), 'deuteranopia');
  assert(sim.r !== 214 || sim.g !== 59 || sim.b !== 47,
    'deuteranopia: #D63B2F shifts from input (got ' + rgbToHex(sim.r, sim.g, sim.b) + ')');
}

// ── contrast.js passesWCAG ────────────────────────────────────────────────────
console.log('\n── contrast.js passesWCAG ──');

const { passesWCAG } = self.contrastChecker;

assert(!passesWCAG(hexToRgb('#ffffff'), hexToRgb('#CC0000'), 'protanopia'),
  'protanopia: white on #CC0000 FAILS WCAG after simulation');

assert(passesWCAG(hexToRgb('#ffffff'), hexToRgb('#00AA00'), 'protanopia'),
  'protanopia: white on #00AA00 PASSES WCAG after simulation');

assert(!passesWCAG(hexToRgb('#0000EE'), hexToRgb('#FFFF00'), 'tritanopia'),
  'tritanopia: #0000EE on #FFFF00 FAILS WCAG after simulation');

assert(!passesWCAG(hexToRgb('#ffffff'), hexToRgb('#D63B2F'), 'deuteranopia'),
  'deuteranopia: white on #D63B2F FAILS WCAG after simulation');

assert(passesWCAG(hexToRgb('#000000'), hexToRgb('#ffffff'), 'protanopia'),
  'black on white passes WCAG');

assert(passesWCAG(hexToRgb('#ffffff'), hexToRgb('#000000'), 'protanopia'),
  'white on black passes WCAG');

// ── colorFixer.js isConfusable — diagnostic ───────────────────────────────────
console.log('\n── colorFixer.js isConfusable ──');

const { isConfusable } = self.colorFixer;

// Root-cause diagnostic: this returns false, which is why content.js line 69
// skipped all white-on-color elements when using isConfusable for detection.
assert(!isConfusable('#ffffff', '#CC0000', 'protanopia'),
  'DIAGNOSTIC: isConfusable(white, red, protanopia)=false — confirms why content.js was broken');

// Cross-element check: red vs green ARE confusable with each other.
assert(isConfusable('#CC0000', '#00AA00', 'protanopia'),
  'isConfusable(red, green, protanopia)=true — correct for cross-element comparison');

// Safe pairs should not be confusable
assert(!isConfusable('#000000', '#ffffff', 'protanopia'),
  'isConfusable(black, white, protanopia)=false — clearly distinguishable');

// ── colorFixer.js fixColor ────────────────────────────────────────────────────
console.log('\n── colorFixer.js fixColor ──');

const { fixColor } = self.colorFixer;

{
  const fixed = fixColor('#CC0000', '#ffffff', 'protanopia', 'bg');
  assert(passesWCAG(hexToRgb('#ffffff'), hexToRgb(fixed), 'protanopia'),
    'protanopia: fixColor(red bg, white fg) → ' + fixed + ' passes passesWCAG');
}

{
  const fixed = fixColor('#0000EE', '#FFFF00', 'tritanopia', 'fg');
  assert(passesWCAG(hexToRgb(fixed), hexToRgb('#FFFF00'), 'tritanopia'),
    'tritanopia: fixColor(blue fg, yellow bg) → ' + fixed + ' passes passesWCAG');
}

{
  const fixed = fixColor('#D63B2F', '#ffffff', 'deuteranopia', 'fg');
  assert(passesWCAG(hexToRgb(fixed), hexToRgb('#ffffff'), 'deuteranopia'),
    'deuteranopia: fixColor(red fg, white bg) → ' + fixed + ' passes passesWCAG');
}

{
  const fixed = fixColor('#000000', '#ffffff', 'protanopia', 'fg');
  assert(fixed === '#000000',
    'fixColor returns unchanged when pair already passes (black on white → ' + fixed + ')');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n── Summary ──');
console.log('Passed: ' + passed + '  Failed: ' + failed);
if (failed > 0) process.exit(1);
