const CB_TYPES = [
  {
    id: 'protanopia',
    glyph: 'P',
    name: 'Protanopia',
    desc: 'Reduced red sensitivity',
    acc: 'oklch(0.55 0.15 250)',
    accOn: '#ffffff'
  },
  {
    id: 'deuteranopia',
    glyph: 'D',
    name: 'Deuteranopia',
    desc: 'Reduced green sensitivity',
    acc: 'oklch(0.72 0.15 66)',
    accOn: '#2a1a02'
  },
  {
    id: 'tritanopia',
    glyph: 'T',
    name: 'Tritanopia',
    desc: 'Reduced blue sensitivity',
    acc: 'oklch(0.58 0.16 350)',
    accOn: '#ffffff'
  }
];

const SVG = {
  moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a.6.6 0 0 0-.82-.7A9 9 0 1 0 20.7 15.3a.6.6 0 0 0-.7-.8Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 6.5"/></svg>',
  dash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>'
};

const state = {
  enabled: false,
  type: 'deuteranopia',
  theme: 'light',
  tabId: null,
  count: 0
};

function getActiveType() {
  return CB_TYPES.find(t => t.id === state.type) || CB_TYPES[1];
}

function applyAccent() {
  const popup = document.getElementById('popup');
  const active = getActiveType();
  popup.style.setProperty('--acc', active.acc);
  popup.style.setProperty('--acc-on', active.accOn);
}

function renderThemeBtn() {
  const btn = document.getElementById('theme-btn');
  btn.innerHTML = state.theme === 'dark' ? SVG.sun : SVG.moon;
  btn.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function renderSwitch() {
  const sw = document.getElementById('correction-switch');
  const knob = document.getElementById('switch-knob');
  sw.dataset.on = state.enabled;
  sw.setAttribute('aria-checked', state.enabled);
  knob.innerHTML = state.enabled ? SVG.check : SVG.dash;
}

function renderStateText() {
  const el = document.getElementById('tr-state');
  if (state.enabled) {
    el.innerHTML = 'Active &middot; <b>' + state.count + '</b> elements corrected';
  } else {
    el.textContent = 'Paused on this page';
  }
}

function renderSummary() {
  const el = document.getElementById('summary-text');
  const active = getActiveType();
  if (state.enabled) {
    el.innerHTML = '<b>' + state.count + ' elements</b> corrected for ' + active.name.toLowerCase() + ' on this page';
  } else {
    el.textContent = 'Correction paused — page shown unmodified';
  }
}

function renderTypeList() {
  const list = document.getElementById('type-list');
  list.innerHTML = '';
  CB_TYPES.forEach(function (t) {
    const row = document.createElement('button');
    row.className = 'type-row';
    row.dataset.selected = t.id === state.type;
    row.setAttribute('role', 'radio');
    row.setAttribute('aria-checked', t.id === state.type);
    row.style.setProperty('--acc', t.acc);
    row.style.setProperty('--acc-on', t.accOn);
    row.dataset.typeId = t.id;
    row.innerHTML =
      '<span class="type-glyph" aria-hidden="true">' + t.glyph + '</span>' +
      '<span class="type-info">' +
        '<span class="type-name">' + t.name + '</span>' +
        '<span class="type-desc">' + t.desc + '</span>' +
      '</span>' +
      '<span class="type-check" aria-hidden="true">' + SVG.check + '</span>';
    row.addEventListener('click', function () { selectType(t.id); });
    list.appendChild(row);
  });
}

function renderUI() {
  const popup = document.getElementById('popup');
  popup.className = 'popup theme-' + state.theme;
  popup.dataset.on = state.enabled;
  applyAccent();
  renderThemeBtn();
  renderSwitch();
  renderStateText();
  renderTypeList();
  renderSummary();
}

function selectType(typeId) {
  state.type = typeId;
  chrome.storage.sync.set({ type: typeId });
  applyAccent();
  renderTypeList();
  renderSummary();

  if (state.enabled && state.tabId) {
    chrome.runtime.sendMessage(
      { action: 'enable', type: typeId, tabId: state.tabId },
      function (response) {
        if (response && response.action === 'scanResult') {
          state.count = response.count;
          renderStateText();
          renderSummary();
        }
      }
    );
  }
}

function toggleCorrection(on) {
  state.enabled = on;
  chrome.storage.sync.set({ enabled: on });
  renderSwitch();

  const popup = document.getElementById('popup');
  popup.dataset.on = on;

  if (on && state.tabId) {
    chrome.runtime.sendMessage(
      { action: 'enable', type: state.type, tabId: state.tabId },
      function (response) {
        if (response && response.action === 'scanResult') {
          state.count = response.count;
          renderStateText();
          renderSummary();
        }
      }
    );
  } else {
    state.count = 0;
    renderStateText();
    renderSummary();

    if (state.tabId) {
      chrome.runtime.sendMessage({ action: 'disable', tabId: state.tabId });
    }
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  chrome.storage.sync.set({ theme: state.theme });
  document.getElementById('popup').className = 'popup theme-' + state.theme;
  renderThemeBtn();
}

function setupListeners() {
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);

  document.getElementById('correction-switch').addEventListener('click', function () {
    toggleCorrection(!state.enabled);
  });
}

chrome.storage.sync.get(['enabled', 'type', 'theme'], function (stored) {
  state.enabled = stored.enabled !== undefined ? stored.enabled : false;
  state.type = stored.type || 'deuteranopia';
  state.theme = stored.theme || 'light';

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    state.tabId = tabs && tabs[0] ? tabs[0].id : null;
    renderUI();
    setupListeners();
  });
});
