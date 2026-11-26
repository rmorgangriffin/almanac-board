/* Thanksgiving turkeys: every 20–40 minutes on the day (8am–9pm), one antique turkey picture (public-domain plates and
   postcards, cut out, in img/turkey/) crosses the screen: left to right, right to left, or down the left edge.
   One at a time; transform and opacity only, for the Pi. Times come from the date, so a reload doesn't add one.
   ?turkey=now sends one across a few seconds after loading (?turkey=ltr, rtl or down picks the direction; ?turkey=still parks one
   halfway, for a screenshot); ?date= previews a day. */
(function () {
  const TURKEYS = [["audubon-cock", "right"], ["audubon-hen", "right"], ["nozeman", "right"], ["postcard-1", "left"], ["postcard-2", "left"], ["postcard-3", "left"]];
  const Q = new URLSearchParams(location.search), TZ = "America/New_York";
  const st = document.createElement("style");
  st.textContent = `
.turkey { position: fixed; z-index: 58; pointer-events: none; opacity: 0; will-change: transform, opacity; transition: opacity 1.2s ease; }
.turkey.on { opacity: .95; }
.turkey img { display: block; height: 100%; width: auto; filter: drop-shadow(0 .15rem .35rem rgba(0,0,0,.55)); animation: tk-bob .55s ease-in-out infinite alternate; }
.turkey.flip img { transform: scaleX(-1); animation-name: tk-bob-flip; }
@keyframes tk-bob { from { transform: translateY(0); } to { transform: translateY(-4%); } }
@keyframes tk-bob-flip { from { transform: scaleX(-1) translateY(0); } to { transform: scaleX(-1) translateY(-4%); } }
@media (prefers-reduced-motion: reduce) { .turkey img { animation: none; } }`;
  document.head.appendChild(st);
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const nowParts = () => { const p = {}; for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value; return p; };
  function slots(date) {   // minutes after midnight: first between 8:00 and 8:40, then every 20–40 minutes until 9pm
    let h = hash("turkey" + date); const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
    const out = []; let m = 480 + Math.floor(rnd() * 40);
    while (m < 1260) { out.push([m, Math.floor(rnd() * TURKEYS.length), Math.floor(rnd() * 3)]); m += 20 + Math.floor(rnd() * 21); }
    return out;
  }
  let busy = false;
  function cross(i, dir) {
    if (busy || window.WALK_LITE) return; busy = true;
    const [name, faces] = TURKEYS[i], W = innerWidth, H = innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const el = document.createElement("div"); el.className = "turkey"; const h = 9 * rem; el.style.height = h + "px";
    const img = new Image(); img.alt = ""; img.src = `../img/turkey/turkey-${name}.webp`; el.appendChild(img);
    const go = () => {
      const w = img.naturalWidth / img.naturalHeight * h, D = ["ltr", "rtl", "down"][dir];
      let from, to;
      if (D === "down") { el.style.left = .6 * rem + "px"; from = [0, H * .3]; to = [0, H + 20]; }       // down the left edge, below the header
      else { el.style.left = "0"; el.style.bottom = .4 * rem + "px"; el.style.top = "auto"; from = D === "ltr" ? [-w - 20, 0] : [W + 20, 0]; to = D === "ltr" ? [W + 20, 0] : [-w - 20, 0]; }
      if (D === "down") el.style.top = "0";
      const movingRight = D === "ltr" || (D === "down" && faces === "right");
      el.classList.toggle("flip", (faces === "right") !== movingRight);
      const secs = D === "down" ? 22 : 30;
      el.style.transform = `translate(${from[0]}px, ${from[1]}px)`; document.body.appendChild(el);
      if (Q.get("turkey") === "still") { el.classList.add("on"); el.style.transform = `translate(${(from[0] + to[0]) / 2}px, ${(from[1] + to[1]) / 2}px)`; return; }   // preview: parked halfway
      void el.offsetWidth;   // lay it out at the start position before moving it
      setTimeout(() => { el.style.transition = `transform ${secs}s linear, opacity 1.2s ease`; el.classList.add("on"); el.style.transform = `translate(${to[0]}px, ${to[1]}px)`; }, 60);
      setTimeout(() => { el.classList.remove("on"); }, (secs - 1.5) * 1000);
      setTimeout(() => { el.remove(); busy = false; }, secs * 1000 + 300);
    };
    img.decode().then(go).catch(() => { busy = false; });
  }
  const done = new Set();
  function check() {
    if (!(window.isTG && window.isTG())) return;
    const p = nowParts(), date = `${p.year}-${p.month}-${p.day}`, m = +p.hour * 60 + +p.minute;
    for (const [t, i, d] of slots(date)) if (m >= t && m < t + 2 && !done.has(date + t)) { done.add(date + t); cross(i, d); }
  }
  setInterval(check, 30000);
  const f = Q.get("turkey");
  if (f) setTimeout(() => cross(Math.floor(Math.random() * TURKEYS.length), f === "down" ? 2 : f === "rtl" ? 1 : f === "ltr" ? 0 : Math.floor(Math.random() * 3)), 3000);
})();
