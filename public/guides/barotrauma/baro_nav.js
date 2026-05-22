/*
 * baro_nav.js — global navigation for the Barotrauma guide.
 *
 * One file, self-contained. Injects styles + DOM, no build step.
 * Each guide page just needs:
 *
 *     <script defer src="baro_nav.js"></script>
 *
 * This script does all of:
 *   - Sticky topbar with "Back to Guides" (returns to kilujo.com main site),
 *     a title, a position chip (e.g. "5 / 17"), and an "All mods" button.
 *   - Slide-in drawer listing the hub, the playbook, and all 17 mods grouped
 *     by category. Includes a filter input.
 *   - Auto-highlights the current page in the drawer.
 *   - Keyboard shortcuts: J/K = next/prev mod, / = open filter, Esc = close.
 *   - Replaces any existing .prev-next / .backbar with consistent ones derived
 *     from the load-order list. (Existing markup is left alone if not found.)
 *
 * Single source of truth: the PAGES array below. Edit there to add or rename
 * mods — every page picks up the change automatically.
 */
(function () {
  'use strict';

  // --- Data --------------------------------------------------------------
  // Order here is the canonical load order; prev/next walks this array.
  // `kind` controls drawer grouping; 'hub' and 'playbook' are pinned at top.
  const PAGES = [
    { file: 'baro_index.html', title: 'Guide Hub', kind: 'hub' },
    { file: 'Barotrauma_Modded_Campaign_Guide.html', title: 'Campaign Playbook', kind: 'playbook' },

    { file: 'baro_01_luacs.html',                 num: '01', title: 'LuaCsForBarotrauma',         cat: 'framework', tag: 'Library' },
    { file: 'baro_02_performance_fix.html',       num: '02', title: 'Performance Fix',           cat: 'framework', tag: 'Lua' },

    { file: 'baro_03_barotraumatic.html',         num: '03', title: 'Barotraumatic',             cat: 'overhaul',  tag: 'Monsters' },
    { file: 'baro_04_vanilla_weapons_overhaul.html', num: '04', title: 'Vanilla Weapons Overhaul', cat: 'overhaul',  tag: 'Weapons' },
    { file: 'baro_05_jobsextended.html',          num: '05', title: 'JobsExtended',              cat: 'overhaul',  tag: 'Jobs' },
    { file: 'baro_06_enhanced_reactors.html',     num: '06', title: 'Enhanced Reactors',         cat: 'overhaul',  tag: 'Reactor' },
    { file: 'baro_07_immersive_repairs.html',     num: '07', title: 'Immersive Repairs',         cat: 'overhaul',  tag: 'Repairs' },
    { file: 'baro_08_artifacts_ruins_enhanced.html', num: '08', title: 'Artifacts & Ruins Enhanced', cat: 'overhaul', tag: 'Research' },

    { file: 'baro_09_adv_beacon_stations.html',   num: '09', title: 'ADV Beacon Stations',       cat: 'content',   tag: 'Beacons' },
    { file: 'baro_10_beacons_extended.html',      num: '10', title: 'Beacons Extended',          cat: 'content',   tag: 'Beacons' },
    { file: 'baro_11_even_more_beacon_stations.html', num: '11', title: 'Even More Beacon Stations', cat: 'content', tag: 'Beacons' },
    { file: 'baro_12_facehurts_beacon_stations.html', num: '12', title: "Facehurt's Beacon Stations", cat: 'content', tag: 'Beacons' },
    { file: 'baro_13_shipwrecks_extended.html',   num: '13', title: 'Shipwrecks Extended',       cat: 'content',   tag: 'Wrecks' },
    { file: 'baro_14_astras_wrecks.html',         num: '14', title: "Astra's Wrecks",            cat: 'content',   tag: 'Wrecks' },

    { file: 'baro_15_enhanced_immersion.html',    num: '15', title: 'Enhanced Immersion',        cat: 'world',     tag: 'QoL' },
    { file: 'baro_16_neurotrauma.html',           num: '16', title: 'Neurotrauma',               cat: 'world',     tag: 'Medical' },
    { file: 'baro_17_dynamiceuropa.html',         num: '17', title: 'DynamicEuropa',             cat: 'world',     tag: 'World' },
  ];

  const CAT_LABELS = {
    framework: 'Framework & performance',
    overhaul:  'Major gameplay overhauls',
    content:   'Additive content — beacons & wrecks',
    world:     'Immersion & world',
  };
  const CAT_ORDER = ['framework', 'overhaul', 'content', 'world'];
  const MODS = PAGES.filter((p) => p.cat);
  const HUB = PAGES.find((p) => p.kind === 'hub');
  const PLAYBOOK = PAGES.find((p) => p.kind === 'playbook');

  // --- Current page detection --------------------------------------------
  const currentFile = (() => {
    const path = window.location.pathname || '';
    const last = decodeURIComponent(path.split('/').pop() || '');
    // Fallback if served at /guides/barotrauma/ with no filename → treat as hub
    return last || 'baro_index.html';
  })();
  const currentEntry = PAGES.find((p) => p.file === currentFile);
  const isModPage = currentEntry && currentEntry.cat;
  const modIndex = isModPage ? MODS.findIndex((p) => p.file === currentFile) : -1;
  const prevMod = modIndex > 0 ? MODS[modIndex - 1] : null;
  const nextMod = modIndex >= 0 && modIndex < MODS.length - 1 ? MODS[modIndex + 1] : null;

  // --- Styles (injected) -------------------------------------------------
  const CSS = `
.baro-skip{position:absolute;left:-9999px;}
.baro-skip:focus{left:8px;top:8px;background:#0a1419;color:#fff;padding:8px 14px;border-radius:8px;border:1px solid #36c2c2;z-index:2000;}

.baro-topbar{position:sticky;top:0;z-index:90;
  background:rgba(10,20,25,.85);backdrop-filter:saturate(150%) blur(10px);
  -webkit-backdrop-filter:saturate(150%) blur(10px);
  border-bottom:1px solid #1d3540;}
.baro-topbar__inner{max-width:1080px;margin:0 auto;padding:10px 30px;
  display:flex;align-items:center;gap:14px;}
.baro-topbar a{color:inherit;text-decoration:none;}
.baro-back{display:inline-flex;align-items:center;gap:6px;color:#caa14a;font-size:13px;font-weight:600;
  padding:6px 10px;border-radius:7px;border:1px solid transparent;transition:.15s;}
.baro-back:hover{color:#f0a830;background:#13282f;border-color:#1d3540;}
.baro-back .baro-arrow{font-size:15px;line-height:1;}
.baro-divider{flex:1;}
.baro-title{display:none;color:#8aa6b1;font-size:13px;letter-spacing:1px;text-transform:uppercase;}
.baro-title strong{color:#d7e6ec;text-transform:none;letter-spacing:0;font-weight:600;margin-left:8px;}
.baro-pos{background:#16323d;border:1px solid #1d3540;color:#5fd0d0;font-size:11px;font-weight:700;
  letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:999px;display:none;}
.baro-pos b{color:#fff;}
.baro-menu-btn{display:inline-flex;align-items:center;gap:8px;background:#13282f;border:1px solid #1d3540;
  color:#d7e6ec;font-size:13px;font-weight:600;padding:7px 12px;border-radius:7px;cursor:pointer;
  font-family:inherit;transition:.15s;}
.baro-menu-btn:hover{border-color:#36c2c2;color:#fff;background:#16323d;}
.baro-menu-btn .baro-hamburger{display:inline-block;width:14px;height:10px;position:relative;}
.baro-menu-btn .baro-hamburger::before,
.baro-menu-btn .baro-hamburger::after,
.baro-menu-btn .baro-hamburger span{
  content:"";position:absolute;left:0;right:0;height:2px;background:currentColor;border-radius:2px;}
.baro-menu-btn .baro-hamburger::before{top:0;}
.baro-menu-btn .baro-hamburger span{top:4px;}
.baro-menu-btn .baro-hamburger::after{bottom:0;}
@media(min-width:720px){
  .baro-title{display:block;}
  .baro-pos{display:inline-block;}
}

/* Drawer */
.baro-backdrop{position:fixed;inset:0;background:rgba(5,10,12,.65);backdrop-filter:blur(2px);
  opacity:0;pointer-events:none;transition:opacity .22s ease;z-index:120;}
.baro-backdrop.open{opacity:1;pointer-events:auto;}
.baro-drawer{position:fixed;top:0;right:0;bottom:0;width:min(380px,92vw);
  background:linear-gradient(180deg,#0d1f27,#0a1419);
  border-left:1px solid #1d3540;
  transform:translateX(100%);transition:transform .26s cubic-bezier(.2,.7,.2,1);
  z-index:130;display:flex;flex-direction:column;box-shadow:-14px 0 40px rgba(0,0,0,.5);}
.baro-drawer.open{transform:translateX(0);}
.baro-drawer__head{display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px;border-bottom:1px solid #1d3540;}
.baro-drawer__head h2{margin:0;font-size:13px;color:#36c2c2;letter-spacing:2px;text-transform:uppercase;font-weight:700;}
.baro-close{background:transparent;border:0;color:#8aa6b1;font-size:24px;line-height:1;cursor:pointer;
  padding:4px 10px;border-radius:7px;font-family:inherit;}
.baro-close:hover{color:#fff;background:#13282f;}
.baro-filter{padding:12px 18px;border-bottom:1px solid #1d3540;}
.baro-filter input{width:100%;background:#0a1419;border:1px solid #1d3540;color:#d7e6ec;
  padding:9px 12px;border-radius:7px;font-size:13.5px;font-family:inherit;outline:none;transition:.15s;}
.baro-filter input:focus{border-color:#36c2c2;background:#0d2129;}
.baro-filter input::placeholder{color:#5d7782;}
.baro-list{flex:1;overflow-y:auto;padding:8px 0 18px;}
.baro-list__group-label{color:#caa14a;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
  font-weight:700;padding:14px 18px 6px;}
.baro-list__pinned{padding:6px 12px;}
.baro-link{display:flex;align-items:flex-start;gap:10px;padding:9px 14px;margin:0 6px;
  border-radius:8px;text-decoration:none;color:#d7e6ec;transition:.12s;border-left:3px solid transparent;}
.baro-link:hover{background:#13282f;}
.baro-link.is-current{background:#13282f;border-left-color:#36c2c2;}
.baro-link.is-current .baro-link__title{color:#fff;}
.baro-link__num{flex:0 0 28px;color:#36c2c2;font-size:11.5px;font-weight:700;letter-spacing:.5px;margin-top:1px;}
.baro-link__body{flex:1;min-width:0;}
.baro-link__title{display:block;font-size:13.5px;font-weight:600;color:#d7e6ec;}
.baro-link__sub{display:block;font-size:11.5px;color:#8aa6b1;margin-top:1px;}
.baro-link__icon{flex:0 0 22px;font-size:13px;color:#caa14a;margin-top:1px;}
.baro-link--hub .baro-link__icon{color:#36c2c2;}
.baro-link--playbook .baro-link__icon{color:#f0a830;}
.baro-list__cat-framework .baro-link__num{color:#5fd0d0;}
.baro-list__cat-overhaul   .baro-link__num{color:#f0a830;}
.baro-list__cat-content    .baro-link__num{color:#62b56a;}
.baro-list__cat-world      .baro-link__num{color:#b58ad6;}
.baro-list__empty{padding:18px;color:#8aa6b1;font-size:13px;text-align:center;font-style:italic;}
.baro-drawer__foot{border-top:1px solid #1d3540;padding:10px 18px;font-size:11.5px;color:#8aa6b1;
  display:flex;flex-wrap:wrap;gap:6px 14px;}
.baro-drawer__foot kbd{background:#16323d;border:1px solid #1d3540;color:#caa14a;
  font-family:Consolas,monospace;font-size:11px;padding:1px 6px;border-radius:4px;}

/* Auto-injected prev/next at the bottom of mod pages.
   Inherits the original .prev-next look so it blends with the theme. */
.baro-prev-next{display:flex;gap:14px;margin:32px 0 0;padding-top:20px;border-top:1px solid #1d3540;}
.baro-prev-next a{flex:1;display:block;background:#0f1f28;border:1px solid #1d3540;border-radius:10px;
  padding:14px 18px;text-decoration:none;color:#d7e6ec;transition:.18s;}
.baro-prev-next a:hover{border-color:#36c2c2;background:#13282f;transform:translateY(-1px);}
.baro-prev-next a.pn-empty{visibility:hidden;}
.baro-prev-next .pn-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;
  color:#8aa6b1;margin-bottom:2px;}
.baro-prev-next .pn-title{font-weight:700;color:#fff;font-size:15px;}
.baro-prev-next .pn-next{text-align:right;}
.baro-prev-next .pn-prev .pn-label::before{content:"\\2190 ";}
.baro-prev-next .pn-next .pn-label::after{content:" \\2192";}
@media(max-width:600px){.baro-prev-next{flex-direction:column;}}

/* Lock body scroll while drawer is open */
body.baro-locked{overflow:hidden;}

/* ── Wide screens: drawer becomes a persistent right-side sidebar ── */
@media (min-width: 1280px) {
  /* Make room for the sidebar so page content never hides behind it. */
  body { padding-right: 340px; }
  /* Pin the drawer open and visible. */
  .baro-drawer{
    width:340px;
    transform:none;
    box-shadow:none;
    border-left:1px solid #1d3540;
  }
  /* Backdrop and hamburger become redundant. */
  .baro-backdrop,
  .baro-menu-btn,
  .baro-close { display:none !important; }
  /* Don't lock body scroll when sidebar is persistent — / just focuses the filter. */
  body.baro-locked { overflow:auto; }
}
`;

  // --- DOM build helpers -------------------------------------------------
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  // --- Build topbar ------------------------------------------------------
  function buildTopbar() {
    const titleText = currentEntry ? currentEntry.title : 'Barotrauma Guide';
    const back = h('a', { class: 'baro-back', href: '/guides', 'aria-label': 'Back to Guides on kilujo.com' },
      h('span', { class: 'baro-arrow', 'aria-hidden': 'true' }, '←'),
      h('span', null, 'kilujo / guides'));

    const title = h('div', { class: 'baro-title' },
      'Field Manual',
      h('strong', null, titleText));

    const pos = isModPage
      ? h('span', { class: 'baro-pos' },
          h('b', null, String(modIndex + 1)), ' / ' + MODS.length)
      : null;

    const menuBtn = h('button', {
      class: 'baro-menu-btn',
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-controls': 'baro-drawer',
      'aria-expanded': 'false',
      onclick: openDrawer,
    },
      h('span', { class: 'baro-hamburger', 'aria-hidden': 'true' }, h('span')),
      'All mods');

    const inner = h('div', { class: 'baro-topbar__inner' },
      back,
      title,
      h('div', { class: 'baro-divider' }),
      pos,
      menuBtn);

    return h('div', { class: 'baro-topbar', role: 'banner' }, inner);
  }

  // --- Build drawer ------------------------------------------------------
  function buildDrawer() {
    function modLink(p) {
      const isCurrent = p.file === currentFile;
      return h('a', {
        class: 'baro-link' + (isCurrent ? ' is-current' : ''),
        href: p.file,
        'data-search': (p.title + ' ' + (p.tag || '')).toLowerCase(),
        'aria-current': isCurrent ? 'page' : null,
      },
        h('span', { class: 'baro-link__num' }, p.num),
        h('span', { class: 'baro-link__body' },
          h('span', { class: 'baro-link__title' }, p.title),
          p.tag ? h('span', { class: 'baro-link__sub' }, p.tag) : null));
    }

    function pinned(p, label, mod) {
      const isCurrent = p.file === currentFile;
      return h('a', {
        class: 'baro-link baro-link--' + mod + (isCurrent ? ' is-current' : ''),
        href: p.file,
        'data-search': p.title.toLowerCase(),
        'aria-current': isCurrent ? 'page' : null,
      },
        h('span', { class: 'baro-link__icon', 'aria-hidden': 'true' }, mod === 'hub' ? '◉' : '☰'),
        h('span', { class: 'baro-link__body' },
          h('span', { class: 'baro-link__title' }, p.title),
          h('span', { class: 'baro-link__sub' }, label)));
    }

    const groups = CAT_ORDER.map((cat) => {
      const items = MODS.filter((m) => m.cat === cat);
      return h('div', { class: 'baro-list__cat-' + cat },
        h('div', { class: 'baro-list__group-label' }, CAT_LABELS[cat]),
        ...items.map(modLink));
    });

    const list = h('div', { class: 'baro-list', id: 'baro-list' },
      h('div', { class: 'baro-list__pinned' },
        pinned(HUB, 'Index of everything', 'hub'),
        pinned(PLAYBOOK, 'Campaign + crew-role playbook', 'playbook')),
      ...groups,
      h('div', { class: 'baro-list__empty', id: 'baro-list-empty', hidden: true }, 'No matches.'));

    const filter = h('div', { class: 'baro-filter' },
      h('input', {
        type: 'search',
        id: 'baro-filter-input',
        placeholder: 'Filter mods…  (press /)',
        autocomplete: 'off',
        'aria-label': 'Filter mods',
        oninput: onFilterInput,
      }));

    const head = h('div', { class: 'baro-drawer__head' },
      h('h2', null, 'Field Manual'),
      h('button', { class: 'baro-close', type: 'button', 'aria-label': 'Close menu', onclick: closeDrawer }, '×'));

    const foot = h('div', { class: 'baro-drawer__foot' },
      h('span', null, h('kbd', null, 'J'), ' next'),
      h('span', null, h('kbd', null, 'K'), ' prev'),
      h('span', null, h('kbd', null, '/'), ' filter'),
      h('span', null, h('kbd', null, 'Esc'), ' close'));

    const drawer = h('aside', {
      class: 'baro-drawer',
      id: 'baro-drawer',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Mod list',
      tabindex: '-1',
    }, head, filter, list, foot);

    const backdrop = h('div', { class: 'baro-backdrop', id: 'baro-backdrop', onclick: closeDrawer });

    return { drawer, backdrop };
  }

  // --- Filter ------------------------------------------------------------
  function onFilterInput(e) {
    const q = (e.target.value || '').trim().toLowerCase();
    let any = false;
    document.querySelectorAll('#baro-list .baro-link').forEach((el) => {
      const hay = el.getAttribute('data-search') || '';
      const match = !q || hay.indexOf(q) !== -1;
      el.style.display = match ? '' : 'none';
      if (match) any = true;
    });
    document.querySelectorAll('#baro-list .baro-list__group-label').forEach((label) => {
      // Hide the section header if every link below it (until next label) is hidden.
      let any2 = false;
      let n = label.nextElementSibling;
      while (n && !n.classList.contains('baro-list__group-label')) {
        if (n.classList.contains('baro-link') && n.style.display !== 'none') any2 = true;
        n = n.nextElementSibling;
      }
      label.style.display = any2 ? '' : 'none';
    });
    document.getElementById('baro-list-empty').hidden = any;
  }

  // --- Drawer open/close -------------------------------------------------
  let lastFocus = null;
  function openDrawer() {
    const drawer = document.getElementById('baro-drawer');
    const backdrop = document.getElementById('baro-backdrop');
    if (!drawer || !backdrop) return;
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('baro-locked');
    document.querySelector('.baro-menu-btn').setAttribute('aria-expanded', 'true');
    // Focus the filter so the user can type immediately
    setTimeout(() => {
      const f = document.getElementById('baro-filter-input');
      if (f) f.focus();
    }, 50);
  }
  function closeDrawer() {
    const drawer = document.getElementById('baro-drawer');
    const backdrop = document.getElementById('baro-backdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('baro-locked');
    document.querySelector('.baro-menu-btn').setAttribute('aria-expanded', 'false');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  // --- Keyboard ----------------------------------------------------------
  function onKey(e) {
    // Don't hijack keys while typing in a field.
    const target = e.target;
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (e.key === 'Escape') {
      if (document.getElementById('baro-drawer').classList.contains('open')) {
        e.preventDefault();
        closeDrawer();
      }
      return;
    }
    if (typing) return;
    if (e.key === '/') {
      e.preventDefault();
      openDrawer();
      return;
    }
    if (e.key === 'j' || e.key === 'J') {
      if (nextMod) { e.preventDefault(); window.location.href = nextMod.file; }
    } else if (e.key === 'k' || e.key === 'K') {
      if (prevMod) { e.preventDefault(); window.location.href = prevMod.file; }
    }
  }

  // --- Auto prev/next at the bottom of mod pages -------------------------
  function buildPrevNext() {
    if (!isModPage) return null;
    const prev = prevMod
      ? h('a', { class: 'pn-prev', href: prevMod.file },
          h('span', { class: 'pn-label' }, 'Previous'),
          h('span', { class: 'pn-title' }, prevMod.title))
      : h('span', { class: 'pn-prev pn-empty', 'aria-hidden': 'true' });
    const next = nextMod
      ? h('a', { class: 'pn-next', href: nextMod.file },
          h('span', { class: 'pn-label' }, 'Next'),
          h('span', { class: 'pn-title' }, nextMod.title))
      : h('span', { class: 'pn-next pn-empty', 'aria-hidden': 'true' });
    return h('nav', { class: 'baro-prev-next', 'aria-label': 'Mod pages' }, prev, next);
  }

  // --- Boot --------------------------------------------------------------
  function boot() {
    // 1. Inject styles
    const style = document.createElement('style');
    style.id = 'baro-nav-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    // 2. Skip link (accessibility)
    const skip = h('a', { class: 'baro-skip', href: '#baro-content' }, 'Skip to content');
    document.body.insertBefore(skip, document.body.firstChild);

    // 3. Sticky topbar at top of body
    const topbar = buildTopbar();
    document.body.insertBefore(topbar, skip.nextSibling);

    // 4. Add an anchor for the skip link on the main content
    const page = document.querySelector('.page') || document.body;
    if (page && !document.getElementById('baro-content')) {
      page.id = page.id || 'baro-content';
      if (page.id !== 'baro-content') {
        // .page already had an id; add ours as a child anchor
        const anchor = document.createElement('span');
        anchor.id = 'baro-content';
        page.insertBefore(anchor, page.firstChild);
      }
    }

    // 5. Hide the now-redundant per-page .backbar (keep external workshop link
    //    by relocating it into the topbar would be nice — for now, just hide).
    //    We keep it accessible to screen readers in case JS-disabled users land here.
    const oldBackbars = document.querySelectorAll('.backbar');
    oldBackbars.forEach((bb) => { bb.style.display = 'none'; });

    // 6. Replace existing .prev-next with our consistent one on mod pages.
    const pn = buildPrevNext();
    if (pn) {
      const existing = document.querySelector('.prev-next');
      if (existing && existing.parentNode) {
        existing.parentNode.replaceChild(pn, existing);
      } else {
        // Insert before the footer if present, else append to .page
        const container = document.querySelector('.page') || document.body;
        const footer = container.querySelector('.footer');
        if (footer) container.insertBefore(pn, footer);
        else container.appendChild(pn);
      }
    }

    // 7. Drawer + backdrop at the end of body
    const { drawer, backdrop } = buildDrawer();
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    // 8. Keyboard shortcuts
    document.addEventListener('keydown', onKey);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
