(function () {
  function hexToHsl(hex) {
    const { hexToRgb } = self.colorUtils;
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s, l };
  }

  function hslToHex(h, s, l) {
    const { rgbToHex } = self.colorUtils;
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0.10, Math.min(0.95, l));
    const h1 = h / 360;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h1 + 1 / 3);
      g = hue2rgb(p, q, h1);
      b = hue2rgb(p, q, h1 - 1 / 3);
    }
    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  }

  function simToHsl(rgb) {
    return hexToHsl(self.colorUtils.rgbToHex(rgb.r, rgb.g, rgb.b));
  }

  function isConfusable(hexA, hexB, type) {
    const { hexToRgb } = self.colorUtils;
    const { simulateColor } = self.daltonize;

    const hslA = simToHsl(simulateColor(hexToRgb(hexA), type));
    const hslB = simToHsl(simulateColor(hexToRgb(hexB), type));

    const hueDiff = Math.min(
      Math.abs(hslA.h - hslB.h),
      360 - Math.abs(hslA.h - hslB.h)
    );
    const lightDiff = Math.abs(hslA.l - hslB.l) * 100;

    return hueDiff < 25 && lightDiff < 25;
  }

  function getHueShift(h, type) {
    if (type === 'protanopia' || type === 'deuteranopia') {
      if (h <= 30) return 30;
      if (h <= 80) return 0;
      if (h <= 165) return 60;
      if (h <= 195) return 70;
      return 0;
    }
    // tritanopia
    if (h >= 40 && h <= 80) return -40;
    if (h >= 81 && h <= 140) return 30;
    if (h >= 190 && h <= 260) return 70;
    if (h >= 261 && h <= 290) return 40;
    return 0;
  }

  function fixColor(hexToFix, hexOther, type, role) {
    const { hexToRgb, relativeLuminance, contrastRatio } = self.colorUtils;
    const { passesWCAG } = self.contrastChecker;
    const { simulateColor } = self.daltonize;

    const fixRgb = hexToRgb(hexToFix);
    const otherRgb = hexToRgb(hexOther);
    const fgRgb = role === 'fg' ? fixRgb : otherRgb;
    const bgRgb = role === 'fg' ? otherRgb : fixRgb;

    if (passesWCAG(fgRgb, bgRgb, type)) return hexToFix;

    const hsl = hexToHsl(hexToFix);
    const simFixLum = relativeLuminance(simulateColor(fixRgb, type));
    const simOtherLum = relativeLuminance(simulateColor(otherRgb, type));
    const goDown = simFixLum < simOtherLum;

    let l = hsl.l;
    let best = hexToFix;
    let bestContrast = 0;

    for (let i = 0; i < 50; i++) {
      l = goDown ? Math.max(0.01, l - 0.02) : Math.min(0.99, l + 0.02);
      const candidate = hslToHex(hsl.h, hsl.s, l);
      const candRgb = hexToRgb(candidate);
      const fgR = role === 'fg' ? candRgb : otherRgb;
      const bgR = role === 'fg' ? otherRgb : candRgb;

      if (passesWCAG(fgR, bgR, type)) return candidate;

      const cr = contrastRatio(
        relativeLuminance(simulateColor(fgR, type)),
        relativeLuminance(simulateColor(bgR, type))
      );
      if (cr > bestContrast) { bestContrast = cr; best = candidate; }
    }

    return best;
  }

  self.colorFixer = { isConfusable, fixColor, hexToHsl };
})();
