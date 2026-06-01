(function () {
  const MATRICES = {
    protanopia: [
      [0.56667, 0.43333, 0.00000],
      [0.55833, 0.44167, 0.00000],
      [0.00000, 0.24167, 0.75833]
    ],
    deuteranopia: [
      [0.62500, 0.37500, 0.00000],
      [0.70000, 0.30000, 0.00000],
      [0.00000, 0.30000, 0.70000]
    ],
    tritanopia: [
      [0.95000, 0.05000, 0.00000],
      [0.00000, 0.43333, 0.56667],
      [0.00000, 0.47500, 0.52500]
    ]
  };

  function simulateColor(rgb, type) {
    const { linearize, delinearize } = self.colorUtils;
    const m = MATRICES[type];
    if (!m) return rgb;

    const R = linearize(rgb.r);
    const G = linearize(rgb.g);
    const B = linearize(rgb.b);

    const r = m[0][0] * R + m[0][1] * G + m[0][2] * B;
    const g = m[1][0] * R + m[1][1] * G + m[1][2] * B;
    const b = m[2][0] * R + m[2][1] * G + m[2][2] * B;

    return {
      r: Math.round(Math.max(0, Math.min(1, delinearize(r))) * 255),
      g: Math.round(Math.max(0, Math.min(1, delinearize(g))) * 255),
      b: Math.round(Math.max(0, Math.min(1, delinearize(b))) * 255)
    };
  }

  self.daltonize = { simulateColor };
})();
