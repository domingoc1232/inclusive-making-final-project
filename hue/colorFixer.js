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
    h /= 360;
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
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
  }

  function fixColor(fgHex, bgHex, type) {
    const { hexToRgb, contrastRatio, relativeLuminance } = self.colorUtils;
    const { simulateColor } = self.daltonize;
    const { passesWCAG } = self.contrastChecker;

    const fgRgb = hexToRgb(fgHex);
    const bgRgb = hexToRgb(bgHex);

    if (passesWCAG(fgRgb, bgRgb, type)) {
      return { fg: fgHex, bg: bgHex };
    }

    const hsl = hexToHsl(fgHex);
    let bestHex = fgHex;
    let bestContrast = 0;

    for (let i = 1; i <= 50; i++) {
      const newL = Math.max(0, hsl.l - (i / 50) * hsl.l);
      const candidate = hslToHex(hsl.h, hsl.s, newL);
      const candRgb = hexToRgb(candidate);

      if (passesWCAG(candRgb, bgRgb, type)) {
        return { fg: candidate, bg: bgHex };
      }

      const simCand = simulateColor(candRgb, type);
      const simBg = simulateColor(bgRgb, type);
      const ratio = contrastRatio(relativeLuminance(simCand), relativeLuminance(simBg));
      if (ratio > bestContrast) {
        bestContrast = ratio;
        bestHex = candidate;
      }
    }

    return { fg: bestHex, bg: bgHex };
  }

  self.colorFixer = { fixColor };
})();
