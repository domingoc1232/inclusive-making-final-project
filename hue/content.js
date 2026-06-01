(function () {
  if (self.__hueInjected) return;
  self.__hueInjected = true;

  function parseRgb(str) {
    const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
  }

  function isTransparent(bg) {
    return !bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)';
  }

  function getEffectiveBg(el) {
    let current = el;
    while (current && current !== document.documentElement) {
      const bg = window.getComputedStyle(current).backgroundColor;
      if (!isTransparent(bg)) return bg;
      current = current.parentElement;
    }
    return 'rgb(255, 255, 255)';
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action === 'scan') {
      const type = msg.type;

      const existing = document.getElementById('hue-overrides');
      if (existing) existing.remove();
      document.querySelectorAll('[hue-id]').forEach(el => el.removeAttribute('hue-id'));

      const elements = document.body.querySelectorAll('*');
      const rules = [];
      let hueId = 0;

      for (const el of elements) {
        if (!el.innerText || !el.innerText.trim()) continue;

        const style = window.getComputedStyle(el);
        const fgStr = style.color;
        let bgStr = style.backgroundColor;

        if (isTransparent(bgStr)) {
          bgStr = getEffectiveBg(el.parentElement);
        }

        const fgRgb = parseRgb(fgStr);
        const bgRgb = parseRgb(bgStr);
        if (!fgRgb || !bgRgb) continue;

        if (!self.contrastChecker.passesWCAG(fgRgb, bgRgb, type)) {
          const fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
          const bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);
          const fixed = self.colorFixer.fixColor(fgHex, bgHex, type);

          if (fixed.fg !== fgHex) {
            const id = hueId++;
            el.setAttribute('hue-id', String(id));
            rules.push('[hue-id="' + id + '"] { color: ' + fixed.fg + ' !important; }');
          }
        }
      }

      if (rules.length > 0) {
        const styleEl = document.createElement('style');
        styleEl.id = 'hue-overrides';
        styleEl.textContent = rules.join('\n');
        document.head.appendChild(styleEl);
      }

      sendResponse({ action: 'scanResult', count: rules.length });
      return true;
    }

    if (msg.action === 'remove') {
      const styleEl = document.getElementById('hue-overrides');
      if (styleEl) styleEl.remove();
      document.querySelectorAll('[hue-id]').forEach(el => el.removeAttribute('hue-id'));
      sendResponse({ action: 'removeResult' });
      return true;
    }
  });
})();
