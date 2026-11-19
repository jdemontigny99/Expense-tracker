/* Inpenso — web edition.
 * A port of the Inpenso SwiftUI expense tracker (MIT, Dragomir Mindrescu) to a
 * dependency-free Progressive Web App. All data lives in localStorage on the device.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  const STORE_KEY = 'inpenso.v1';
  const DAY = 86400000;
  // Swift's JSONEncoder encodes Date as seconds since 2001-01-01 by default.
  const APPLE_EPOCH_OFFSET = 978307200;

  const BUILTIN_CATEGORIES = [
    { id: 'builtin-food', name: 'Food', icon: '🛒', color: '#34C759' },
    { id: 'builtin-eatingOut', name: 'Eating Out', icon: '🍴', color: '#00C7BE' },
    { id: 'builtin-rent', name: 'Rent', icon: '🏠', color: '#AF52DE' },
    { id: 'builtin-shopping', name: 'Shopping', icon: '🛍️', color: '#FF9500' },
    { id: 'builtin-entertainment', name: 'Entertainment', icon: '📺', color: '#FF2D55' },
    { id: 'builtin-transportation', name: 'Transportation', icon: '🚗', color: '#007AFF' },
    { id: 'builtin-utilities', name: 'Utilities', icon: '⚡', color: '#FFCC00' },
    { id: 'builtin-subscriptions', name: 'Subscriptions', icon: '🔁', color: '#30B0C7' },
    { id: 'builtin-healthcare', name: 'Healthcare', icon: '❤️', color: '#FF3B30' },
    { id: 'builtin-education', name: 'Education', icon: '📚', color: '#5856D6' },
    { id: 'builtin-others', name: 'Others', icon: '•••', color: '#8E8E93' }
  ];

  const CURRENCIES = [
    ['USD', 'US Dollar'], ['EUR', 'Euro'], ['MDL', 'Moldovan Leu'], ['GBP', 'British Pound'],
    ['JPY', 'Japanese Yen'], ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'],
    ['CHF', 'Swiss Franc'], ['CNY', 'Chinese Yuan'], ['INR', 'Indian Rupee'], ['RUB', 'Russian Ruble'],
    ['MXN', 'Mexican Peso'], ['BRL', 'Brazilian Real'], ['SEK', 'Swedish Krona'], ['NZD', 'New Zealand Dollar'],
    ['RON', 'Romanian Leu'], ['PLN', 'Polish Złoty'], ['KRW', 'South Korean Won']
  ];

  const EMOJI_OPTIONS = [
    '🛒', '🍴', '🏠', '🛍️', '📺', '🚗', '⚡', '🔁', '❤️', '📚', '🏷️', '☕',
    '🍺', '🍕', '✈️', '⛽', '🚌', '🎮', '🎬', '🎵', '💪', '💊', '🐶', '👶',
    '🎁', '💼', '💰', '💳', '📱', '💻', '👕', '💇', '🧾', '🏦', '📈', '🔧',
    '🌱', '🎓', '🏥', '🧸', '🍼', '🏖️', '⚽', '🚲', '🅿️', '🧹', '💡', '•••'
  ];

  const COLOR_OPTIONS = [
    '#34C759', '#00C7BE', '#30B0C7', '#007AFF', '#5856D6', '#AF52DE',
    '#FF2D55', '#FF3B30', '#FF9500', '#FFCC00', '#A2845E', '#8E8E93'
  ];

  // Minimal inline icon set (stroke icons, 24x24).
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chart: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    sort: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    export: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    import: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'
  };
  const icon = (name, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${ICONS[name]}</svg>`;

  // ---------------------------------------------------------------------------
  // State & persistence
  // ---------------------------------------------------------------------------
  const defaultState = () => ({
    transactions: [],
    budgets: {}, // "YYYY-MM" -> amount
    categories: BUILTIN_CATEGORIES.map((c) => ({ ...c, builtIn: true, hidden: false })),
    settings: { currency: 'USD', defaultCategoryID: 'builtin-food', theme: 'system' },
    ui: { installHintDismissed: false }
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      const d = defaultState();
      return {
        transactions: Array.isArray(s.transactions) ? s.transactions : [],
        budgets: s.budgets && typeof s.budgets === 'object' ? s.budgets : {},
        categories: Array.isArray(s.categories) && s.categories.length ? s.categories : d.categories,
        settings: { ...d.settings, ...(s.settings || {}) },
        ui: { ...d.ui, ...(s.ui || {}) }
      };
    } catch (e) {
      console.error('Failed to load data', e);
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('Could not save — storage is full');
    }
  }

  // Ask the browser not to evict our data.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtCache = {};
  function money(n, opts) {
    const code = state.settings.currency;
    const key = code + (opts && opts.compact ? 'c' : '');
    if (!fmtCache[key]) {
      try {
        fmtCache[key] = new Intl.NumberFormat(undefined, opts && opts.compact
          ? { style: 'currency', currency: code, notation: 'compact', maximumFractionDigits: 1 }
          : { style: 'currency', currency: code });
      } catch (e) {
        fmtCache[key] = { format: (v) => code + ' ' + v.toFixed(2) };
      }
    }
    return fmtCache[key].format(n || 0);
  }
  function currencySymbol() {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: state.settings.currency }).formatToParts(0);
      const p = parts.find((x) => x.type === 'currency');
      return p ? p.value : state.settings.currency;
    } catch (e) { return state.settings.currency; }
  }
  const pct = (n) => Math.round(n) + '%';

  const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, '0')}`; // m is 0-based
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const monthName = (m, style) => new Date(2000, m, 1).toLocaleString(undefined, { month: style || 'long' });
  const toDateInput = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function fromDateInput(str, keepTimeFrom) {
    const [y, m, d] = str.split('-').map(Number);
    const base = new Date(keepTimeFrom || Date.now());
    return new Date(y, m - 1, d, base.getHours(), base.getMinutes(), base.getSeconds()).getTime();
  }
  function dayLabel(t) {
    const today = startOfDay(Date.now());
    const d = startOfDay(t);
    if (d === today) return 'Today';
    if (d === today - DAY) return 'Yesterday';
    const sameYear = new Date(t).getFullYear() === new Date().getFullYear();
    return new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric' });
  }
  const shortDate = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  function categoryById(id) {
    return state.categories.find((c) => c.id === id) || state.categories.find((c) => c.id === 'builtin-others') || BUILTIN_CATEGORIES[10];
  }
  const visibleCategories = () => state.categories.filter((c) => !c.hidden);
  function preferredCategoryID(id) {
    const c = state.categories.find((x) => x.id === id && !x.hidden);
    return c ? c.id : (visibleCategories()[0] || state.categories[0]).id;
  }
  const badge = (cat, size) => `<span class="cat-badge" style="background:${cat.color};${size ? `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.52)}px` : ''}">${catGlyph(cat)}</span>`;
  const catGlyph = (cat) => cat.icon === '•••' ? '<span style="font-size:13px;font-weight:700;letter-spacing:1px">•••</span>' : esc(cat.icon);

  function txInMonth(y, m, type) {
    return state.transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m && (!type || t.type === type);
    });
  }
  const sum = (arr) => arr.reduce((a, t) => a + (typeof t === 'number' ? t : t.amount), 0);
  function totalsByCategory(list) {
    const out = {};
    list.forEach((t) => { out[t.categoryID] = (out[t.categoryID] || 0) + t.amount; });
    return out;
  }

  function haptic() { if (navigator.vibrate) navigator.vibrate(8); }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme() {
    const t = state.settings.theme;
    const dark = t === 'dark' || (t === 'system' && mql.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#000000' : '#f2f2f7';
  }
  mql.addEventListener ? mql.addEventListener('change', applyTheme) : mql.addListener(applyTheme);

  // ---------------------------------------------------------------------------
  // Router / tabs
  // ---------------------------------------------------------------------------
  const TABS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'analytics', label: 'Analytics', icon: 'chart' },
    { id: 'transactions', label: 'Transactions', icon: 'list' },
    { id: 'settings', label: 'Settings', icon: 'gear' }
  ];
  const now = new Date();
  const ui = {
    tab: 'home',
    analytics: { y: now.getFullYear(), m: now.getMonth(), section: 'overview' },
    list: { q: '', type: 'all', cat: 'all', sort: 'dateDesc' }
  };

  const view = document.getElementById('view');
  const tabbar = document.getElementById('tabbar');

  function renderTabbar() {
    tabbar.innerHTML = TABS.map((t) => `<button data-tab="${t.id}" class="${ui.tab === t.id ? 'active' : ''}" aria-label="${t.label}">${icon(t.icon)}<span>${t.label}</span></button>`).join('');
  }
  tabbar.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    if (ui.tab === b.dataset.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    ui.tab = b.dataset.tab;
    haptic();
    render(true);
  });

  function render(scrollTop) {
    applyTheme();
    renderTabbar();
    const fn = { home: renderHome, analytics: renderAnalytics, transactions: renderTransactions, settings: renderSettings }[ui.tab];
    const keepFocus = document.activeElement && document.activeElement.id === 'search-input';
    const selStart = keepFocus ? document.activeElement.selectionStart : 0;
    view.innerHTML = fn();
    if (keepFocus) {
      const inp = document.getElementById('search-input');
      if (inp) { inp.focus(); inp.setSelectionRange(selStart, selStart); }
    }
    if (scrollTop) window.scrollTo(0, 0);
  }

  // Global click delegation for [data-action] elements in the main view.
  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    const actions = {
      add: () => openTransactionSheet(),
      edit: () => openTransactionSheet(state.transactions.find((t) => t.id === el.dataset.id)),
      goto: () => { ui.tab = el.dataset.tab; render(true); },
      'month-prev': () => shiftMonth(-1),
      'month-next': () => shiftMonth(1),
      section: () => { ui.analytics.section = el.dataset.section; render(); },
      'filter-type': () => { ui.list.type = el.dataset.value; render(); },
      'filter-cat': () => { ui.list.cat = el.dataset.value; render(); },
      'reset-filters': () => { ui.list = { q: '', type: 'all', cat: 'all', sort: 'dateDesc' }; render(); },
      'set-budget': () => openBudgetSheet(),
      categories: () => openCategoriesSheet(),
      export: () => exportJSON(),
      'export-csv': () => exportCSV(),
      import: () => importData(),
      reset: () => resetAll(),
      'dismiss-install': () => { state.ui.installHintDismissed = true; save(); render(); },
      'delete-tx': () => deleteTransaction(el.dataset.id)
    };
    if (actions[a]) { e.preventDefault(); actions[a](); }
  });
  view.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') { ui.list.q = e.target.value; render(); }
  });
  view.addEventListener('change', (e) => {
    const s = e.target.dataset.setting;
    if (e.target.id === 'sort-select') { ui.list.sort = e.target.value; render(); return; }
    if (!s) return;
    state.settings[s] = e.target.value;
    if (s === 'currency') Object.keys(fmtCache).forEach((k) => delete fmtCache[k]);
    save();
    render();
  });

  function shiftMonth(d) {
    const a = ui.analytics;
    let m = a.m + d, y = a.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    const nowD = new Date();
    if (y > nowD.getFullYear() || (y === nowD.getFullYear() && m > nowD.getMonth())) return;
    a.m = m; a.y = y;
    haptic();
    render();
  }

  // ---------------------------------------------------------------------------
  // Charts (hand-rolled SVG)
  // ---------------------------------------------------------------------------
  function niceMax(v) {
    if (v <= 0) return 100;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  }
  const axisNum = (v) => v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'M' : v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(Math.round(v));

  function barChart(data, opts) {
    opts = opts || {};
    const W = 320, H = opts.height || 170, L = 34, B = 20, T = 8, R = 4;
    const max = niceMax(Math.max(...data.map((d) => d.value), opts.avg || 0));
    const cw = W - L - R, ch = H - B - T;
    const slot = cw / data.length;
    const bw = Math.max(2, Math.min(slot * 0.62, 36));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">`;
    s += `<defs><linearGradient id="bargrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent)" stop-opacity=".75"/></linearGradient></defs>`;
    for (let i = 0; i <= 4; i++) {
      const y = T + ch - (ch * i) / 4;
      s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${axisNum((max * i) / 4)}</text>`;
    }
    data.forEach((d, i) => {
      const h = (d.value / max) * ch;
      const x = L + slot * i + (slot - bw) / 2;
      const y = T + ch - h;
      const r = Math.min(4, bw / 2, h);
      if (h > 0) s += `<path d="M${x},${T + ch} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${T + ch} Z" fill="url(#bargrad)"${d.highlight ? ' opacity="1"' : ''}/>`;
      if (d.label) s += `<text x="${L + slot * i + slot / 2}" y="${H - 5}" text-anchor="middle">${esc(d.label)}</text>`;
    });
    if (opts.avg > 0) {
      const y = T + ch - (opts.avg / max) * ch;
      s += `<line class="avg" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="avg-label" x="${W - R}" y="${y - 4}" text-anchor="end">Avg</text>`;
    }
    return s + '</svg>';
  }

  function lineChart(data) {
    const W = 320, H = 180, L = 38, B = 20, T = 10, R = 10;
    const max = niceMax(Math.max(...data.map((d) => d.value)));
    const cw = W - L - R, ch = H - B - T;
    const pts = data.map((d, i) => [L + (data.length === 1 ? cw / 2 : (cw * i) / (data.length - 1)), T + ch - (d.value / max) * ch]);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:${H}px">`;
    s += `<defs><linearGradient id="areagrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
    for (let i = 0; i <= 4; i++) {
      const y = T + ch - (ch * i) / 4;
      s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${axisNum((max * i) / 4)}</text>`;
    }
    // Monotone-ish smoothing using a Catmull-Rom → Bezier conversion, clamped to the chart floor.
    const clampY = (y) => Math.min(T + ch, Math.max(T, y));
    let path = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, clampY(p1[1] + (p2[1] - p0[1]) / 6)];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, clampY(p2[1] - (p3[1] - p1[1]) / 6)];
      path += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    s += `<path d="${path} L${pts[pts.length - 1][0]},${T + ch} L${pts[0][0]},${T + ch} Z" fill="url(#areagrad)"/>`;
    s += `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>`;
    pts.forEach((p, i) => {
      s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--accent)"/><text x="${p[0]}" y="${H - 5}" text-anchor="middle">${esc(data[i].label)}</text>`;
    });
    return s + '</svg>';
  }

  function donut(segments) {
    const total = segments.reduce((a, s) => a + s.value, 0);
    const R = 50, C = 2 * Math.PI * R;
    let off = 0;
    let s = `<svg viewBox="0 0 130 130"><g transform="rotate(-90 65 65)">`;
    s += `<circle cx="65" cy="65" r="${R}" fill="none" stroke="var(--fill)" stroke-width="16"/>`;
    if (total > 0) {
      segments.forEach((seg) => {
        const len = (seg.value / total) * C;
        const gap = segments.length > 1 ? Math.min(2, len / 3) : 0;
        s += `<circle cx="65" cy="65" r="${R}" fill="none" stroke="${seg.color}" stroke-width="16" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}"/>`;
        off += len;
      });
    }
    return s + '</g></svg>';
  }

  // ---------------------------------------------------------------------------
  // Analytics engine (mirrors AnalyticsViewModel.swift)
  // ---------------------------------------------------------------------------
  function analyticsFor(y, m) {
    const expenses = txInMonth(y, m, 'expense');
    const incomes = txInMonth(y, m, 'income');
    const totalSpent = sum(expenses);
    const totalIncome = sum(incomes);
    const byCat = totalsByCategory(expenses);
    const dim = daysInMonth(y, m);
    const daily = [];
    for (let d = 1; d <= dim; d++) {
      const start = new Date(y, m, d).getTime();
      daily.push({ day: d, date: start, amount: sum(expenses.filter((t) => startOfDay(t.date) === start)) });
    }
    const activeDays = daily.filter((d) => d.amount > 0);
    const averageDaily = activeDays.length ? sum(activeDays.map((d) => d.amount)) / activeDays.length : 0;
    const projected = averageDaily > 0 ? averageDaily * dim : totalSpent;

    // Six-month trend ending at the selected month.
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(y, m - i, 1);
      trends.push({ y: dt.getFullYear(), m: dt.getMonth(), label: monthName(dt.getMonth(), 'short'), value: sum(txInMonth(dt.getFullYear(), dt.getMonth(), 'expense')) });
    }

    const prev = new Date(y, m - 1, 1);
    const prevByCat = totalsByCategory(txInMonth(prev.getFullYear(), prev.getMonth(), 'expense'));
    const catTrends = [...new Set([...Object.keys(byCat), ...Object.keys(prevByCat)])].map((id) => {
      const cur = byCat[id] || 0, p = prevByCat[id] || 0;
      return { id, current: cur, previous: p, change: p > 0 ? ((cur - p) / p) * 100 : (cur > 0 ? 100 : 0) };
    }).filter((t) => t.current > 0 || t.previous > 0)
      .sort((a, b) => Math.abs(b.current - b.previous) - Math.abs(a.current - a.previous));

    const budget = Number(state.budgets[monthKey(y, m)]) || 0;
    const nowD = new Date();
    const isCurrent = nowD.getFullYear() === y && nowD.getMonth() === m;
    const isPast = new Date(y, m + 1, 1) <= nowD;
    const daysRemaining = isCurrent ? dim - nowD.getDate() + 1 : (isPast ? 0 : dim);
    const remaining = budget - totalSpent;
    const perDayLeft = budget > 0 && daysRemaining > 0 ? Math.max(0, remaining) / daysRemaining : 0;

    // Weekday vs weekend
    let wkd = 0, wke = 0, wkdN = 0, wkeN = 0;
    const byWeekday = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach((t) => {
      const wd = new Date(t.date).getDay();
      byWeekday[wd] += t.amount;
      if (wd === 0 || wd === 6) { wke += t.amount; wkeN++; } else { wkd += t.amount; wkdN++; }
    });

    // Insights
    const insights = [];
    if (budget > 0) {
      const used = (totalSpent / budget) * 100;
      if (used >= 90) insights.push({ kind: 'neg', icon: '⚠️', title: 'Budget Alert', text: `You've used ${Math.round(used)}% of your monthly budget.` });
      else if (used >= 75) insights.push({ kind: 'neutral', icon: '🔔', title: 'Budget Notice', text: `You've used ${Math.round(used)}% of your monthly budget.` });
      else if (isCurrent && daysRemaining < 7 && used < 60) insights.push({ kind: 'pos', icon: '✅', title: 'Under Budget', text: "Great job! You're under budget this month." });
    }
    const growing = catTrends.filter((t) => t.previous > 0 && t.current > t.previous).sort((a, b) => b.change - a.change)[0];
    if (growing && growing.change > 30) insights.push({ kind: 'neg', icon: '📈', title: 'Spending Increase', text: `${categoryById(growing.id).name} spending increased by ${Math.round(growing.change)}% from last month.` });
    const reduced = catTrends.filter((t) => t.previous > 0 && t.current < t.previous && Math.abs(t.change) > 20).sort((a, b) => a.change - b.change)[0];
    if (reduced) insights.push({ kind: 'pos', icon: '📉', title: 'Spending Decrease', text: `You reduced ${categoryById(reduced.id).name} spending by ${Math.round(Math.abs(reduced.change))}%.` });
    if (budget > 0 && isCurrent && projected > budget) insights.push({ kind: 'neg', icon: '🔮', title: 'Projected Overspending', text: `At this rate, you might exceed your budget by ${money(projected - budget)}.` });
    if (totalIncome > 0) {
      const rate = ((totalIncome - totalSpent) / totalIncome) * 100;
      if (rate >= 20) insights.push({ kind: 'pos', icon: '🏦', title: 'Healthy Savings', text: `You're keeping ${Math.round(rate)}% of your income this month.` });
      else if (rate < 0) insights.push({ kind: 'neg', icon: '💸', title: 'Spending Exceeds Income', text: `You've spent ${money(totalSpent - totalIncome)} more than you earned.` });
    }
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    if (topCat && totalSpent > 0 && topCat[1] / totalSpent > 0.5 && Object.keys(byCat).length > 1) {
      insights.push({ kind: 'neutral', icon: '🎯', title: 'Concentrated Spending', text: `${categoryById(topCat[0]).name} makes up ${Math.round((topCat[1] / totalSpent) * 100)}% of your spending.` });
    }

    return {
      expenses, incomes, totalSpent, totalIncome, net: totalIncome - totalSpent, byCat, daily, averageDaily, projected,
      trends, catTrends, budget, remaining, perDayLeft, daysRemaining, isCurrent, isPast, dim,
      weekday: { total: wkd, n: wkdN }, weekend: { total: wke, n: wkeN }, byWeekday, insights, topCat
    };
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------
  function categoryBreakdown(byCat, total, limit) {
    const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, limit || 99);
    if (!rows.length) return '<div class="muted small center" style="padding:16px 0">No category data available</div>';
    return '<ul class="list">' + rows.map(([id, amt]) => {
      const c = categoryById(id);
      return `<li class="list-item">${badge(c)}<div class="grow"><div class="title">${esc(c.name)}</div></div><div class="right"><div>${money(amt)}</div><div class="sub">${pct(total ? (amt / total) * 100 : 0)}</div></div></li>`;
    }).join('') + '</ul>';
  }

  function txRow(t, opts) {
    const c = categoryById(t.categoryID);
    const isIncome = t.type === 'income';
    const sub = opts && opts.showDate ? `${esc(c.name)} · ${shortDate(t.date)}` : esc(c.name) + (t.notes ? ' · ' + esc(t.notes) : '');
    const amount = `<span class="${isIncome ? 'pos' : ''}">${isIncome ? '+' : '−'}${money(t.amount)}</span>`;
    const inner = `${badge(c)}<div class="grow"><div class="title">${esc(t.title)}</div><div class="sub">${sub}</div></div><div class="right">${amount}</div>`;
    if (opts && opts.swipe) {
      return `<div class="swipe" data-id="${t.id}"><button class="swipe-delete" data-action="delete-tx" data-id="${t.id}">Delete</button><button class="swipe-content" data-action="edit" data-id="${t.id}">${inner}</button></div>`;
    }
    return `<li class="list-item" data-action="edit" data-id="${t.id}" style="cursor:pointer">${inner}</li>`;
  }

  function installHint() {
    const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (standalone || state.ui.installHintDismissed) return '';
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const how = isIOS
      ? 'Tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>.'
      : 'Use your browser menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.';
    return `<div class="card install-hint"><div class="ic">📲</div><div class="grow small" style="flex:1">Install Inpenso on your phone. ${how}</div><button class="x" data-action="dismiss-install" aria-label="Dismiss">×</button></div>`;
  }

  function renderHome() {
    const d = new Date();
    const a = analyticsFor(d.getFullYear(), d.getMonth());
    const progress = a.budget > 0 ? a.totalSpent / a.budget : 0;
    const pcls = progress >= 1 ? 'over' : progress >= 0.75 ? 'warn' : '';

    // Last 7 days
    const today = startOfDay(Date.now());
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const day = today - i * DAY;
      // Use calendar arithmetic so DST shifts don't break the bucket.
      const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      const st = dt.getTime();
      const amount = sum(state.transactions.filter((t) => t.type === 'expense' && startOfDay(t.date) === st));
      week.push({ value: amount, label: dt.toLocaleDateString(undefined, { weekday: 'short' }), day });
    }
    const weekActive = week.filter((w) => w.value > 0);
    const weekAvg = weekActive.length ? sum(weekActive.map((w) => w.value)) / weekActive.length : 0;
    const recent = [...state.transactions].sort((x, y) => y.date - x.date).slice(0, 5);

    return `
      <div class="header"><h1>Home</h1><button class="pill-btn" data-action="add">${icon('plus')}Add</button></div>
      ${installHint()}
      <div class="card hero">
        <div class="label">Total Spent This Month</div>
        <div class="amount">${money(a.totalSpent)}</div>
        ${a.budget > 0 ? `
          <div class="progress ${pcls}"><div style="width:${Math.min(100, progress * 100)}%"></div></div>
          <div class="meta"><span>${pct(progress * 100)} of budget</span><span>${a.daysRemaining} days left</span></div>`
        : `<button class="link-row small" style="padding-top:0" data-action="set-budget">Set a monthly budget</button>`}
        <div class="split">
          <div><div class="k">Income</div><div class="v pos">${money(a.totalIncome)}</div></div>
          <div><div class="k">Net</div><div class="v ${a.net < 0 ? 'neg' : ''}">${money(a.net)}</div></div>
          <div><div class="k">${a.budget > 0 ? 'Left / day' : 'Avg / day'}</div><div class="v">${money(a.budget > 0 ? a.perDayLeft : a.averageDaily)}</div></div>
        </div>
      </div>
      <div class="card">
        <h2>Recent Spending</h2>
        ${weekActive.length ? barChart(week, { avg: weekAvg }) + '<div class="chart-caption">Showing spending for the last 7 days</div>'
          : '<div class="muted small center" style="padding:24px 0">No spending in the last 7 days</div>'}
      </div>
      <div class="card">
        <h2>Spending by Category</h2>
        ${categoryBreakdown(a.byCat, a.totalSpent, 5)}
      </div>
      <div class="card">
        <h2>Recent Transactions</h2>
        ${recent.length ? '<ul class="list">' + recent.map((t) => txRow(t, { showDate: true })).join('') + '</ul><button class="link-row" data-action="goto" data-tab="transactions">View All Transactions</button>'
          : `<div class="empty" style="padding:20px"><div class="big">🧾</div><div class="t">No transactions yet</div><div class="small">Tap <b>Add</b> to record your first expense.</div></div>`}
      </div>`;
  }

  function renderAnalytics() {
    const { y, m, section } = ui.analytics;
    const a = analyticsFor(y, m);
    const nowD = new Date();
    const atNow = y === nowD.getFullYear() && m === nowD.getMonth();
    const sections = [['overview', 'Overview'], ['trends', 'Trends'], ['insights', 'Insights'], ['budget', 'Budget']];
    let body = '';
    const hasData = a.expenses.length || a.incomes.length;

    if (section === 'overview') {
      if (!hasData) {
        body = `<div class="card empty"><div class="big">📊</div><div class="t">No data available</div><div class="small">Add your first transaction for ${monthName(m)} ${y}</div></div>`;
      } else {
        const segs = Object.entries(a.byCat).sort((p, q) => q[1] - p[1]).map(([id, v]) => ({ value: v, color: categoryById(id).color, name: categoryById(id).name }));
        body = `
        <div class="card">
          <h2>Monthly Cashflow</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Spent</div><div class="v">${money(a.totalSpent)}</div></div>
            <div class="stat"><div class="k">Income</div><div class="v pos">${money(a.totalIncome)}</div></div>
            <div class="stat"><div class="k">Net</div><div class="v ${a.net < 0 ? 'neg' : 'pos'}">${money(a.net)}</div></div>
            <div class="stat"><div class="k">Transactions</div><div class="v">${a.expenses.length + a.incomes.length}</div></div>
          </div>
        </div>
        <div class="card">
          <h2>Daily Spending</h2>
          ${barChart(a.daily.map((d) => ({ value: d.amount, label: (d.day === 1 || d.day % 5 === 0) ? String(d.day) : '' })), { avg: a.averageDaily, height: 150 })}
          <div class="chart-caption">Average on active days: ${money(a.averageDaily)}</div>
        </div>
        ${segs.length ? `<div class="card">
          <h2>Spending by Category</h2>
          <div class="donut-wrap">${donut(segs)}<div class="legend">${segs.slice(0, 6).map((s) => `<div class="legend-row"><span class="dot" style="background:${s.color}"></span><span class="n">${esc(s.name)}</span><span class="muted">${pct((s.value / a.totalSpent) * 100)}</span></div>`).join('')}${segs.length > 6 ? `<div class="legend-row muted small">+${segs.length - 6} more</div>` : ''}</div></div>
          <div style="margin-top:8px">${Object.entries(a.byCat).sort((p, q) => q[1] - p[1]).map(([id, v]) => {
            const c = categoryById(id);
            return `<div class="bar-row"><div class="top"><div class="l">${badge(c, 26)}<span>${esc(c.name)}</span></div><span>${money(v)}</span></div><div class="bar-track"><div style="width:${(v / a.totalSpent) * 100}%;background:${c.color}"></div></div></div>`;
          }).join('')}</div>
        </div>` : ''}
        ${Object.keys(totalsByCategory(a.incomes)).length ? `<div class="card"><h2>Income by Category</h2>${categoryBreakdown(totalsByCategory(a.incomes), a.totalIncome)}</div>` : ''}`;
      }
    } else if (section === 'trends') {
      const nonzero = a.trends.filter((t) => t.value > 0);
      const avg6 = nonzero.length ? sum(nonzero.map((t) => t.value)) / nonzero.length : 0;
      const prevMonth = a.trends[4].value;
      const mom = prevMonth > 0 ? ((a.totalSpent - prevMonth) / prevMonth) * 100 : null;
      body = `
        <div class="card">
          <h2>Monthly Spending</h2>
          ${nonzero.length ? lineChart(a.trends) : '<div class="muted small center" style="padding:24px 0">Not enough data</div>'}
        </div>
        <div class="card">
          <div class="stats-grid">
            <div class="stat"><div class="k">6-month average</div><div class="v">${money(avg6)}</div></div>
            <div class="stat"><div class="k">vs. last month</div><div class="v ${mom == null ? '' : mom > 0 ? 'neg' : 'pos'}">${mom == null ? '—' : (mom > 0 ? '↑ ' : '↓ ') + pct(Math.abs(mom))}</div></div>
          </div>
        </div>
        <div class="card">
          <h2>Category Changes</h2>
          ${a.catTrends.length ? '<ul class="list">' + a.catTrends.map((t) => {
            const c = categoryById(t.id);
            const up = t.current > t.previous;
            const same = t.current === t.previous;
            return `<li class="list-item"><span class="dot" style="background:${c.color}"></span><div class="grow"><div class="title">${esc(c.name)}</div></div>
              <div class="${same ? 'muted' : up ? 'neg' : 'pos'}" style="font-weight:600;font-size:15px">${same ? '—' : (up ? '↑ ' : '↓ ') + pct(Math.abs(t.change))}</div>
              <div class="right" style="min-width:84px"><div style="font-size:15px">${money(t.current)}</div><div class="sub">${money(t.previous)}</div></div></li>`;
          }).join('') + '</ul>' : '<div class="muted small center" style="padding:16px 0">No data available for comparison</div>'}
        </div>`;
    } else if (section === 'insights') {
      const wdAvg = a.weekday.n ? a.weekday.total / a.weekday.n : 0;
      const weAvg = a.weekend.n ? a.weekend.total / a.weekend.n : 0;
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const order = [1, 2, 3, 4, 5, 6, 0];
      const biggest = [...a.expenses].sort((p, q) => q.amount - p.amount)[0];
      body = `
        <div class="card">
          <h2>Smart Insights</h2>
          ${a.insights.length ? a.insights.map((i) => `<div class="insight"><div class="ic" style="background:${i.kind === 'pos' ? 'rgba(52,199,89,.18)' : i.kind === 'neg' ? 'rgba(255,59,48,.18)' : 'rgba(255,149,0,.18)'}">${i.icon}</div><div><div class="t">${esc(i.title)}</div><div class="d">${esc(i.text)}</div></div></div>`).join('')
            : '<div class="muted small center" style="padding:16px 0">No insights available yet. Keep tracking — insights appear as patterns emerge.</div>'}
        </div>
        <div class="card">
          <h2>Key Statistics</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Average daily spend</div><div class="v">${money(a.averageDaily)}</div></div>
            <div class="stat"><div class="k">Monthly projection</div><div class="v">${money(a.isCurrent ? a.projected : a.totalSpent)}</div></div>
            <div class="stat"><div class="k">Top spending category</div><div class="v" style="font-size:16px">${a.topCat ? esc(categoryById(a.topCat[0]).name) : '—'}</div></div>
            <div class="stat"><div class="k">Largest expense</div><div class="v" style="font-size:16px">${biggest ? money(biggest.amount) : '—'}</div></div>
          </div>
        </div>
        <div class="card">
          <h2>Spending Patterns</h2>
          <h3>Weekday vs Weekend (avg per transaction)</h3>
          <div class="stats-grid" style="margin-bottom:14px">
            <div class="stat"><div class="k">Weekdays</div><div class="v">${money(wdAvg)}</div></div>
            <div class="stat"><div class="k">Weekends</div><div class="v">${money(weAvg)}</div></div>
          </div>
          <h3>Most Active Days</h3>
          ${a.expenses.length ? barChart(order.map((i) => ({ value: a.byWeekday[i], label: days[i] })), { height: 130 }) : '<div class="muted small center" style="padding:16px 0">Not enough data</div>'}
        </div>`;
    } else {
      const progress = a.budget > 0 ? a.totalSpent / a.budget : 0;
      const pcls = progress >= 1 ? 'over' : progress >= 0.75 ? 'warn' : '';
      // Budget history: previous 6 months that had a budget.
      const hist = [];
      for (let i = 0; i < 12 && hist.length < 6; i++) {
        const dt = new Date(y, m - i, 1);
        const b = Number(state.budgets[monthKey(dt.getFullYear(), dt.getMonth())]) || 0;
        if (b > 0) hist.push({ label: `${monthName(dt.getMonth(), 'short')} ${dt.getFullYear()}`, budget: b, spent: sum(txInMonth(dt.getFullYear(), dt.getMonth(), 'expense')) });
      }
      const onBudget = hist.filter((h) => h.spent <= h.budget).length;
      const nonzero = a.trends.filter((t) => t.value > 0);
      const suggested = nonzero.length ? Math.ceil((sum(nonzero.map((t) => t.value)) / nonzero.length) * 1.05 / 10) * 10 : 0;
      body = `
        <div class="card">
          <div class="card-row" style="margin-bottom:12px"><h2 style="margin:0">Monthly Budget</h2><button class="pill-btn" style="padding:6px 14px;font-size:15px" data-action="set-budget">${a.budget > 0 ? 'Edit' : 'Set Budget'}</button></div>
          ${a.budget > 0 ? `
            <div class="card-row" style="align-items:flex-end;margin-bottom:10px">
              <div><div class="muted small">Spent</div><div style="font-size:26px;font-weight:700">${money(a.totalSpent)}</div></div>
              <div style="text-align:right"><div class="muted small">of</div><div style="font-size:17px;font-weight:600">${money(a.budget)}</div></div>
            </div>
            <div class="progress ${pcls}"><div style="width:${Math.min(100, progress * 100)}%"></div></div>
            <div class="card-row small muted" style="margin-top:8px"><span>${pct(progress * 100)} Used</span><span>${pct(Math.max(0, (1 - progress) * 100))} Remaining</span></div>
          ` : '<div class="muted small" style="padding:4px 0 2px">No budget set for this month. Set one to track your progress and get alerts.</div>'}
        </div>
        ${a.budget > 0 ? `<div class="card">
          <h2>Budget Status</h2>
          <div class="stats-grid">
            <div class="stat"><div class="k">Remaining</div><div class="v ${a.remaining < 0 ? 'neg' : 'pos'}">${money(a.remaining)}</div></div>
            <div class="stat"><div class="k">Days Remaining</div><div class="v">${a.daysRemaining} days</div></div>
            <div class="stat"><div class="k">Daily Budget Left</div><div class="v">${money(a.perDayLeft)}</div></div>
            <div class="stat"><div class="k">Projected</div><div class="v ${a.isCurrent && a.projected > a.budget ? 'neg' : ''}">${money(a.isCurrent ? a.projected : a.totalSpent)}</div></div>
          </div>
          ${a.isCurrent && a.projected > a.budget ? `<div class="insight" style="margin-top:6px"><div class="ic" style="background:rgba(255,149,0,.18)">💡</div><div><div class="t">To Get Back on Track</div><div class="d">Try to keep daily spending under ${money(a.perDayLeft)} for the rest of the month.</div></div></div>` : ''}
        </div>` : ''}
        ${suggested > 0 ? `<div class="card"><div class="card-row"><div><div class="muted small">Suggested Next Month</div><div style="font-size:20px;font-weight:600">${money(suggested)}</div></div><div class="muted small" style="text-align:right;max-width:55%">Based on your 6‑month average spending plus 5%</div></div></div>` : ''}
        <div class="card">
          <h2>Budget History</h2>
          ${hist.length ? `<div class="muted small" style="margin-bottom:6px">${onBudget} of ${hist.length} months on or under budget</div>` + hist.map((h) => {
            const p = h.spent / h.budget;
            return `<div class="bar-row"><div class="top"><span>${h.label}</span><span class="${p > 1 ? 'neg' : ''}">${money(h.spent)} <span class="muted small">/ ${money(h.budget)}</span></span></div><div class="progress ${p >= 1 ? 'over' : p >= 0.75 ? 'warn' : ''}" style="height:6px"><div style="width:${Math.min(100, p * 100)}%"></div></div></div>`;
          }).join('') : '<div class="muted small center" style="padding:12px 0">Not enough budget history yet</div>'}
        </div>`;
    }

    return `
      <div class="header"><h1>Analytics</h1></div>
      <div class="month-picker">
        <button data-action="month-prev" aria-label="Previous month">${icon('left')}</button>
        <div class="m">${monthName(m)} <span>${y}</span></div>
        <button data-action="month-next" aria-label="Next month" ${atNow ? 'disabled' : ''}>${icon('right')}</button>
      </div>
      <div class="segmented">${sections.map(([id, l]) => `<button class="${section === id ? 'active' : ''}" data-action="section" data-section="${id}">${l}</button>`).join('')}</div>
      ${body}`;
  }

  function renderTransactions() {
    const f = ui.list;
    const q = f.q.trim().toLowerCase();
    let list = state.transactions.filter((t) => {
      if (f.type !== 'all' && t.type !== f.type) return false;
      if (f.cat !== 'all' && t.categoryID !== f.cat) return false;
      if (q) {
        const c = categoryById(t.categoryID);
        const hay = `${t.title} ${t.notes || ''} ${c.name} ${t.amount}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorters = {
      dateDesc: (a, b) => b.date - a.date,
      dateAsc: (a, b) => a.date - b.date,
      amountDesc: (a, b) => b.amount - a.amount,
      amountAsc: (a, b) => a.amount - b.amount,
      title: (a, b) => a.title.localeCompare(b.title)
    };
    list.sort(sorters[f.sort] || sorters.dateDesc);
    const usedCats = [...new Set(state.transactions.map((t) => t.categoryID))];
    const catChips = state.categories.filter((c) => !c.hidden || usedCats.includes(c.id)).filter((c) => usedCats.includes(c.id));
    const filtered = f.type !== 'all' || f.cat !== 'all' || q;
    const totalOut = sum(list.filter((t) => t.type === 'expense'));
    const totalIn = sum(list.filter((t) => t.type === 'income'));

    let content;
    if (!state.transactions.length) {
      content = `<div class="empty"><div class="big">🧾</div><div class="t">No transactions yet</div><div class="small" style="margin-bottom:16px">Start tracking by adding your first expense.</div><button class="pill-btn" data-action="add">${icon('plus')}Add Transaction</button></div>`;
    } else if (!list.length) {
      content = `<div class="empty"><div class="big">🔍</div><div class="t">No Transactions Found</div><div class="small" style="margin-bottom:16px">Try adjusting your search or filters</div><button class="pill-btn" data-action="reset-filters">Reset Filters</button></div>`;
    } else if (f.sort.startsWith('date')) {
      const groups = [];
      list.forEach((t) => {
        const k = startOfDay(t.date);
        let g = groups[groups.length - 1];
        if (!g || g.k !== k) { g = { k, items: [] }; groups.push(g); }
        g.items.push(t);
      });
      content = groups.map((g) => {
        const out = sum(g.items.filter((t) => t.type === 'expense'));
        return `<div class="day-header"><span>${dayLabel(g.k)}</span><span>${out ? '−' + money(out) : ''}</span></div><div class="group">${g.items.map((t) => txRow(t, { swipe: true })).join('')}</div>`;
      }).join('');
    } else {
      content = `<div class="group" style="margin-top:12px">${list.map((t) => txRow(t, { swipe: true, showDate: true })).join('')}</div>`;
    }

    return `
      <div class="header"><h1>Transactions</h1><button class="pill-btn" data-action="add">${icon('plus')}Add</button></div>
      <div class="search">${icon('search')}<input id="search-input" type="search" placeholder="Search transactions" value="${esc(f.q)}" autocomplete="off"></div>
      <div class="chips">
        ${[['all', 'All'], ['expense', 'Expenses'], ['income', 'Income']].map(([v, l]) => `<button class="chip ${f.type === v ? 'active' : ''}" data-action="filter-type" data-value="${v}">${l}</button>`).join('')}
        <label class="chip" style="position:relative">${icon('sort', 'style="width:14px;height:14px"')}Sort
          <select id="sort-select" style="position:absolute;inset:0;opacity:0;width:100%">
            ${[['dateDesc', 'Newest first'], ['dateAsc', 'Oldest first'], ['amountDesc', 'Highest amount'], ['amountAsc', 'Lowest amount'], ['title', 'Title A–Z']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
      </div>
      ${catChips.length > 1 ? `<div class="chips">
        <button class="chip ${f.cat === 'all' ? 'active' : ''}" data-action="filter-cat" data-value="all">All categories</button>
        ${catChips.map((c) => `<button class="chip ${f.cat === c.id ? 'active' : ''}" data-action="filter-cat" data-value="${c.id}"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</button>`).join('')}
      </div>` : ''}
      ${list.length && filtered ? `<div class="muted small" style="margin:4px 4px 0">${list.length} items · Spent ${money(totalOut)}${totalIn ? ' · Income ' + money(totalIn) : ''}</div>` : ''}
      ${content}
      ${list.length ? '<div class="muted small center" style="margin-top:16px">Swipe left on a transaction to delete it</div>' : ''}`;
  }

  function renderSettings() {
    const s = state.settings;
    const cur = CURRENCIES.some((c) => c[0] === s.currency) ? CURRENCIES : [[s.currency, s.currency], ...CURRENCIES];
    return `
      <div class="header"><h1>Settings</h1></div>
      <div class="settings-title">Appearance</div>
      <div class="settings-group">
        <div class="row"><span class="row-ic" style="background:#5856D6">🌓</span><span class="grow">Theme</span>
          <select data-setting="theme">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div>
      </div>
      <div class="settings-title">Default Settings</div>
      <div class="settings-group">
        <div class="row"><span class="row-ic" style="background:#34C759">💵</span><span class="grow">Currency</span>
          <select data-setting="currency">${cur.map(([c, n]) => `<option value="${c}" ${s.currency === c ? 'selected' : ''}>${n} (${c})</option>`).join('')}</select>
        </div>
        <div class="row"><span class="row-ic" style="background:#FF9500">⭐</span><span class="grow">Default Category</span>
          <select data-setting="defaultCategoryID">${visibleCategories().map((c) => `<option value="${c.id}" ${preferredCategoryID(s.defaultCategoryID) === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        </div>
        <button class="row" data-action="categories"><span class="row-ic" style="background:#007AFF">${icon('tag')}</span><span class="grow">Manage Categories</span><span class="val">${visibleCategories().length}</span>${icon('right', 'class="chev"')}</button>
      </div>
      <div class="settings-title">Data Management</div>
      <div class="settings-group">
        <button class="row" data-action="export"><span class="row-ic" style="background:#30B0C7">${icon('export')}</span><span class="grow">Export Backup (JSON)</span>${icon('right', 'class="chev"')}</button>
        <button class="row" data-action="export-csv"><span class="row-ic" style="background:#34C759">${icon('file')}</span><span class="grow">Export Spreadsheet (CSV)</span>${icon('right', 'class="chev"')}</button>
        <button class="row" data-action="import"><span class="row-ic" style="background:#AF52DE">${icon('import')}</span><span class="grow">Import Data</span>${icon('right', 'class="chev"')}</button>
        <button class="row danger" data-action="reset"><span class="row-ic" style="background:#FF3B30">${icon('trash')}</span><span class="grow">Reset All Data</span></button>
      </div>
      <div class="settings-foot">Your data is stored only on this device. Export a backup regularly — it can be imported here or into the iOS Inpenso app.</div>
      <div class="settings-title">About</div>
      <div class="settings-group">
        <div class="row"><span class="grow">Version</span><span class="val">Web 1.0</span></div>
        <div class="row"><span class="grow">Transactions</span><span class="val">${state.transactions.length}</span></div>
        <a class="row accent" href="https://github.com/VintusS/Inpenso" target="_blank" rel="noopener" style="text-decoration:none"><span class="grow">Based on Inpenso by Dragomir Mindrescu (MIT)</span>${icon('right', 'class="chev"')}</a>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Swipe-to-delete on transaction rows
  // ---------------------------------------------------------------------------
  let swipe = null;
  let openSwipe = null;
  const closeOpenSwipe = (except) => {
    if (openSwipe && openSwipe !== except) { openSwipe.style.transform = ''; openSwipe = null; }
  };
  view.addEventListener('touchstart', (e) => {
    const c = e.target.closest('.swipe-content');
    if (!c) { closeOpenSwipe(); return; }
    closeOpenSwipe(c);
    const t = e.touches[0];
    swipe = { el: c, x: t.clientX, y: t.clientY, dx: 0, base: c === openSwipe ? -88 : 0, locked: null };
  }, { passive: true });
  view.addEventListener('touchmove', (e) => {
    if (!swipe) return;
    const t = e.touches[0];
    const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
    if (swipe.locked == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) swipe.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (swipe.locked !== 'x') return;
    swipe.dx = dx;
    const x = Math.min(0, Math.max(-140, swipe.base + dx));
    swipe.el.classList.add('dragging');
    swipe.el.style.transform = `translateX(${x}px)`;
  }, { passive: true });
  view.addEventListener('touchend', () => {
    if (!swipe) return;
    const s = swipe; swipe = null;
    s.el.classList.remove('dragging');
    if (s.locked !== 'x') return;
    const x = s.base + s.dx;
    if (x < -44) { s.el.style.transform = 'translateX(-88px)'; openSwipe = s.el; haptic(); }
    else { s.el.style.transform = ''; if (openSwipe === s.el) openSwipe = null; }
    // Swallow the click that follows a horizontal drag.
    s.el.dataset.justSwiped = '1';
    setTimeout(() => { delete s.el.dataset.justSwiped; }, 350);
  });
  view.addEventListener('click', (e) => {
    const c = e.target.closest('.swipe-content');
    if (c && (c.dataset.justSwiped || c === openSwipe)) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (!c.dataset.justSwiped) closeOpenSwipe();
    }
  }, true);

  // ---------------------------------------------------------------------------
  // Toast with optional undo
  // ---------------------------------------------------------------------------
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg, action) {
    toastEl.innerHTML = esc(msg) + (action ? ` <button>${esc(action.label)}</button>` : '');
    toastEl.classList.add('show');
    if (action) toastEl.querySelector('button').onclick = () => { action.fn(); toastEl.classList.remove('show'); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), action ? 4500 : 2200);
  }

  function deleteTransaction(id) {
    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const [removed] = state.transactions.splice(idx, 1);
    save();
    openSwipe = null;
    render();
    haptic();
    toast('Transaction deleted', { label: 'Undo', fn: () => { state.transactions.push(removed); save(); render(); } });
  }

  // ---------------------------------------------------------------------------
  // Sheets (modals)
  // ---------------------------------------------------------------------------
  const sheetRoot = document.getElementById('sheet-root');
  const sheetStack = [];

  function openSheet({ title, left, right, body, onMount, onRight, rightDisabled }) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="sheet-backdrop"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="sheet-nav"><button class="l">${left || 'Cancel'}</button><div class="t">${esc(title)}</div><button class="r" ${rightDisabled ? 'disabled' : ''}>${right || ''}</button></div>
        <div class="sheet-body"></div>
      </div>`;
    sheetRoot.appendChild(wrap);
    const sheet = wrap.querySelector('.sheet');
    const backdrop = wrap.querySelector('.sheet-backdrop');
    const bodyEl = wrap.querySelector('.sheet-body');
    bodyEl.innerHTML = body;
    const close = () => {
      sheet.classList.remove('open'); backdrop.classList.remove('open');
      setTimeout(() => wrap.remove(), 300);
      sheetStack.splice(sheetStack.indexOf(api), 1);
      if (!sheetStack.length) document.body.style.overflow = '';
    };
    const api = { close, el: sheet, body: bodyEl, rightBtn: wrap.querySelector('.r') };
    sheetStack.push(api);
    document.body.style.overflow = 'hidden';
    wrap.querySelector('.l').onclick = close;
    backdrop.onclick = close;
    if (onRight) api.rightBtn.onclick = () => onRight(api);
    requestAnimationFrame(() => requestAnimationFrame(() => { sheet.classList.add('open'); backdrop.classList.add('open'); }));
    if (onMount) onMount(api);
    return api;
  }

  function categoryGrid(selectedId, cats) {
    return `<div class="cat-grid">${cats.map((c) => `<button type="button" class="cat-btn ${c.id === selectedId ? 'sel' : ''}" data-cat="${c.id}"><span class="circ" style="background:${c.color}">${catGlyph(c)}</span><span>${esc(c.name)}</span></button>`).join('')}</div>`;
  }

  function openTransactionSheet(existing) {
    const editing = !!existing;
    const draft = existing ? { ...existing } : {
      type: 'expense', title: '', amount: '', date: Date.now(), notes: '',
      categoryID: preferredCategoryID(state.settings.defaultCategoryID)
    };
    const cats = () => {
      const v = visibleCategories();
      return v.some((c) => c.id === draft.categoryID) ? v : [...v, categoryById(draft.categoryID)];
    };
    const body = () => `
      <div class="segmented small-seg" style="margin-bottom:16px">
        <button type="button" data-type="expense" class="${draft.type === 'expense' ? 'active' : ''}">Expense</button>
        <button type="button" data-type="income" class="${draft.type === 'income' ? 'active' : ''}">Income</button>
      </div>
      <div class="card">
        <h2 style="font-size:17px">${draft.type === 'income' ? 'Income' : 'Expense'} Details</h2>
        <div class="field"><label for="f-title">Title</label><input id="f-title" type="text" placeholder="${draft.type === 'income' ? 'e.g. Salary' : 'e.g. Coffee'}" value="${esc(draft.title)}" maxlength="80" autocomplete="off"></div>
        <div class="field"><label for="f-amount">Amount</label><div class="amount-input"><span>${esc(currencySymbol())}</span><input id="f-amount" type="text" inputmode="decimal" placeholder="0.00" value="${esc(draft.amount === '' ? '' : draft.amount)}" autocomplete="off"></div></div>
        <div class="field" style="margin-bottom:0"><label for="f-date">Date</label><input id="f-date" type="date" value="${toDateInput(draft.date)}" max="${toDateInput(Date.now() + 366 * DAY)}"></div>
      </div>
      <div class="card"><h2 style="font-size:17px">Category</h2><div id="f-cats">${categoryGrid(draft.categoryID, cats())}</div></div>
      <div class="card"><div class="field" style="margin:0"><label for="f-notes">Notes (optional)</label><textarea id="f-notes" rows="2" maxlength="300" placeholder="Add a note">${esc(draft.notes || '')}</textarea></div></div>
      <button class="btn" id="f-save" type="button">${editing ? 'Save Changes' : draft.type === 'income' ? 'Save Income' : 'Save Expense'}</button>
      ${editing ? '<button class="btn danger" id="f-delete" type="button">Delete Transaction</button>' : ''}`;

    const parseAmount = (s) => {
      const str = String(s).trim().replace(/\s/g, '');
      if (!str) return NaN;
      // Accept "1,234.56", "1.234,56" and "12,5".
      let norm = str;
      if (/,\d{1,2}$/.test(str) && !/\.\d{1,2}$/.test(str)) norm = str.replace(/\./g, '').replace(',', '.');
      else norm = str.replace(/,/g, '');
      return Number(norm);
    };
    const valid = () => draft.title.trim() && parseAmount(draft.amount) > 0;

    let sheet;
    openSheet({
      title: editing ? 'Edit Transaction' : 'Add Transaction',
      right: editing ? 'Save' : 'Add',
      rightDisabled: !valid(),
      body: body(),
      onRight: () => submit(),
      onMount: (api) => {
        sheet = api;
        if (!editing) setTimeout(() => { const t = api.body.querySelector('#f-title'); if (t) t.focus(); }, 320);
        wire(api);
      }
    });

    function refreshValidity() {
      const ok = !!valid();
      sheet.rightBtn.disabled = !ok;
      const b = sheet.body.querySelector('#f-save');
      if (b) b.disabled = !ok;
    }

    function wire(api) {
      const b = api.body;
      b.querySelector('#f-title').oninput = (e) => { draft.title = e.target.value; refreshValidity(); };
      b.querySelector('#f-amount').oninput = (e) => { draft.amount = e.target.value; refreshValidity(); };
      b.querySelector('#f-date').onchange = (e) => { if (e.target.value) draft.date = fromDateInput(e.target.value, draft.date); };
      b.querySelector('#f-notes').oninput = (e) => { draft.notes = e.target.value; };
      b.querySelectorAll('[data-type]').forEach((btn) => btn.onclick = () => {
        draft.type = btn.dataset.type;
        b.innerHTML = body(); wire(api); refreshValidity(); haptic();
      });
      b.querySelector('#f-cats').onclick = (e) => {
        const c = e.target.closest('[data-cat]');
        if (!c) return;
        draft.categoryID = c.dataset.cat;
        b.querySelectorAll('.cat-btn').forEach((x) => x.classList.toggle('sel', x.dataset.cat === draft.categoryID));
        haptic();
      };
      b.querySelector('#f-save').onclick = submit;
      const del = b.querySelector('#f-delete');
      if (del) del.onclick = () => {
        if (confirm('Delete this transaction?')) { sheet.close(); deleteTransaction(existing.id); }
      };
      refreshValidity();
    }

    function submit() {
      if (!valid()) return;
      const tx = {
        id: editing ? existing.id : uid(),
        title: draft.title.trim(),
        amount: Math.round(parseAmount(draft.amount) * 100) / 100,
        date: draft.date,
        type: draft.type,
        categoryID: draft.categoryID,
        notes: (draft.notes || '').trim() || undefined
      };
      if (editing) {
        const i = state.transactions.findIndex((t) => t.id === existing.id);
        if (i >= 0) state.transactions[i] = tx;
      } else {
        state.transactions.push(tx);
      }
      save();
      sheet.close();
      haptic();
      render();
      toast(editing ? 'Changes saved' : 'Transaction Added!');
    }
  }

  function openBudgetSheet() {
    const { y, m } = ui.tab === 'analytics' ? ui.analytics : { y: new Date().getFullYear(), m: new Date().getMonth() };
    const key = monthKey(y, m);
    const current = Number(state.budgets[key]) || 0;
    const sheet = openSheet({
      title: 'Set Monthly Budget',
      right: 'Save',
      body: `
        <div class="card">
          <h2 style="font-size:17px">${monthName(m)} ${y}</h2>
          <div class="field" style="margin:0"><label for="b-amount">Budget Amount</label><div class="amount-input"><span>${esc(currencySymbol())}</span><input id="b-amount" type="text" inputmode="decimal" placeholder="0.00" value="${current || ''}"></div></div>
        </div>
        <label class="card" style="display:flex;align-items:center;gap:12px"><input type="checkbox" id="b-forward" style="width:20px;height:20px"> <span class="small">Also apply to the next 11 months</span></label>
        <button class="btn" id="b-save">Save Budget</button>
        ${current ? '<button class="btn danger" id="b-clear">Remove Budget</button>' : ''}`,
      onRight: () => doSave(),
      onMount: (api) => {
        api.body.querySelector('#b-save').onclick = () => doSave();
        const clr = api.body.querySelector('#b-clear');
        if (clr) clr.onclick = () => { delete state.budgets[key]; save(); api.close(); render(); toast('Budget removed'); };
        setTimeout(() => api.body.querySelector('#b-amount').focus(), 320);
      }
    });
    function doSave() {
      const v = Number(String(sheet.body.querySelector('#b-amount').value).replace(/,/g, '.').replace(/[^\d.]/g, ''));
      if (!(v > 0)) { toast('Enter a budget amount'); return; }
      const fwd = sheet.body.querySelector('#b-forward').checked;
      for (let i = 0; i < (fwd ? 12 : 1); i++) {
        const dt = new Date(y, m + i, 1);
        state.budgets[monthKey(dt.getFullYear(), dt.getMonth())] = Math.round(v * 100) / 100;
      }
      save();
      sheet.close();
      render();
      toast('Budget saved');
    }
  }

  function openCategoriesSheet() {
    const body = () => {
      const vis = visibleCategories();
      const hidden = state.categories.filter((c) => c.hidden);
      return `
        <button class="btn" id="c-add" style="margin-bottom:16px">＋ New Category</button>
        <div class="settings-title" style="margin-top:0">Shown in pickers</div>
        <div class="settings-group">${vis.map((c, i) => `
          <div class="row" data-id="${c.id}">
            ${badge(c, 30)}
            <button class="grow" data-edit="${c.id}" style="text-align:left">${esc(c.name)}${c.builtIn ? '' : ' <span class="muted small">· custom</span>'}</button>
            <div class="mini-btns">
              <button data-move="up" data-id="${c.id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('up')}</button>
              <button data-move="down" data-id="${c.id}" ${i === vis.length - 1 ? 'disabled' : ''} aria-label="Move down">${icon('down')}</button>
              <button data-hide="${c.id}" ${vis.length <= 1 ? 'disabled' : ''} aria-label="Hide" style="color:var(--red)">${icon('trash')}</button>
            </div>
          </div>`).join('')}
        </div>
        <div class="settings-foot">Tap a category to edit its name, icon or color. Removing a category hides it from pickers; existing transactions keep it.</div>
        ${hidden.length ? `<div class="settings-title">Hidden</div><div class="settings-group">${hidden.map((c) => `
          <div class="row">${badge(c, 30)}<span class="grow muted">${esc(c.name)}</span><button class="accent" data-restore="${c.id}" style="color:var(--accent);font-weight:500">Restore</button></div>`).join('')}</div>` : ''}
        <button class="btn secondary" id="c-reset" style="margin-top:18px">Reset to Defaults</button>`;
    };
    const sheet = openSheet({ title: 'Categories', left: 'Done', body: body(), onMount: (api) => wire(api) });
    function rerender() { sheet.body.innerHTML = body(); wire(sheet); render(); }
    function wire(api) {
      const b = api.body;
      b.querySelector('#c-add').onclick = () => openCategoryEditor(null, rerender);
      b.querySelector('#c-reset').onclick = () => {
        if (!confirm('Reset built-in categories to their defaults and restore any hidden ones? Custom categories are kept.')) return;
        const custom = state.categories.filter((c) => !c.builtIn).map((c) => ({ ...c, hidden: false }));
        state.categories = [...BUILTIN_CATEGORIES.map((c) => ({ ...c, builtIn: true, hidden: false })), ...custom];
        save(); rerender();
      };
      b.onclick = (e) => {
        const t = e.target.closest('button');
        if (!t) return;
        if (t.dataset.edit) openCategoryEditor(state.categories.find((c) => c.id === t.dataset.edit), rerender);
        else if (t.dataset.hide) { const c = state.categories.find((x) => x.id === t.dataset.hide); c.hidden = true; save(); rerender(); }
        else if (t.dataset.restore) { const c = state.categories.find((x) => x.id === t.dataset.restore); c.hidden = false; save(); rerender(); }
        else if (t.dataset.move) {
          const vis = visibleCategories();
          const i = vis.findIndex((c) => c.id === t.dataset.id);
          const j = t.dataset.move === 'up' ? i - 1 : i + 1;
          if (j < 0 || j >= vis.length) return;
          const ai = state.categories.indexOf(vis[i]), aj = state.categories.indexOf(vis[j]);
          [state.categories[ai], state.categories[aj]] = [state.categories[aj], state.categories[ai]];
          save(); rerender();
        }
      };
    }
  }

  function openCategoryEditor(cat, done) {
    const draft = cat ? { ...cat } : { name: '', icon: '🏷️', color: COLOR_OPTIONS[3] };
    const body = () => `
      <div class="center" style="margin:6px 0 16px">${badge(draft, 72)}</div>
      <div class="card"><div class="field" style="margin:0"><label for="ce-name">Name</label><input id="ce-name" type="text" maxlength="30" value="${esc(draft.name)}" placeholder="Category name"></div></div>
      <div class="card"><h2 style="font-size:17px">Icon</h2><div class="emoji-grid">${EMOJI_OPTIONS.map((e) => `<button type="button" data-emoji="${e}" class="${draft.icon === e ? 'sel' : ''}">${e === '•••' ? '<span style="font-size:13px;font-weight:700">•••</span>' : e}</button>`).join('')}</div>
        <div class="field" style="margin:12px 0 0"><label for="ce-custom">Or type any emoji</label><input id="ce-custom" type="text" maxlength="4" placeholder="🙂"></div></div>
      <div class="card"><h2 style="font-size:17px">Color</h2><div class="color-grid">${COLOR_OPTIONS.map((c) => `<button type="button" data-color="${c}" class="${draft.color === c ? 'sel' : ''}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div></div>`;
    const sheet = openSheet({
      title: cat ? 'Edit Category' : 'New Category',
      right: 'Save',
      body: body(),
      rightDisabled: !draft.name.trim(),
      onRight: () => submit(),
      onMount: (api) => wire(api)
    });
    function wire(api) {
      const b = api.body;
      b.querySelector('#ce-name').oninput = (e) => { draft.name = e.target.value; api.rightBtn.disabled = !draft.name.trim(); };
      b.querySelector('#ce-custom').oninput = (e) => {
        const v = e.target.value.trim();
        if (v) { draft.icon = [...v].slice(0, 2).join(''); b.querySelector('.cat-badge').innerHTML = catGlyph(draft); b.querySelectorAll('[data-emoji]').forEach((x) => x.classList.remove('sel')); }
      };
      b.onclick = (e) => {
        const t = e.target.closest('button');
        if (!t) return;
        if (t.dataset.emoji) draft.icon = t.dataset.emoji;
        else if (t.dataset.color) draft.color = t.dataset.color;
        else return;
        const name = draft.name;
        b.innerHTML = body(); wire(api);
        b.querySelector('#ce-name').value = name;
      };
    }
    function submit() {
      const name = draft.name.trim();
      if (!name) return;
      if (cat) {
        Object.assign(state.categories.find((c) => c.id === cat.id), { name, icon: draft.icon, color: draft.color });
      } else {
        state.categories.push({ id: 'custom-' + uid(), name, icon: draft.icon, color: draft.color, builtIn: false, hidden: false });
      }
      save();
      sheet.close();
      done();
    }
  }

  // ---------------------------------------------------------------------------
  // Import / export
  // ---------------------------------------------------------------------------
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const file = typeof File === 'function' ? new File([blob], filename, { type: mime }) : null;
    // On iOS, the share sheet lets users save to Files / AirDrop / email.
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename }).catch(() => {});
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const stamp = () => toDateInput(Date.now());

  function exportJSON() {
    if (!state.transactions.length) { toast('Nothing to export yet'); return; }
    const payload = { app: 'Inpenso Web', version: 1, exportedAt: new Date().toISOString(), ...state, ui: undefined };
    download(`Inpenso_backup_${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
  }

  function exportCSV() {
    if (!state.transactions.length) { toast('Nothing to export yet'); return; }
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [['Date', 'Type', 'Title', 'Category', 'Amount', 'Currency', 'Notes']];
    [...state.transactions].sort((a, b) => a.date - b.date).forEach((t) => {
      rows.push([toDateInput(t.date), t.type, t.title, categoryById(t.categoryID).name, t.amount.toFixed(2), state.settings.currency, t.notes || '']);
    });
    download(`Inpenso_${stamp()}.csv`, rows.map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
  }

  function parseDate(v) {
    if (typeof v === 'number') {
      // Heuristics: ms since 1970, s since 1970, or Swift's s since 2001.
      if (v > 1e11) return v;
      if (v > 1.2e9) return v * 1000; // looks like a Unix timestamp (after 2008)
      return (v + APPLE_EPOCH_OFFSET) * 1000;
    }
    const t = Date.parse(v);
    return isNaN(t) ? Date.now() : t;
  }

  function normalizeTx(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const amount = Number(raw.amount != null ? raw.amount : raw.price);
    if (!(amount >= 0) || !raw.title) return null;
    let categoryID = raw.categoryID || (raw.category ? 'builtin-' + raw.category : 'builtin-others');
    return {
      id: typeof raw.id === 'string' ? raw.id : uid(),
      title: String(raw.title),
      amount,
      date: parseDate(raw.date),
      type: raw.type === 'income' ? 'income' : 'expense',
      categoryID,
      notes: raw.notes || undefined
    };
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const list = Array.isArray(data) ? data : data.transactions || data.expenses;
          if (!Array.isArray(list)) throw new Error('No transactions');
          const txs = list.map(normalizeTx).filter(Boolean);
          const replace = confirm(`Found ${txs.length} transactions.\n\nOK = replace all current data\nCancel = merge with existing data`);
          if (replace) {
            state.transactions = txs;
            if (!Array.isArray(data)) {
              if (data.budgets) state.budgets = data.budgets;
              if (Array.isArray(data.categories) && data.categories.length) state.categories = data.categories;
              if (data.settings) state.settings = { ...state.settings, ...data.settings };
            }
          } else {
            const ids = new Set(state.transactions.map((t) => t.id));
            txs.forEach((t) => { if (!ids.has(t.id)) state.transactions.push(t); });
            if (!Array.isArray(data) && data.budgets) state.budgets = { ...data.budgets, ...state.budgets };
            if (!Array.isArray(data) && Array.isArray(data.categories)) {
              const have = new Set(state.categories.map((c) => c.id));
              data.categories.forEach((c) => { if (!have.has(c.id)) state.categories.push(c); });
            }
          }
          // Make sure every referenced custom category exists so it renders with a name.
          const have = new Set(state.categories.map((c) => c.id));
          state.transactions.forEach((t) => {
            if (!have.has(t.categoryID)) {
              const builtin = BUILTIN_CATEGORIES.find((c) => c.id === t.categoryID);
              state.categories.push(builtin ? { ...builtin, builtIn: true, hidden: false } : { id: t.categoryID, name: 'Imported', icon: '🏷️', color: '#8E8E93', builtIn: false, hidden: true });
              have.add(t.categoryID);
            }
          });
          Object.keys(fmtCache).forEach((k) => delete fmtCache[k]);
          save();
          render();
          toast(`Imported ${txs.length} transactions`);
        } catch (e) {
          alert('Failed to import data. Please check the file format and try again.');
        }
      };
      reader.readAsText(f);
    };
    input.click();
  }

  function resetAll() {
    if (!confirm('This will delete all your transactions and budgets. This action cannot be undone.')) return;
    state.transactions = [];
    state.budgets = {};
    save();
    render();
    toast('All data reset');
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  // Re-render when returning to the app (e.g. the day changed) and when another tab edits data.
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !sheetStack.length) render(); });
  window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); render(); } });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Exposed for debugging / tests.
  window.__inpenso = { get state() { return state; }, render, save, analyticsFor };
})();
