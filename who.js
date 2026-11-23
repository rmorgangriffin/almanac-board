/* Whovian board extras: a fast time vortex (one pre-drawn spiral, spun and zoomed with CSS
   transforms only, so the Pi's GPU does the work) and solid panels in place of blurred ones. */
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

})();
