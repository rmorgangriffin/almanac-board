/* Whovian board extras: a fast time vortex (one pre-drawn spiral, spun and zoomed with CSS
   transforms only, so the Pi's GPU does the work) and something time-travelly every 17 minutes,
   all original characters: a tin robot invader that shouts "OBLITERATE?" and trips, a traveller in a
   very long striped scarf (seen from behind), a clockwork dog, a brass hourglass that appears and
   flips, a stone garden gnome that's a little closer each time, a glinting gizmo by the clock.
   Every 50 minutes (7am–9pm) the robot fills the screen for 5 seconds: "DOOM!"
   ?who=<name> plays one (robot, chase, traveller, dog, hourglass, gnome, gizmo, doom); ?who=all plays them all. */
(function () {
  const st = document.createElement("style");
  st.textContent = `
#vortex { display: none !important; }
#vx { position: fixed; inset: 0; z-index: 0; overflow: hidden; background: #040817; pointer-events: none; }
#vx i { position: absolute; left: 50%; top: 42%; width: 116vmax; height: 116vmax; margin: -58vmax 0 0 -58vmax; background-size: 100% 100%; will-change: transform, opacity; }
#vx .base { animation: vx-spin 12s linear infinite; opacity: .8; }
#vx .zoom { animation: vx-zoom 3.5s linear infinite; opacity: 0; }
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
  vx.innerHTML = `<i class="base"></i><i class="zoom"></i><i class="core"></i>`;
  vx.querySelectorAll("i:not(.core)").forEach(i => i.style.backgroundImage = `url(${url})`);


  const st2 = document.createElement("style");
  st2.textContent = `
.wcast .tip { height: 100%; transform-origin: 85% 100%; transition: transform .45s cubic-bezier(.5,0,.9,.6); }
.wcast.tripped .tip { transform: rotate(84deg) translateY(-8%); }
.wcast.tripped .leg, .wcast.tripped .bob { animation: none !important; }
.wcast.gone { opacity: 0; transition: opacity 1.2s ease; }
.wcast .key { transform-box: fill-box; transform-origin: 50% 50%; animation: wc-key .8s ease-in-out infinite alternate; }
@keyframes wc-key { from { transform: scaleX(1); } to { transform: scaleX(-1); } }
.wcast .flip { height: 100%; transition: transform 1.6s ease-in-out; }
.wcast .flip.over { transform: rotate(180deg); }
@keyframes wc-walkin { from { transform: translateX(-14rem); } to { transform: translateX(48vw); } }
#doom { position: fixed; inset: 0; z-index: 90; pointer-events: none; opacity: 0; transform: scale(1.12); transition: opacity .35s ease, transform .5s ease-out;
  background: radial-gradient(circle at 50% 58%, #3a0d0d, #0a0204 70%); display: grid; grid-template-rows: auto 1fr; justify-items: center; }
#doom.on { opacity: 1; transform: none; }
#doom b { font-family: "Big Shoulders Display", Impact, sans-serif; font-weight: 900; font-size: 26vw; line-height: .9; margin-top: 4vh; color: #ffd23f; letter-spacing: .02em; text-shadow: 0 .6vw 0 #7a1010, 0 0 4vw rgba(255,60,40,.6); }
#doom svg { width: 82vw; height: auto; align-self: end; margin-bottom: 3vh; }
`;
  document.head.appendChild(st2);

  // --- the cast (all original drawings) ---
  const legs = (xs, y, h, col, w = 4) => xs.map((x, i) => `<rect class="leg ${i % 2 ? "b" : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${col}"/>`).join("");
  // A wind-up tin robot with a sink plunger for an arm.
  const robot = (tin = "#d0583c") => `<svg viewBox="0 0 70 92">
    ${legs([19, 35], 66, 18, "#8f99a3", 6)}<rect x="15" y="83" width="13" height="5" rx="2" fill="#6b737d"/><rect x="33" y="83" width="13" height="5" rx="2" fill="#6b737d"/>
    <path d="M12 44 L4 58" stroke="#9aa3ad" stroke-width="3.5" stroke-linecap="round"/><circle cx="4" cy="59" r="3" fill="#6b737d"/>
    <path d="M48 45 L62 36" stroke="#c8a46a" stroke-width="3" stroke-linecap="round"/><path d="M58 30 Q68 26 70 35 L63 39 Z" fill="#c0392b"/>
    <rect x="10" y="37" width="40" height="30" rx="3" fill="${tin}"/>
    <circle cx="21" cy="49" r="5" fill="#ffd75a"/><path d="M21 49 L24 46" stroke="#333" stroke-width="1.4"/>
    <rect x="31" y="44" width="4" height="4" fill="#7fffb0"/><rect x="37" y="44" width="4" height="4" fill="#ff7f7f"/><rect x="31" y="54" width="11" height="2" fill="#7a2a1a"/><rect x="31" y="58" width="11" height="2" fill="#7a2a1a"/>
    <g fill="#f3c9b8"><circle cx="13" cy="40" r="1"/><circle cx="47" cy="40" r="1"/><circle cx="13" cy="64" r="1"/><circle cx="47" cy="64" r="1"/></g>
    <rect x="26" y="33" width="8" height="5" fill="#8f99a3"/>
    <rect x="14" y="12" width="32" height="22" rx="5" fill="#b8c0c8"/>
    <circle cx="23" cy="22" r="5.5" fill="#fff"/><circle cx="37" cy="22" r="5.5" fill="#fff"/><circle cx="24.5" cy="22" r="2.6" fill="#222"/><circle cx="38.5" cy="22" r="2.6" fill="#222"/>
    <rect x="22" y="29" width="16" height="3" rx="1" fill="#555"/>
    <path d="M30 12 V4" stroke="#8f99a3" stroke-width="2"/><circle cx="30" cy="3.5" r="3" fill="#ff5a4a"/></svg>`;
  // A traveller in a very, very long striped scarf, seen from behind.
  const traveller = `<svg viewBox="-70 0 120 100">
    ${legs([17, 27], 74, 22, "#3b2f2a", 6)}
    <path d="M12 30 Q25 24 38 30 L42 78 L8 78 Z" fill="#2f5d6b"/><path d="M25 32 V78" stroke="#1f3f4a" stroke-width="1.2"/>
    <path d="M10 34 L4 60 M40 34 L46 60" stroke="#2f5d6b" stroke-width="6" stroke-linecap="round"/>
    <circle cx="25" cy="16" r="9.5" fill="#c9c2b4"/><path d="M15 15 Q25 3 35 15 Q25 10 15 15 Z" fill="#7a2f3c"/>
    <g fill="none" stroke-linecap="round">
      <path d="M14 28 Q25 33 36 28 M16 29 Q4 50 -8 90 L-66 95" stroke="#e8e4da" stroke-width="5.5"/>
      <path d="M14 28 Q25 33 36 28 M16 29 Q4 50 -8 90 L-66 95" stroke="#d6336c" stroke-width="5.5" stroke-dasharray="5 10" stroke-linecap="butt"/>
      <path d="M14 28 Q25 33 36 28 M16 29 Q4 50 -8 90 L-66 95" stroke="#3a7bd5" stroke-width="5.5" stroke-dasharray="3 12" stroke-dashoffset="-7" stroke-linecap="butt"/>
    </g></svg>`;
  // A clockwork dog with a turning wind-up key.
  const dog = `<svg viewBox="0 0 84 58">
    ${legs([22, 30, 44, 52], 34, 16, "#9c7a45", 5)}
    <path d="M17 27 l-4 -3 l4 -3 l-4 -3 l4 -3" stroke="#8a8f96" stroke-width="2" fill="none"/>
    <ellipse cx="38" cy="30" rx="22" ry="11" fill="#c9a46a"/><path d="M20 30 H56" stroke="#a5824c" stroke-width="1.2"/>
    <g fill="#f1dcae"><circle cx="24" cy="25" r="1"/><circle cx="34" cy="23" r="1"/><circle cx="44" cy="23" r="1"/><circle cx="54" cy="25" r="1"/></g>
    <rect x="36" y="13" width="3" height="7" fill="#8a8f96"/><g class="key" fill="none" stroke="#b9bec5" stroke-width="2.4"><circle cx="32.5" cy="9" r="4"/><circle cx="42.5" cy="9" r="4"/></g>
    <circle cx="62" cy="20" r="10" fill="#c9a46a"/><path d="M57 12 L54 2 L63 10 Z" fill="#a5824c"/>
    <ellipse cx="72" cy="23" rx="6" ry="4.5" fill="#d8b97e"/><circle cx="77" cy="22" r="1.8" fill="#222"/><circle cx="64" cy="17" r="1.8" fill="#222"/></svg>`;
  // A stone garden gnome. Don't look away.
  const gnome = `<svg viewBox="0 0 50 84">
    <ellipse cx="25" cy="81" rx="20" ry="3" fill="#7d7d76"/>
    <path d="M10 80 Q8 52 25 50 Q42 52 40 80 Z" fill="#9b9b93"/><path d="M12 62 H38" stroke="#86867f" stroke-width="2"/>
    <path d="M10 40 Q25 2 22 0 Q34 12 40 40 Z" fill="#8f8f88"/>
    <circle cx="25" cy="42" r="10" fill="#b3b3ab"/>
    <path d="M14 44 Q25 74 36 44 Q25 52 14 44 Z" fill="#a4a49c"/>
    <circle cx="25" cy="45" r="3" fill="#a9a9a1"/><circle cx="21" cy="39" r="1.3" fill="#555"/><circle cx="29" cy="39" r="1.3" fill="#555"/></svg>`;
  // A brass hourglass that turns up out of nowhere.
  const hourglass = `<svg viewBox="0 0 40 64"><g class="flip">
    <rect x="2" y="1" width="36" height="5" rx="1.5" fill="#b8862f"/><rect x="2" y="58" width="36" height="5" rx="1.5" fill="#b8862f"/>
    <rect x="4" y="6" width="3" height="52" fill="#8a6220"/><rect x="33" y="6" width="3" height="52" fill="#8a6220"/>
    <path d="M9 7 H31 Q31 24 20 32 Q31 40 31 57 H9 Q9 40 20 32 Q9 24 9 7 Z" fill="rgba(200,230,255,.35)" stroke="#dfeaff" stroke-width="1"/>
    <path d="M13 13 H27 Q26 22 20 27 Q14 22 13 13 Z" fill="#f0c060"/><path d="M11 57 Q20 44 29 57 Z" fill="#f0c060"/><path d="M20 30 V50" stroke="#f0c060" stroke-width="1"/></g></svg>`;
  // A gadget that glints.
  const gizmo = `<svg viewBox="0 0 70 20"><rect x="2" y="7" width="30" height="7" rx="3.5" fill="#6a4b8a"/><rect x="32" y="6" width="14" height="9" rx="2" fill="#b8862f"/><rect x="46" y="7.5" width="8" height="6" rx="3" fill="#ffb347"/>
    <path class="glint" d="M62 10 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" fill="#fff1d6"/></svg>`;
  // Head-on robot for the full-screen moment.
  const bigbot = `<svg viewBox="0 0 200 150">
    <path d="M100 30 V8" stroke="#8f99a3" stroke-width="5"/><circle cx="100" cy="8" r="8" fill="#ff5a4a"/>
    <rect x="18" y="104" width="164" height="60" rx="10" fill="#d0583c"/>
    <rect x="30" y="30" width="140" height="84" rx="16" fill="#b8c0c8"/><rect x="30" y="30" width="140" height="10" rx="5" fill="#cfd5db"/>
    <circle cx="68" cy="68" r="24" fill="#fff"/><circle cx="132" cy="68" r="24" fill="#fff"/>
    <circle cx="68" cy="70" r="12" fill="#e01b1b"/><circle cx="132" cy="70" r="12" fill="#e01b1b"/><circle cx="68" cy="70" r="5" fill="#200"/><circle cx="132" cy="70" r="5" fill="#200"/>
    <path d="M44 42 L88 52 M156 42 L112 52" stroke="#555" stroke-width="6" stroke-linecap="round"/>
    <rect x="66" y="96" width="68" height="12" rx="3" fill="#444"/><path d="M78 96 V108 M90 96 V108 M102 96 V108 M114 96 V108 M126 96 V108" stroke="#999" stroke-width="2"/>
    <g fill="#e6ebef"><circle cx="38" cy="38" r="2.5"/><circle cx="162" cy="38" r="2.5"/><circle cx="38" cy="106" r="2.5"/><circle cx="162" cy="106" r="2.5"/></g></svg>`;

  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
  function el(svg, h, extra = "") { const d = document.createElement("div"); d.className = "wcast " + extra; d.style.height = h + "rem"; d.innerHTML = svg; document.body.appendChild(d); return d; }
  function cross(d, dur, bottom = .4) {
    d.style.bottom = bottom + "rem"; d.style.left = "0"; d.style.animation = `wk-cross ${dur}s linear forwards`;
    setTimeout(() => d.remove(), (dur + 1) * 1000);
  }
  function photoRect() { const p = document.getElementById("photo"); return p ? p.getBoundingClientRect() : { left: 20, top: innerHeight - 380, right: innerWidth / 2, bottom: innerHeight - 20, width: innerWidth / 2, height: 360 }; }
  function gnomeCount() { // how many times the gnome has already come today, so it's closer each time
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    return Math.max(0, Math.floor((+p.hour - 6) / 2));
  }
  function fadeIn(d) { requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in"))); }
  // The robot marches in, announces itself, and falls flat on its face.
  function robotRun(delay = 0) {
    const d = el(`<div class="tip"><div class="bob" style="height:100%">${robot()}</div></div><div class="bubble" style="display:none">OBLITERATE?</div>`, 7, "walker walk");
    d.style.bottom = ".4rem"; d.style.left = "0"; d.style.animation = `wc-walkin 9s linear ${delay}s both`;
    const b = d.querySelector(".bubble");
    setTimeout(() => b.style.display = "", (delay + 5) * 1000);
    setTimeout(() => { d.classList.add("tripped"); b.textContent = "oof."; }, (delay + 9) * 1000);
    setTimeout(() => d.classList.add("gone"), (delay + 12) * 1000);
    setTimeout(() => d.remove(), (delay + 13.5) * 1000);
  }

  const EVENTS = {
    robot() { robotRun(); },
    traveller() { const d = el(`<div class="bob" style="height:100%">${traveller}</div>`, 7.5, "walker walk"); cross(d, 18); },
    chase() { const d = el(`<div class="bob" style="height:100%">${traveller}</div>`, 7.5, "walker walk"); d.style.bottom = ".4rem"; d.style.left = "0"; d.style.animation = "wk-cross 11s linear forwards"; setTimeout(() => d.remove(), 12000); robotRun(1.8); },
    dog() { const d = el(`<div class="bob" style="height:100%">${dog}</div>`, 4.5, "walker walk"); cross(d, 15); },
    hourglass() {
      const r = photoRect(), d = el(hourglass, 7, "mat");
      d.style.left = (r.left + 18) + "px"; d.style.top = (r.top + 16) + "px";
      d.classList.add("in");
      setTimeout(() => d.querySelector(".flip").classList.add("over"), 7000);
      setTimeout(() => { d.classList.remove("in"); d.classList.add("out"); }, 16000);
      setTimeout(() => d.remove(), 22000);
    },
    gnome() {
      const n = gnomeCount(), h = Math.min(16, 4.5 + n * 2), r = photoRect(), d = el(gnome, h, "fade");
      d.style.left = (r.right - h * rem() * .6 - 14) + "px"; d.style.top = (r.bottom - h * rem() - 6) + "px";
      fadeIn(d); setTimeout(() => d.classList.remove("in"), 25000); setTimeout(() => d.remove(), 27000);
    },
    gizmo() {
      const t = document.getElementById("time"), r = t ? t.getBoundingClientRect() : { left: innerWidth - 300, bottom: 140 };
      const d = el(gizmo, 2, "fade"); d.style.left = (r.left - 9 * rem()) + "px"; d.style.top = (r.bottom - 1.6 * rem()) + "px";
      fadeIn(d); setTimeout(() => d.classList.remove("in"), 7000); setTimeout(() => d.remove(), 9000);
    },
    doom() {
      if (document.getElementById("doom")) return;
      const d = document.createElement("div"); d.id = "doom"; d.innerHTML = `<b>DOOM!</b>${bigbot}`; document.body.appendChild(d);
      fadeIn({ classList: { add: () => d.classList.add("on") } });
      setTimeout(() => d.classList.remove("on"), 5300); setTimeout(() => d.remove(), 6000);
    },
  };
  const ORDER = ["robot", "hourglass", "dog", "gnome", "traveller", "gizmo", "chase", "hourglass", "robot", "gnome", "gizmo", "dog", "traveller", "chase"];
  // One every 17 minutes from 6am to midnight, worked out from the clock so a reload doesn't double up;
  // DOOM! every 50 minutes from 7am to 9pm.
  let lastSlot = -1, lastDoom = -1;
  function check() {
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    const m = +p.hour * 60 + +p.minute;
    if (m >= 420 && m <= 1260 && m % 50 === 25 && m !== lastDoom) { lastDoom = m; if (!document.querySelector("#greet.on")) EVENTS.doom(); return; }
    if (m < 360 || m % 17 !== 0) return;
    const slot = m / 17; if (slot === lastSlot) return; lastSlot = slot;
    if (document.querySelector(".wcast, .walker")) return;
    EVENTS[ORDER[slot % ORDER.length]]();
  }
  setInterval(check, 20000);
  const want = new URLSearchParams(location.search).get("who");
  if (want) setTimeout(() => {
    if (want === "all") Object.keys(EVENTS).forEach((n, i) => setTimeout(EVENTS[n], i * 7000));
    else if (EVENTS[want]) EVENTS[want]();
  }, 2500);
})();
