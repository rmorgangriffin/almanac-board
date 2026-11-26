/* Morning and night greetings, as on the old DAKboard screen:
   7:00–7:01am "Good morning, jerks!" and 12:00–12:04am "Goodnight, jerks!".
   A big message over the board in the current look's colors, faded in and out.
   ?greet=morning or ?greet=night shows one for a minute to test. */
(function () {
  const st = document.createElement("style");
  st.textContent = `
#greet { position: fixed; inset: 0; z-index: 70; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 6vw;
  background: rgba(17, 21, 42, .86); opacity: 0; transition: opacity 1.5s ease; pointer-events: none; }
#greet.on { opacity: 1; }
#greet div { font-family: var(--display, Georgia, serif); font-size: 7.5vw; line-height: 1.1; color: var(--fg, #e9e6dc); }
#greet em { font-style: normal; color: var(--amber, #f2a93b); }`;
  document.head.appendChild(st);
  const el = document.createElement("div"); el.id = "greet"; el.hidden = true;
  document.body.appendChild(el);
  const MSG = { morning: "Good morning, <em>jerks!</em>", night: "Goodnight, <em>jerks!</em>" };
  let shown = null, forced = new URLSearchParams(location.search).get("greet"), forcedUntil = Date.now() + 63000;
  function which() {
    if (forced && MSG[forced] && Date.now() < forcedUntil) return forced;
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    const h = +p.hour, m = +p.minute;
    if (h === 7 && m < 2) return "morning";
    if (h === 0 && m < 5) return "night";
    return null;
  }
  // the wording comes from the Family board note when the board has it (window.CH), else MSG
  function check() {
    const w = which();
    if (w === shown) return;
    shown = w;
    if (w) { el.innerHTML = `<div>${window.CH ? CH("greet." + w, { morning: "Good morning, *jerks!*", night: "Goodnight, *jerks!*" }[w]) : MSG[w]}</div>`; el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on"))); }
    else { el.classList.remove("on"); setTimeout(() => { if (!shown) el.hidden = true; }, 1600); }
  }
  check(); setInterval(check, 5000);
})();
