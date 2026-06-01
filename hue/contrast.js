(function () {
  function passesWCAG(fgRgb, bgRgb, type) {
    const { contrastRatio, relativeLuminance } = self.colorUtils;
    const { simulateColor } = self.daltonize;

    const simFg = simulateColor(fgRgb, type);
    const simBg = simulateColor(bgRgb, type);

    const lumFg = relativeLuminance(simFg);
    const lumBg = relativeLuminance(simBg);

    return contrastRatio(lumFg, lumBg) >= 4.5;
  }

  self.contrastChecker = { passesWCAG };
})();
