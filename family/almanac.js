/* The family board's almanac touches, in an engraved, antiquarian style:
   - an Almanac panel beside the "of yore" photos that turns over every few minutes:
     the Moon on Hevelius's 1647 plate with tonight's phase shaded in, and the year's daylight as an engraved curve;
   - a quirky countdown under the date, a different one each day;
   - in Po's panel: the date in Irish and Dublin Port's high and low water on a small brass dial.
   Location for anything astronomical: the Leeds, MA post office (a public landmark), never the house.
   Everything is computed once and redrawn only when a card turns over; nothing animates in a loop.
   Test: ?alm=moon or ?alm=day pins a card. */
(function () {
  const A = window.Astronomy;
  const PO = { lat: 42.355, lon: -72.703 };   // Leeds post office, ZIP 01053
  const OBS = A ? new A.Observer(PO.lat, PO.lon, 70) : null;
  const Q = new URLSearchParams(location.search);
  const fmt = (d, tz, o) => new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o }).format(d);
  const hm = (d, tz = TZ) => fmt(d, tz, { hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");
  const dmy = (d, tz = TZ) => fmt(d, tz, { weekday: "short", month: "short", day: "numeric" });
  const isoIn = (d, tz) => { const p = {}; for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d)) p[x.type] = x.value; return `${p.year}-${p.month}-${p.day}`; };
  const daysTo = iso => Math.round((Date.parse(iso) - Date.parse(isoToday())) / DAY);
  const hmLen = h => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /* ---------- the Moon ---------- */
  const FULL_NAMES = ["Wolf", "Snow", "Worm", "Pink", "Flower", "Strawberry", "Buck", "Sturgeon", "Harvest", "Hunter's", "Beaver", "Cold"];
  function phaseName(a) {
    if (a < 8 || a > 352) return ["Novilunium", "new moon"];
    if (a < 84) return ["Luna Crescens", "waxing crescent"];
    if (a < 96) return ["Luna Dimidiata Crescens", "first quarter"];
    if (a < 172) return ["Luna Gibbosa Crescens", "waxing gibbous"];
    if (a < 188) return ["Plenilunium", "full moon"];
    if (a < 264) return ["Luna Gibbosa Decrescens", "waning gibbous"];
    if (a < 276) return ["Luna Dimidiata Decrescens", "last quarter"];
    return ["Luna Decrescens", "waning crescent"];
  }
  // The dark part of the disc for a phase angle (0 new, 180 full); lit side on the right while waxing.
  function shadow(theta, cx, cy, r) {
    const wax = theta < 180, t = wax ? theta : 360 - theta;
    const rx = r * Math.abs(Math.cos(t * Math.PI / 180));
    const outer = wax ? 0 : 1, term = (wax === (t < 90)) ? 0 : 1;
    if (t < 1) return `M${cx},${cy - r} A${r},${r} 0 1 0 ${cx},${cy + r} A${r},${r} 0 1 0 ${cx},${cy - r} Z`;
    return `M${cx},${cy - r} A${r},${r} 0 0 ${outer} ${cx},${cy + r} A${rx.toFixed(2)},${r} 0 0 ${term} ${cx},${cy - r} Z`;
  }
  function nextFull(now) {
    const f = A.SearchMoonPhase(180, now, 40).date;
    return { date: f, name: FULL_NAMES[+fmt(f, TZ, { month: "numeric" }) - 1] };
  }
  function moonCard() {
    const now = new Date(), ang = A.MoonPhase(now), age = ang / 360 * 29.530588;
    const lit = Math.round(A.Illumination(A.Body.Moon, now).phase_fraction * 100);
    const [la, en] = phaseName(ang), f = nextFull(now);
    const ticks = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * Math.PI * 2, r1 = 93, r2 = i % 4 ? 96 : 99; return `<line x1="${100 + Math.cos(a) * r1}" y1="${100 + Math.sin(a) * r1}" x2="${100 + Math.cos(a) * r2}" y2="${100 + Math.sin(a) * r2}"/>`; }).join("");
    return `<div class="alm-k">Luna</div>
      <svg class="alm-moon" viewBox="0 0 200 200" aria-hidden="true">
        <g class="ink" fill="none"><circle cx="100" cy="100" r="99"/><circle cx="100" cy="100" r="93"/>${ticks}</g>
        <image href="../img/moon-hevelius.webp" x="12" y="12" width="176" height="176"/>
        <path d="${shadow(ang, 100, 100, 87)}" fill="rgba(16,9,3,.84)"/>
      </svg>
      <div class="alm-t">${la}</div>
      <div class="alm-s">${en} · ${age.toFixed(1)} days old · ${lit}% lit</div>
      <div class="alm-s">Next full: the ${f.name} Moon, ${dmy(f.date)}, ${hm(f.date)}</div>
      <div class="alm-c">Moon after Johannes Hevelius, Selenographia, 1647 · public domain</div>`;
  }

  /* ---------- the year's daylight ---------- */
  function sunTimes(day) {   // day: a Date at local midnight-ish
    const rise = A.SearchRiseSet(A.Body.Sun, OBS, +1, day, 1), set = A.SearchRiseSet(A.Body.Sun, OBS, -1, day, 1);
    return rise && set ? { rise: rise.date, set: set.date, len: (set.date - rise.date) / 3600000 } : null;
  }
  function midnight(iso) {   // local midnight in Massachusetts as a Date
    const guess = new Date(iso + "T05:00:00Z");
    return new Date(guess.getTime() - (+fmt(guess, TZ, { hour: "numeric", hourCycle: "h23" })) * 3600000);
  }
  function dayLen(lat, n) {   // hours of daylight on day-of-year n (a smooth approximation, for the curve)
    const d = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * Math.PI / 180, p = lat * Math.PI / 180;
    const c = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
    return 2 * Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI / 15;
  }
  function dayCard() {
    const t = isoToday(), y = +t.slice(0, 4), doy = Math.round((Date.parse(t) - Date.parse(`${y}-01-01`)) / DAY) + 1;
    const today = sunTimes(midnight(t)), yest = sunTimes(new Date(midnight(t).getTime() - DAY));
    const W = 300, H = 120, L = 22, R = 6, T = 10, B = 22, lo = 8.5, hi = 15.5;
    const X = n => L + (n - 1) / 364 * (W - L - R), Y = h => T + (hi - h) / (hi - lo) * (H - T - B);
    let d = ""; for (let n = 1; n <= 365; n += 2) d += (n === 1 ? "M" : "L") + X(n).toFixed(1) + "," + Y(dayLen(PO.lat, n)).toFixed(1);
    const fill = d + `L${X(365)},${H - B}L${X(1)},${H - B}Z`;
    const months = "JFMAMJJASOND".split("").map((m, i) => `<text x="${X(i * 30.4 + 15)}" y="${H - 8}">${m}</text>`).join("");
    const hours = [9, 11, 13, 15].map(h => `<line class="rule" x1="${L}" x2="${W - R}" y1="${Y(h)}" y2="${Y(h)}"/><text x="${L - 4}" y="${Y(h) + 3}" text-anchor="end">${h}</text>`).join("");
    const tx = X(doy), ty = Y(today ? today.len : dayLen(PO.lat, doy));
    let delta = "";
    if (today && yest) {
      const s = Math.round((today.len - yest.len) * 3600), a = Math.abs(s);
      delta = `${Math.floor(a / 60)}m ${a % 60}s ${s < 0 ? "less" : "more"} than yesterday`;
    }
    return `<div class="alm-k">Dies · Daylight</div>
      <svg class="alm-day" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" class="ink"/></pattern></defs>
        <rect class="ink" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="none"/>
        ${hours}<path d="${fill}" fill="url(#hatch)" opacity=".55"/><path d="${d}" class="ink curve" fill="none"/>
        <line class="hodie" x1="${tx}" x2="${tx}" y1="${T}" y2="${H - B}"/><circle class="hodie" cx="${tx}" cy="${ty}" r="3.2"/>
        <text class="lbl" x="${tx + (doy > 300 ? -5 : 5)}" y="${ty - 6}" text-anchor="${doy > 300 ? "end" : "start"}">hodie</text>
        <g class="axis">${months}</g>
      </svg>
      <div class="alm-t">${today ? hmLen(today.len) : ""} of daylight</div>
      <div class="alm-s">${delta}</div>
      <div class="alm-s">${today ? `Sunrise ${hm(today.rise)} · sunset ${hm(today.set)}` : ""}</div>`;
  }

  /* ---------- the Almanac panel ---------- */
  const CARDS = { moon: moonCard, day: dayCard };
  let ci = 0;
  function showCard() {
    const box = $("almbody"); if (!box || !A) return;
    const names = Object.keys(CARDS), pin = Q.get("alm");
    const name = CARDS[pin] ? pin : names[ci++ % names.length];
    box.classList.add("off");
    setTimeout(() => { try { box.innerHTML = CARDS[name](); box.dataset.card = name; } catch (e) {} box.classList.remove("off"); }, 700);
  }

  /* ---------- a quirky countdown, a different one each day ---------- */
  function nextMD(md) { const t = isoToday(), y = +t.slice(0, 4); let iso = `${y}-${md}`; if (iso < t) iso = `${y + 1}-${md}`; return iso; }
  function oddLines() {
    const now = new Date(), t = isoToday(), y = +t.slice(0, 4), L = [];
    if (A) {
      const f = nextFull(now), fd = daysTo(isoIn(f.date, TZ));
      if (fd > 0) L.push(`<b>${fd}</b> ${fd === 1 ? "day" : "days"} until the ${f.name} Moon is full`);
      const s = A.Seasons(y), s2 = A.Seasons(y + 1);
      const dec = isoIn(s.dec_solstice.date, TZ), jun = isoIn(s.jun_solstice.date, TZ) >= t ? isoIn(s.jun_solstice.date, TZ) : isoIn(s2.jun_solstice.date, TZ);
      const decN = dec >= t ? dec : isoIn(s2.dec_solstice.date, TZ);
      if (daysTo(decN) < daysTo(jun)) L.push(daysTo(decN) ? `<b>${daysTo(decN)}</b> days until the winter solstice, and then the light starts coming back` : "The winter solstice: from tomorrow the days get longer");
      else L.push(daysTo(jun) ? `<b>${daysTo(jun)}</b> days of lengthening days left, until the summer solstice` : "The summer solstice: the longest day of the year");
    }
    const bloom = daysTo(nextMD("06-16")); if (bloom) L.push(`<b>${bloom}</b> days until Bloomsday`);
    const pets = [["07-27", "Hercules"], ["10-05", "Nimona"], ["07-01", "Buster & Lucille"]].map(([md, n]) => [daysTo(nextMD(md)), n]).sort((a, b) => a[0] - b[0])[0];
    if (pets[0]) L.push(`<b>${pets[0]}</b> days until ${pets[1]}’s next gotcha day`);
    const moon = nextMD("07-20"); L.push(`<b>${daysTo(moon)}</b> days until the ${+moon.slice(0, 4) - 1969}th anniversary of the first moon landing`);
    let leap = y; while (!(leap % 4 === 0 && (leap % 100 !== 0 || leap % 400 === 0)) || `${leap}-02-29` < t) leap++;
    L.push(`<b>${daysTo(`${leap}-02-29`)}</b> days until the next leap day, February 29, ${leap}`);
    L.push(`<b>${daysTo("2061-07-28").toLocaleString("en-US")}</b> days until Halley’s Comet swings back round the Sun`);
    let d = new Date(Date.parse(t) + DAY); while (!(d.getUTCDate() === 13 && d.getUTCDay() === 5)) d = new Date(d.getTime() + DAY);
    L.push(`<b>${daysTo(d.toISOString().slice(0, 10))}</b> days until the next Friday the 13th`);
    const pi = daysTo(nextMD("03-14")); if (pi) L.push(`<b>${pi}</b> days until Pi Day`);
    return L;
  }
  function renderOdd() {
    const el = $("odd"); if (!el) return;
    const L = oddLines(), t = isoToday(), doy = Math.round((Date.parse(t) - Date.parse(t.slice(0, 4) + "-01-01")) / DAY);
    const pick = Q.get("odd") != null ? +Q.get("odd") : doy;
    el.innerHTML = L[pick % L.length]; el.hidden = false;
  }

  /* ---------- Po's panel: the date in Irish, Dublin's tides ---------- */
  const GA_DAYS = ["Dé Domhnaigh", "Dé Luain", "Dé Máirt", "Dé Céadaoin", "Déardaoin", "Dé hAoine", "Dé Sathairn"];
  const GA_MONTHS = ["Eanáir", "Feabhra", "Márta", "Aibreán", "Bealtaine", "Meitheamh", "Iúil", "Lúnasa", "Meán Fómhair", "Deireadh Fómhair", "Samhain", "Nollaig"];
  function renderGa() {
    const el = $("gadate"); if (!el) return;
    const iso = isoIn(new Date(), DUB), [y, m, d] = iso.split("-").map(Number);
    el.textContent = `${GA_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${GA_MONTHS[m - 1]}`;
  }
  function renderTide() {
    const el = $("tide"), td = (typeof DATA !== "undefined" && DATA) ? DATA.tides : null;
    if (!el || !td || !td.ext || !td.ext.length) { if (el) el.hidden = true; return; }
    const now = Date.now(), ex = td.ext.map(e => ({ ...e, d: new Date(e.t) }));
    const prev = [...ex].reverse().find(e => e.d <= now), next = ex.filter(e => e.d > now);
    if (!next.length) { el.hidden = true; return; }
    const nh = next.find(e => e.k === "high"), nl = next.find(e => e.k === "low");
    // needle: low water at the bottom, high water at the top, rising up the right-hand side
    let frac = .5; if (prev) frac = (now - prev.d) / (next[0].d - prev.d);
    const ang = prev && prev.k === "low" ? 180 - frac * 180 : -frac * 180;   // degrees from the top, clockwise
    const rad = (ang - 90) * Math.PI / 180, nx = 30 + Math.cos(rad) * 19, ny = 30 + Math.sin(rad) * 19;
    const ticks = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * Math.PI * 2; return `<line x1="${30 + Math.cos(a) * 24}" y1="${30 + Math.sin(a) * 24}" x2="${30 + Math.cos(a) * (i % 6 ? 26 : 27.5)}" y2="${30 + Math.sin(a) * (i % 6 ? 26 : 27.5)}"/>`; }).join("");
    el.innerHTML = `<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="29" class="brass"/><circle cx="30" cy="30" r="22.5" class="face"/>
      <g class="tk">${ticks}</g><text x="30" y="14" class="tl">HIGH</text><text x="30" y="50" class="tl">LOW</text>
      <line x1="30" y1="30" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" class="needle"/><circle cx="30" cy="30" r="2.4" class="pin"/></svg>
      <div><div class="tt">Dublin Bay tides</div>
      <div class="tv">${nh ? `High water <b>${hm(nh.d, DUB)}</b>` : ""}${nh && nl ? " · " : ""}${nl ? `low <b>${hm(nl.d, DUB)}</b>` : ""}</div></div>`;
    el.hidden = false;
  }

  function daily() { renderOdd(); renderGa(); }
  daily(); renderTide(); showCard();
  let lastDay = isoToday();
  setInterval(() => { if (isoToday() !== lastDay) { lastDay = isoToday(); daily(); } renderTide(); }, 5 * 60000);
  setInterval(showCard, 3 * 60000);
  setTimeout(renderTide, 15000);   // once the encrypted data has loaded
})();
