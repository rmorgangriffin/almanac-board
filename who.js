/* Whovian board extras: a fast time vortex (one pre-drawn spiral, spun and zoomed with CSS
   transforms only, so the Pi's GPU does the work) and something Who-ish every 15–20 minutes:
   Daleks (sometimes chasing the TARDIS), the TARDIS materializing, a Weeping Angel that's a little
   closer each time, K-9, a Cyberman, a sonic screwdriver glint.
   ?who=<name> plays one (dalek, chase, tardis, angel, k9, cyber, sonic); ?who=all plays them all. */
(function () {
  const st = document.createElement("style");
  st.textContent = `
#vortex { display: none !important; }
#vx { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #040817; pointer-events: none; }
#vx i { position: absolute; left: 50%; top: 42%; width: 160vmax; height: 160vmax; margin: -80vmax 0 0 -80vmax; background-size: 100% 100%; will-change: transform, opacity; }
#vx .base { animation: vx-spin 14s linear infinite; opacity: .75; }
#vx .zoom { animation: vx-zoom 4.5s linear infinite; opacity: 0; }
#vx .zoom.b { animation-delay: -2.25s; }
#vx .core { width: 40vmax; height: 40vmax; margin: -20vmax 0 0 -20vmax; border-radius: 50%; background: radial-gradient(circle, rgba(220,240,255,.55), rgba(127,214,255,.15) 40%, transparent 70%); animation: vx-pulse 3s ease-in-out infinite alternate; }
@keyframes vx-spin { to { transform: rotate(360deg); } }
@keyframes vx-zoom { 0% { transform: scale(.25) rotate(0deg); opacity: 0; } 25% { opacity: .8; } 80% { opacity: .5; } 100% { transform: scale(1.5) rotate(-140deg); opacity: 0; } }
@keyframes vx-pulse { from { transform: scale(.85); opacity: .7; } to { transform: scale(1.1); opacity: 1; } }
.panel { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: rgba(7, 18, 48, .9) !important; }
.wcast { position: fixed; z-index: 60; pointer-events: none; }
.wcast svg { display: block; height: 100%; width: auto; overflow: visible; filter: drop-shadow(0 0 .3rem rgba(127,214,255,.5)); }
.wcast .bubble { position: absolute; bottom: 100%; left: 40%; margin-bottom: .4rem; white-space: nowrap; background: #fff; color: #111; font-family: "Big Shoulders Display", Impact, sans-serif; font-weight: 900; font-size: 2.1rem; letter-spacing: .04em; padding: .2rem .8rem; border-radius: 1rem; animation: wk-bubble 1.4s steps(1) infinite; }
.wcast .bubble::after { content: ""; position: absolute; left: 1.2rem; top: 100%; border: .6rem solid transparent; border-top-color: #fff; }
@keyframes wk-bubble { 50% { transform: scale(1.06); } }
.wcast.mat { opacity: 0; }
.wcast.mat.in { animation: who-mat 5s linear forwards; }
.wcast.mat.out { animation: who-demat 5s linear forwards; }
@keyframes who-mat { 0% { opacity: 0; } 15% { opacity: .5; } 25% { opacity: .1; } 40% { opacity: .7; } 50% { opacity: .25; } 65% { opacity: .9; } 75% { opacity: .5; } 100% { opacity: 1; } }
@keyframes who-demat { 0% { opacity: 1; } 15% { opacity: .4; } 25% { opacity: .9; } 40% { opacity: .25; } 50% { opacity: .7; } 65% { opacity: .1; } 75% { opacity: .4; } 100% { opacity: 0; } }
.wcast.fade { opacity: 0; transition: opacity 1.5s ease; }
.wcast.fade.in { opacity: 1; }
.wcast .glint { transform-box: fill-box; transform-origin: 50% 50%; animation: who-glint .6s ease-in-out infinite alternate; }
@keyframes who-glint { from { opacity: .3; transform: scale(.7); } to { opacity: 1; transform: scale(1.3); } }
@media (prefers-reduced-motion: reduce) { #vx i { animation: none !important; } #vx .zoom { opacity: .4; } }
`;
  document.head.appendChild(st);

  // --- the vortex: draw one spiral once, then let CSS spin and zoom copies of it ---
  function spiral() {
    const S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
    const x = c.getContext("2d"), cx = S / 2;
    const COLS = ["127,214,255", "90,140,255", "170,120,255", "60,90,220", "255,179,71"];
    for (let arm = 0; arm < 7; arm++) {
      const off = arm / 7 * Math.PI * 2, col = COLS[arm === 3 ? 4 : arm % 4];
      for (let k = 0; k < 3; k++) {
        x.beginPath();
        for (let t = 0; t < 6.5; t += .02) {
          const r = 6 * Math.exp(t * .62) + k * 9, a = off + t + k * .05;
          const px = cx + Math.cos(a) * r, py = cx + Math.sin(a) * r;
          t ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.strokeStyle = `rgba(${col},${.5 - k * .14})`; x.lineWidth = 10 - k * 3; x.stroke();
      }
    }
    for (let i = 0; i < 260; i++) {   // streaks of light
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 470, l = .08 + Math.random() * .25;
      x.beginPath(); x.arc(cx, cx, r, a, a + l); x.strokeStyle = `rgba(${COLS[i % 4]},${.15 + Math.random() * .4})`; x.lineWidth = 1 + Math.random() * 3; x.stroke();
    }
    return c.toDataURL("image/png");
  }
  const vx = document.createElement("div"); vx.id = "vx";
  document.body.prepend(vx);
  const url = spiral();
  vx.innerHTML = `<i class="base"></i><i class="zoom"></i><i class="zoom b"></i><i class="core"></i>`;
  vx.querySelectorAll("i:not(.core)").forEach(i => i.style.backgroundImage = `url(${url})`);

  // --- the cast ---
  const legs = (xs, y, h, col, w = 4) => xs.map((x, i) => `<rect class="leg ${i % 2 ? "b" : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${col}"/>`).join("");
  const dalek = (body = "#c9a24a", dark = "#7a5c22") => `<svg viewBox="0 0 64 82">
    <path d="M10 80 L52 80 L46 42 L16 42 Z" fill="${body}"/>
    <g fill="${dark}">${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<circle cx="${19 + c * 7.5 + r * 0}" cy="${50 + r * 10}" r="2.6"/>`).join("")).join("")}</g>
    <rect x="14" y="33" width="34" height="9" fill="#3a3a3a"/>
    <path d="M46 36 H60" stroke="#444" stroke-width="2.2"/><circle cx="61" cy="36" r="3.2" fill="#222"/>
    <path d="M46 40 L58 42" stroke="#222" stroke-width="1.5"/>
    <rect x="18" y="22" width="26" height="11" fill="${dark}"/><path d="M18 26 H44 M18 29.5 H44" stroke="${body}" stroke-width="1"/>
    <path d="M18 22 Q31 2 44 22 Z" fill="${body}"/>
    <circle cx="24" cy="10" r="2" fill="#ffe680"/><circle cx="38" cy="10" r="2" fill="#ffe680"/>
    <path d="M40 15 L56 11" stroke="#444" stroke-width="2"/><circle cx="57" cy="10.6" r="3.2" fill="#5ad1ff"/>
  </svg>`;
  const tardis = `<svg viewBox="0 0 44 72">
    <rect x="20" y="0" width="4" height="5" fill="#fff8c4"/><rect x="5" y="5" width="34" height="5" fill="#1d3f86"/>
    <rect x="3" y="10" width="38" height="60" rx="1.5" fill="#2556b0"/>
    <rect x="6" y="12" width="32" height="5" fill="#122a5c"/>
    <g fill="#dfeaff"><rect x="8" y="21" width="5" height="5"/><rect x="14" y="21" width="5" height="5"/><rect x="25" y="21" width="5" height="5"/><rect x="31" y="21" width="5" height="5"/></g>
    <g fill="none" stroke="#1d3f86" stroke-width="1.2"><rect x="8" y="30" width="11" height="10"/><rect x="25" y="30" width="11" height="10"/><rect x="8" y="44" width="11" height="10"/><rect x="25" y="44" width="11" height="10"/><rect x="8" y="58" width="11" height="9"/><rect x="25" y="58" width="11" height="9"/></g>
    <path d="M22 18 V70" stroke="#1d3f86" stroke-width="1.5"/></svg>`;
  const k9 = `<svg viewBox="0 0 74 46">
    <path d="M8 18 L-2 8" stroke="#8a929c" stroke-width="2"/>
    <rect x="8" y="14" width="44" height="18" rx="2" fill="#a3abb5"/><rect x="12" y="18" width="14" height="6" fill="#5a636e"/><circle cx="34" cy="21" r="2" fill="#ff4d4d"/>
    <rect x="50" y="8" width="18" height="14" rx="2" fill="#a3abb5"/><rect x="60" y="12" width="7" height="3" fill="#ff4d4d"/>
    <path d="M54 8 L50 0 M58 8 L60 0" stroke="#8a929c" stroke-width="2"/>
    <path d="M66 19 L74 21" stroke="#5a636e" stroke-width="2"/>
    <rect x="10" y="32" width="40" height="6" fill="#6b737d"/><circle cx="16" cy="40" r="4" fill="#333"/><circle cx="44" cy="40" r="4" fill="#333"/></svg>`;
  const cyber = `<svg viewBox="0 0 44 90">
    ${legs([14, 25], 56, 30, "#aeb6bf", 6)}
    <rect x="10" y="26" width="24" height="32" rx="3" fill="#c3cad2"/><rect x="15" y="32" width="14" height="10" rx="1" fill="#6b737d"/>
    <rect class="leg" x="4" y="28" width="6" height="26" rx="3" fill="#aeb6bf"/><rect class="leg b" x="34" y="28" width="6" height="26" rx="3" fill="#aeb6bf"/>
    <rect x="11" y="4" width="22" height="22" rx="5" fill="#d3d9e0"/>
    <path d="M11 9 Q2 9 2 2 M33 9 Q42 9 42 2" stroke="#d3d9e0" stroke-width="3" fill="none"/>
    <path d="M14 12 h5 l-2.5 5 z M25 12 h5 l-2.5 5 z" fill="#222"/><rect x="17" y="20" width="10" height="2.5" fill="#222"/></svg>`;
  const angel = `<svg viewBox="0 0 70 110">
    <path d="M18 34 Q-6 20 2 70 Q10 50 20 50 Z M52 34 Q76 20 68 70 Q60 50 50 50 Z" fill="#9c9c93"/>
    <path d="M22 40 Q35 34 48 40 L56 108 L14 108 Z" fill="#b9b9b0"/>
    <path d="M24 60 L22 108 M35 58 V108 M46 60 L48 108" stroke="#9a9a91" stroke-width="1.5"/>
    <circle cx="35" cy="24" r="11" fill="#c4c4bb"/>
    <path d="M26 30 Q24 18 30 16 L34 28 Z M44 30 Q46 18 40 16 L36 28 Z" fill="#a9a9a0"/>
    <path d="M22 42 L28 30 M48 42 L42 30" stroke="#a9a9a0" stroke-width="5" stroke-linecap="round"/></svg>`;
  const sonic = `<svg viewBox="0 0 70 20"><rect x="2" y="7" width="30" height="7" rx="2" fill="#8a7a5a"/><rect x="32" y="6" width="16" height="9" rx="1" fill="#c0c6cc"/><rect x="48" y="7.5" width="8" height="6" fill="#4dff9a"/>
    <path class="glint" d="M62 10 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" fill="#d6ffe8"/></svg>`;

  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
  function el(svg, h, extra = "") { const d = document.createElement("div"); d.className = "wcast " + extra; d.style.height = h + "rem"; d.innerHTML = svg; document.body.appendChild(d); return d; }
  function cross(d, dur, bottom = .4) {
    d.style.bottom = bottom + "rem"; d.style.left = "0"; d.style.animation = `wk-cross ${dur}s linear forwards`;
    setTimeout(() => d.remove(), (dur + 1) * 1000);
  }
  function photoRect() { const p = document.getElementById("photo"); return p ? p.getBoundingClientRect() : { left: 20, top: innerHeight - 380, right: innerWidth / 2, bottom: innerHeight - 20, width: innerWidth / 2, height: 360 }; }
  function angelCount() { // how many times the Angel has already come today, so she's closer each time
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    return Math.max(0, Math.floor((+p.hour - 6) / 2));
  }

  const EVENTS = {
    dalek() { const d = el(dalek() + `<div class="bubble">EXTERMINATE!</div>`, 6.5); d.querySelector(".bubble").style.left = "10%"; cross(d, 16); },
    chase() {
      const t = el(`<div class="bob" style="height:100%">${tardis}</div>`, 6, "tumble"); t.style.animation = `wk-cross 13s linear forwards`; t.style.bottom = "1.5rem"; t.style.left = "0";
      t.querySelector("svg").style.animation = "wk-spin 3s linear infinite"; setTimeout(() => t.remove(), 14000);
      setTimeout(() => { const d = el(dalek("#8d96a6", "#4f5663") + `<div class="bubble">EXTERMINATE!</div>`, 6.5); cross(d, 13); }, 2200);
    },
    tardis() {
      const r = photoRect(), d = el(tardis, 7.5, "mat");
      d.style.left = (r.left + 18) + "px"; d.style.top = (r.top + 16) + "px";
      d.classList.add("in");
      setTimeout(() => { d.classList.remove("in"); d.classList.add("out"); }, 20000);
      setTimeout(() => d.remove(), 26000);
    },
    angel() {
      const n = angelCount(), h = Math.min(18, 5 + n * 2.2), r = photoRect(), d = el(angel, h, "fade");
      d.style.left = (r.right - h * rem() * .7 - 14) + "px"; d.style.top = (r.bottom - h * rem() - 6) + "px";
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
      setTimeout(() => d.classList.remove("in"), 25000); setTimeout(() => d.remove(), 27000);
    },
    k9() { const d = el(`<div class="bob" style="height:100%">${k9}</div>`, 4, "walker glide"); cross(d, 14); },
    cyber() { const d = el(`<div class="bob" style="height:100%">${cyber}</div>`, 7, "walker walk"); cross(d, 17); },
    sonic() {
      const t = document.getElementById("time"), r = t ? t.getBoundingClientRect() : { left: innerWidth - 300, bottom: 140 };
      const d = el(sonic, 2, "fade"); d.style.left = (r.left - 9 * rem()) + "px"; d.style.top = (r.bottom - 1.6 * rem()) + "px";
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in")));
      setTimeout(() => d.classList.remove("in"), 7000); setTimeout(() => d.remove(), 9000);
    },
  };
  const ORDER = ["dalek", "tardis", "k9", "angel", "chase", "sonic", "cyber", "tardis", "dalek", "angel", "sonic", "k9", "cyber", "chase"];
  // One every 17 minutes from 6am to midnight, worked out from the clock so a reload doesn't double up.
  let lastSlot = -1;
  function check() {
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    const m = +p.hour * 60 + +p.minute;
    if (m < 360 || m % 17 !== 0) return;
    const slot = m / 17; if (slot === lastSlot) return; lastSlot = slot;
    if (document.querySelector(".wcast, .walker")) return;
    EVENTS[ORDER[slot % ORDER.length]]();
  }
  setInterval(check, 20000);
  const want = new URLSearchParams(location.search).get("who");
  if (want) setTimeout(() => {
    if (want === "all") Object.keys(EVENTS).forEach((n, i) => setTimeout(EVENTS[n], i * 4000));
    else if (EVENTS[want]) EVENTS[want]();
  }, 2500);
})();
