/* Walk-ons: once a day, at a random time between 7am and 9pm, a small character crosses the
   screen once and leaves (or, for the cats, naps on a panel for a bit). The day's times are
   worked out from the date, so a reload doesn't bring on an extra one.
   ?walk=now plays a random one a few seconds after the page loads; ?walk=<name> plays that one.
   Boards can set window.WALK_SEASON ("christmas", "halloween", ...) to add seasonal cast. */
(function () {
  const TZ = "America/New_York";
  const style = document.createElement("style");
  style.textContent = `
.walker { position: fixed; left: 0; z-index: 60; pointer-events: none; will-change: transform; }
.walker svg { display: block; height: 100%; width: auto; overflow: visible; filter: drop-shadow(0 0 .12rem rgba(255,255,255,.6)); }
.walker.walk, .walker.glide { bottom: .2rem; }
.walker .bob { height: 100%; animation: wk-bob .36s ease-in-out infinite alternate; }
.walker.waddle .bob { animation: wk-waddle .5s ease-in-out infinite alternate; transform-origin: 50% 100%; }
.walker.glide .bob { animation: none; }
.walker.float .bob { animation: wk-float 3.2s ease-in-out infinite alternate; }
.walker.tumble .bob { animation: wk-float 3.2s ease-in-out infinite alternate; }
.walker.tumble svg { animation: wk-spin 4.5s linear infinite; transform-origin: 50% 50%; }
.walker.nap { transition: opacity 2s ease; opacity: 0; }
.walker.nap.on { opacity: 1; }
.walker .tail { transform-box: fill-box; transform-origin: 50% 0; animation: wk-tail 2.4s ease-in-out infinite alternate; }
.walker .tail.b { animation-delay: -1.2s; }
@keyframes wk-tail { from { transform: rotate(-12deg); } to { transform: rotate(12deg); } }
.walker .leg { transform-box: fill-box; transform-origin: 50% 0; animation: wk-step .32s ease-in-out infinite alternate; }
.walker .leg.b { animation-delay: -.32s; }
.walker .flap { transform-box: fill-box; transform-origin: 0 50%; animation: wk-flap 1.2s ease-in-out infinite alternate; }
@keyframes wk-cross { from { transform: translateX(-14rem); } to { transform: translateX(calc(100vw + 2rem)); } }
@keyframes wk-bob { from { transform: translateY(0); } to { transform: translateY(-.25rem); } }
@keyframes wk-waddle { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes wk-float { from { transform: translateY(-1.5rem); } to { transform: translateY(1.5rem); } }
@keyframes wk-spin { to { transform: rotate(360deg); } }
@keyframes wk-step { from { transform: rotate(-22deg); } to { transform: rotate(22deg); } }
@keyframes wk-flap { from { transform: skewY(-8deg); } to { transform: skewY(8deg); } }
`;
  document.head.appendChild(style);

  const legs = (xs, y, h, col, w = 4) => xs.map((x, i) => `<rect class="leg ${i % 2 ? "b" : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${col}"/>`).join("");
  const eye = (x, y, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a1a1a"/><circle cx="${x + .6}" cy="${y - .6}" r=".6" fill="#fff"/>`;

  function chihuahua(sweater, letter) {
    return `<svg viewBox="0 0 100 66">
      <path d="M22 36 Q8 30 12 18" stroke="#d9a46b" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${legs([28, 36, 58, 66], 46, 16, "#c8915a")}
      <ellipse cx="46" cy="40" rx="26" ry="12" fill="#d9a46b"/>
      <path d="M30 29 Q46 24 64 29 L64 51 Q46 55 30 51 Z" fill="${sweater}"/>
      <path d="M30 34 H64 M30 46 H64" stroke="#fff" stroke-width="2" opacity=".7"/>
      <text x="47" y="44" text-anchor="middle" font-family="Graduate, Georgia, serif" font-size="9" fill="#fff">${letter}</text>
      <path d="M68 20 L63 1 L77 15 Z M81 16 L90 0 L89 20 Z" fill="#d9a46b"/>
      <path d="M68 17 L65 6 L74 15 Z M83 15 L88 5 L87 18 Z" fill="#f2c9a0"/>
      <circle cx="77" cy="27" r="12" fill="#d9a46b"/>
      <ellipse cx="88" cy="31" rx="6.5" ry="4.5" fill="#e8bb8a"/>
      <circle cx="93.5" cy="30" r="1.8" fill="#1a1a1a"/>
      ${eye(79, 24, 2.3)}
    </svg>`;
  }
  function cat(fur, stripes, eyes, tag) {
    return `<g>
      <path d="M16 30 Q2 22 8 6" stroke="${fur}" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${legs([22, 30, 50, 58], 38, 14, fur)}
      <ellipse cx="40" cy="33" rx="25" ry="10" fill="${fur}"/>
      ${stripes ? `<path d="M30 24 l3 8 M38 23 l2 9 M46 23 l1 9 M54 25 l-1 8" stroke="${stripes}" stroke-width="2.4" stroke-linecap="round"/>` : ""}
      <path d="M60 18 L62 5 L69 15 Z M71 15 L78 4 L78 18 Z" fill="${fur}"/>
      <circle cx="70" cy="23" r="10" fill="${fur}"/>
      <ellipse cx="67" cy="22" rx="1.8" ry="2.4" fill="${eyes}"/><ellipse cx="74" cy="22" rx="1.8" ry="2.4" fill="${eyes}"/>
      <path d="M79 25 l6 -1 M79 27 l6 1" stroke="#ddd" stroke-width=".8"/>
      <text x="40" y="58" text-anchor="middle" font-family="Figtree, sans-serif" font-size="7" fill="#fff" opacity=".8">${tag}</text>
    </g>`;
  }

  const CAST = {
    hercules: { motion: "walk", h: 5, dur: 15, svg: () => chihuahua("var(--rose, #ef8a8a)", "H") },
    nimona: { motion: "walk", h: 5, dur: 15, svg: () => chihuahua("var(--sage, #7fc8a9)", "N") },
    cats: { motion: "walk", h: 4.4, dur: 11, svg: () => `<svg viewBox="0 0 210 60">
      <g>${cat("#d98e3f", "#8a4f1c", "#7ad36b", "Lucille")}</g>
      <g transform="translate(115 0)">${cat("#1b1b1f", "", "#ffd84a", "Buster")}</g></svg>` },
    catnap: { motion: "nap", h: 4.4, dur: 22, svg: () => `<svg viewBox="0 0 150 60">
      <g transform="translate(0 6)">
        <ellipse cx="38" cy="32" rx="30" ry="12" fill="#1b1b1f"/>
        <path d="M14 22 L16 12 L23 20 Z M24 19 L30 10 L32 20 Z" fill="#1b1b1f"/>
        <circle cx="22" cy="26" r="10" fill="#1b1b1f"/>
        <path d="M16 26 q3 2 6 0 M23 26 q3 2 6 0" stroke="#ffd84a" stroke-width="1.2" fill="none"/>
        <path class="tail" d="M66 36 Q74 44 70 58" stroke="#1b1b1f" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g transform="translate(70 4)">
        <ellipse cx="40" cy="34" rx="30" ry="12" fill="#d98e3f"/>
        <path d="M30 24 l2 8 M40 23 l1 9 M50 24 l-1 8" stroke="#8a4f1c" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M60 24 L64 13 L68 22 Z M70 22 L76 13 L76 24 Z" fill="#d98e3f"/>
        <circle cx="68" cy="28" r="10" fill="#d98e3f"/>
        <path d="M62 28 q3 2 6 0 M69 28 q3 2 6 0" stroke="#3a2a10" stroke-width="1.2" fill="none"/>
        <path class="tail b" d="M12 38 Q4 46 8 60" stroke="#d98e3f" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <text x="80" y="8" font-family="Figtree, sans-serif" font-size="8" fill="#fff" opacity=".8">z z z</text></svg>` },
    duck: { motion: "waddle", h: 5, dur: 18, svg: () => `<svg viewBox="0 0 125 70">
      <rect x="6" y="22" width="34" height="30" rx="5" fill="var(--sage, #7fc8a9)"/>
      <rect x="6" y="33" width="34" height="5" fill="#fff" opacity=".6"/>
      <circle cx="31" cy="27" r="4" fill="var(--amber, #f2a93b)"/>
      <circle cx="13" cy="56" r="4" fill="#333"/><circle cx="33" cy="56" r="4" fill="#333"/>
      <path d="M40 24 L82 40" stroke="#666" stroke-width="2.2"/>
      ${legs([82, 92], 52, 12, "#f08a24", 3)}
      <path d="M78 64 h8 M88 64 h8" stroke="#f08a24" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="88" cy="44" rx="20" ry="13" fill="#fafafa"/>
      <path class="flap" d="M78 42 Q88 34 98 44 Q88 50 78 42 Z" fill="#e3e3e3"/>
      <circle cx="104" cy="25" r="10" fill="#fafafa"/>
      <path d="M112 24 L124 27 L112 30 Z" fill="#f08a24"/>
      ${eye(106, 22, 1.9)}
    </svg>` },
    snail: { motion: "glide", h: 5.4, dur: 22, svg: () => `<svg viewBox="0 0 110 75">
      <path d="M8 66 Q8 56 22 56 L88 56 Q100 56 102 44 L106 44 Q108 66 92 66 Z" fill="#c9cf8a"/>
      <path d="M98 46 L94 30 M104 46 L106 30" stroke="#c9cf8a" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="94" cy="29" r="2.4" fill="#1a1a1a"/><circle cx="106" cy="29" r="2.4" fill="#1a1a1a"/>
      <path d="M50 38 L50 2" stroke="#6b4a2a" stroke-width="2"/>
      <path class="flap" d="M50 3 L82 10 L50 17 Z" fill="#6e1a1a"/>
      <text x="61" y="12.5" font-family="Graduate, Georgia, serif" font-size="5.5" fill="#f3e6c4">ELMS</text>
      <circle cx="50" cy="40" r="19" fill="#c48a4a"/>
      <path d="M50 40 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 1 1 7 7 a11 11 0 1 1 -11 -11 a15 15 0 1 1 15 15" stroke="#8a5a2b" stroke-width="2.2" fill="none"/>
    </svg>` },
    tardis: { motion: "tumble", h: 6, dur: 17, svg: () => `<svg viewBox="0 0 44 72">
      <rect x="20" y="0" width="4" height="5" fill="#fff8c4"/><rect x="5" y="5" width="34" height="5" fill="#1d3f86"/>
      <rect x="3" y="10" width="38" height="60" rx="1.5" fill="#2556b0"/>
      <rect x="6" y="12" width="32" height="5" fill="#122a5c"/>
      <g fill="#dfeaff"><rect x="8" y="21" width="5" height="5"/><rect x="14" y="21" width="5" height="5"/><rect x="25" y="21" width="5" height="5"/><rect x="31" y="21" width="5" height="5"/></g>
      <g fill="none" stroke="#1d3f86" stroke-width="1.2"><rect x="8" y="30" width="11" height="10"/><rect x="25" y="30" width="11" height="10"/><rect x="8" y="44" width="11" height="10"/><rect x="25" y="44" width="11" height="10"/><rect x="8" y="58" width="11" height="9"/><rect x="25" y="58" width="11" height="9"/></g>
      <path d="M22 18 V70" stroke="#1d3f86" stroke-width="1.5"/>
    </svg>` },
    ants: { motion: "walk", h: 4.6, dur: 19, svg: () => {
      const ant = (x, gear) => `<g transform="translate(${x} 0)">
        ${legs([10, 16, 22], 40, 12, "#3a2414", 2.4)}
        <circle cx="8" cy="38" r="7" fill="#4a2c18"/><circle cx="19" cy="36" r="5" fill="#4a2c18"/><circle cx="29" cy="30" r="6" fill="#4a2c18"/>
        <path d="M31 25 Q34 14 39 12 M28 25 Q28 14 32 10" stroke="#4a2c18" stroke-width="1.4" fill="none"/>
        ${eye(32, 29, 1.4)}${gear}</g>`;
      return `<svg viewBox="0 0 170 60">
        ${ant(0, `<rect x="21" y="38" width="12" height="9" rx="2" fill="var(--rose, #ef8a8a)"/><path d="M22 38 h10 M22 47 h10" stroke="#fff" stroke-width="1.2"/><path d="M33 34 l6 -6" stroke="#ddd" stroke-width="1.2"/>`)}
        ${ant(55, `<circle cx="38" cy="38" r="6" fill="none" stroke="var(--amber, #f2a93b)" stroke-width="3"/><path d="M34 34 l-6 -2" stroke="var(--amber, #f2a93b)" stroke-width="2.5"/>`)}
        ${ant(110, `<path d="M34 34 L36 2" stroke="#8a6a44" stroke-width="1.6"/><path class="flap" d="M36 2 L56 7 L35 12 Z" fill="var(--lilac, #b9a3ff)"/>`)}
      </svg>`; } },
    sheep: { motion: "walk", h: 5.2, dur: 17, svg: () => `<svg viewBox="0 0 100 70">
      ${legs([28, 36, 56, 64], 46, 16, "#2b2b2b")}
      <g fill="#f4f1ea"><circle cx="30" cy="38" r="12"/><circle cx="44" cy="32" r="13"/><circle cx="58" cy="36" r="12"/><circle cx="40" cy="46" r="11"/><circle cx="56" cy="46" r="10"/><circle cx="22" cy="44" r="8"/></g>
      <ellipse cx="78" cy="34" rx="10" ry="12" fill="#2b2b2b"/>
      <path d="M70 26 L60 22 L68 30 Z" fill="#2b2b2b"/>
      <path d="M66 40 Q74 46 84 42 L84 48 Q74 52 66 46 Z" fill="var(--rose, #ef8a8a)"/>
      <path class="flap" d="M68 44 L58 58 L64 58 L72 46 Z" fill="var(--rose, #ef8a8a)"/>
      <circle cx="81" cy="30" r="2" fill="#fff"/><circle cx="81.5" cy="30" r="1" fill="#111"/>
      <circle cx="77" cy="18" r="5" fill="#f4f1ea"/>
    </svg>` },
    ghost: { motion: "float", h: 6, dur: 18, months: [10], seasons: ["halloween"], svg: () => `<svg viewBox="0 0 60 72">
      <path d="M6 32 Q6 4 30 4 Q54 4 54 32 L54 66 Q49 60 44 66 Q39 72 34 66 Q30 60 26 66 Q21 72 16 66 Q11 60 6 66 Z" fill="#f7f7ff" opacity=".93"/>
      <ellipse cx="22" cy="30" rx="3.4" ry="4.4" fill="#222"/><ellipse cx="38" cy="30" rx="3.4" ry="4.4" fill="#222"/>
      <ellipse cx="30" cy="42" rx="4" ry="5" fill="#222"/>
      <circle cx="15" cy="38" r="3" fill="#ffb0c8" opacity=".6"/><circle cx="45" cy="38" r="3" fill="#ffb0c8" opacity=".6"/>
    </svg>` },
    reindeer: { motion: "walk", h: 6, dur: 15, months: [12], seasons: ["christmas"], svg: () => `<svg viewBox="0 0 100 80">
      <path d="M22 44 l-6 -4" stroke="#8a5a34" stroke-width="5" stroke-linecap="round"/>
      ${legs([28, 36, 58, 66], 52, 22, "#7a4c2a")}
      <ellipse cx="46" cy="47" rx="26" ry="12" fill="#9a6640"/>
      <path d="M62 44 Q66 30 72 26" stroke="#9a6640" stroke-width="10" stroke-linecap="round"/>
      <path d="M58 40 Q66 48 76 38 L78 44 Q66 54 58 46 Z" fill="var(--rose, #e05050)"/>
      <path d="M72 18 L68 2 M70 10 L62 6 M80 16 L86 2 M83 9 L92 6" stroke="#d8c19a" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="78" cy="25" rx="10" ry="8" fill="#9a6640"/>
      <circle cx="88" cy="28" r="3.6" fill="#ff3b3b"/><circle cx="88" cy="28" r="6" fill="#ff3b3b" opacity=".25"/>
      ${eye(79, 22, 1.8)}
    </svg>` },
  };

  function run(name) {
    const c = CAST[name]; if (!c || window.WALK_LITE) return;
    const el = document.createElement("div");
    el.className = "walker " + c.motion;
    el.style.height = c.h + "rem";
    if (c.motion === "float" || c.motion === "tumble") el.style.top = (18 + Math.random() * 50) + "vh";
    el.innerHTML = `<div class="bob">${c.svg()}</div>`;
    if (c.motion === "nap") {   // settle on top of a panel, tails hanging over the edge, then leave
      const panel = document.querySelector("#grid, .grid, .panel");
      const r = panel ? panel.getBoundingClientRect() : { top: innerHeight / 2, right: innerWidth - 40 };
      const hpx = c.h * parseFloat(getComputedStyle(document.documentElement).fontSize);
      el.style.top = (r.top - hpx * .62) + "px"; el.style.left = Math.max(0, r.right - hpx * 2.8 - 30) + "px";
      document.body.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
      setTimeout(() => el.classList.remove("on"), c.dur * 1000);
      setTimeout(() => el.remove(), (c.dur + 3) * 1000);
      return;
    }
    el.style.animation = `wk-cross ${c.dur}s linear forwards`;
    el.addEventListener("animationend", e => { if (e.target === el) el.remove(); });
    setTimeout(() => el.remove(), (c.dur + 2) * 1000);
    document.body.appendChild(el);
  }
  window.walkOn = run;

  // --- the day's schedule, worked out from the date ---
  function nowNY() {
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    return { date: `${p.year}-${p.month}-${p.day}`, month: +p.month, min: +p.hour * 60 + +p.minute };
  }
  function rng(seed) { let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function slots(date) {
    const r = rng("walk-" + date), START = 7 * 60, END = 21 * 60;
    const a = START + Math.floor(r() * (END - START - 20));
    return [a];
  }
  function castFor(month) {
    const season = window.WALK_SEASON;
    const names = Object.keys(CAST).filter(n => { const c = CAST[n]; return !(c.months || c.seasons) || (c.months || []).includes(month) || (c.seasons || []).includes(season); });
    const r = rng("cast-order"); return names.map(n => [r(), n]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  }
  const done = new Set();
  function check() {
    const { date, month, min } = nowNY();
    slots(date).forEach((s, i) => {
      const id = date + "#" + i;
      if (min === s && !done.has(id)) {
        done.add(id);
        const cast = castFor(month), day = Math.floor(Date.parse(date) / 86400000);
        let pick = cast[day % cast.length];
        const seasonal = cast.filter(n => (CAST[n].seasons || []).includes(window.WALK_SEASON));
        if (seasonal.length && day % 2 === 0) pick = seasonal[0];   // seasonal guest every other day
        run(pick);
      }
    });
  }
  setInterval(check, 20000);

  const want = new URLSearchParams(location.search).get("walk");
  if (want) setTimeout(() => {
    if (want === "now") { const c = castFor(nowNY().month); run(c[Math.floor(Math.random() * c.length)]); }
    else if (want === "all") Object.keys(CAST).forEach((n, i) => setTimeout(() => run(n), i * 2500));
    else run(want);
  }, 3000);
})();
