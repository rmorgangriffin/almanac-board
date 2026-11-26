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
  // wording from the Family board note (DATA.copy) when the board has it; the built-in wording otherwise
  const TT = (k, d) => window.T ? T(k, d) : d;
  const W = (k, d, v = {}) => window.CH ? CH(k, d, v) : esc(d).replace(/\{(\w+)\}/g, (m, x) => x in v ? v[x] : m);
  const PL = (k, d, v = {}) => String(TT(k, d)).replace(/\{(\w+)\}/g, (m, x) => x in v ? v[x] : m);
  const row = (k, i, d) => { const t = TT(k, null); return (t && t[i]) || d; };

  /* ---------- the Moon ---------- */
  const FULL_NAMES = ["Wolf", "Snow", "Worm", "Pink", "Flower", "Strawberry", "Buck", "Sturgeon", "Harvest", "Hunter's", "Beaver", "Cold"];
  const PHASES = [["New moon", "New", "Novilunium"], ["Waxing crescent", "Young crescent", "Luna crescens"], ["First quarter", "First quarter", "Luna dimidiata"], ["Waxing gibbous", "Waxing gibbous", "Luna gibbosa"],
    ["Full moon", "Full", "Plenilunium"], ["Waning gibbous", "Waning gibbous", "Luna gibbosa"], ["Last quarter", "Last quarter", "Luna dimidiata"], ["Waning crescent", "Old crescent", "Luna decrescens"]];
  function phaseName(a) {   // [English, short, Latin]
    const i = (a < 8 || a > 352) ? 0 : a < 84 ? 1 : a < 96 ? 2 : a < 172 ? 3 : a < 188 ? 4 : a < 264 ? 5 : a < 276 ? 6 : 7;
    return row("ref.phases", i, PHASES[i]).map(esc);
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
    const i = +fmt(f, TZ, { month: "numeric" }) - 1; return { date: f, name: esc(row("ref.fullMoons", i, FULL_NAMES[i])) };
  }
  const face = (ang, size, cls = "") => `<svg class="${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><image href="../img/moon-lro.webp" x="2" y="2" width="96" height="96"/><path d="${shadow(ang, 50, 50, 48)}" fill="rgba(12,8,4,.86)"/><circle cx="50" cy="50" r="48.5" fill="none" class="ink"/></svg>`;
  function moonCard() {
    const now = new Date(), ang = A.MoonPhase(now), age = ang / 360 * 29.530588;
    const lit = Math.round(A.Illumination(A.Body.Moon, now).phase_fraction * 100);
    const [en, , la] = phaseName(ang), f = nextFull(now), nw = A.SearchMoonPhase(0, now, 40).date;
    const strip = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getTime() + i * 3.69 * DAY), a = A.MoonPhase(d);
      return `<div class="mc${i ? "" : " on"}">${face(a, 30)}<div class="md">${i ? fmt(d, TZ, { month: "short", day: "numeric" }) : W("almw.moonTonight", "Tonight")}</div><div class="mp">${phaseName(a)[1]}</div></div>`;
    }).join("");
    return `<div class="alm-k">${esc(window.T ? T("alm.moon", "The Moon") : "The Moon")}</div>
      <div class="moonrow">${face(ang, 112, "big")}<div class="mtxt"><div class="alm-t">${en}</div><div class="alm-la">${la}</div>
        <div class="alm-s">${W("almw.moonAge", "{age} days old · {lit}% lit", { age: age.toFixed(1), lit })}</div></div></div>
      <div class="mstrip">${strip}</div>
      <div class="alm-s">${W("almw.moonNext", "Full moon {full} (the {name} Moon) · New moon {new}", { full: dmy(f.date), name: f.name, new: dmy(nw) })}</div>
      <div class="alm-c">${W("credits.moon", "Lunar Reconnaissance Orbiter photo, NASA · public domain")}</div>`;
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
      delta = s < 0 ? W("almw.dayLess", "{m}m {sec}s less than yesterday", { m: Math.floor(a / 60), sec: a % 60 }) : W("almw.dayMore", "{m}m {sec}s more than yesterday", { m: Math.floor(a / 60), sec: a % 60 });
    }
    return `<div class="alm-k">${esc(window.T ? T("alm.day", "Daylight") : "Daylight")}</div>
      <svg class="alm-day" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <defs><pattern id="hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" class="ink"/></pattern></defs>
        <rect class="ink" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="none"/>
        ${hours}<path d="${fill}" fill="url(#hatch)" opacity=".55"/><path d="${d}" class="ink curve" fill="none"/>
        <line class="hodie" x1="${tx}" x2="${tx}" y1="${T}" y2="${H - B}"/><circle class="hodie" cx="${tx}" cy="${ty}" r="3.2"/>
        <text class="lbl" x="${tx + (doy > 300 ? -5 : 5)}" y="${ty - 6}" text-anchor="${doy > 300 ? "end" : "start"}">${W("almw.dayToday", "today")}</text>
        <g class="axis">${months}</g>
      </svg>
      <div class="alm-t">${today ? W("almw.dayLength", "{len} of daylight", { len: hmLen(today.len) }) : ""}</div>
      <div class="alm-s">${delta}</div>
      <div class="alm-s">${today ? W("almw.daySun", "Sunrise {rise} · sunset {set}", { rise: hm(today.rise), set: hm(today.set) }) : ""}</div>`;
  }


  /* ---------- tonight's sky: the constellation highest at 9 pm, on Hevelius's plate, and the planets ---------- */
  const CONST = [["uma", "Ursa Major", "the Great Bear", 11.0, 50], ["cvn", "Canes Venatici", "the Hunting Dogs", 13.0, 40], ["crb", "Corona Borealis", "the Northern Crown", 15.8, 32],
    ["her", "Hercules", "the strongman", 17.4, 27], ["lyr", "Lyra", "the Lyre", 18.8, 36], ["cyg", "Cygnus", "the Swan", 20.6, 42], ["del", "Delphinus", "the Dolphin", 20.7, 12],
    ["lac", "Lacerta", "the Lizard", 22.5, 46], ["peg", "Pegasus", "the Winged Horse", 22.7, 20], ["and", "Andromeda", "the Chained Princess", 0.8, 38], ["cas", "Cassiopeia", "the Queen", 1.0, 62],
    ["tri", "Triangulum", "the Triangle", 2.1, 32], ["per", "Perseus", "the Hero", 3.2, 45], ["ori", "Orion", "the Hunter", 5.6, 5], ["lyn", "Lynx", "the Lynx", 7.9, 47],
    ["cnc", "Cancer", "the Crab", 8.6, 20], ["lmi", "Leo Minor", "the Little Lion", 10.2, 33], ["leo", "Leo", "the Lion", 10.7, 13]];
  const DIRS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const where = h => { const i = Math.round(h.azimuth / 45) % 8, dir = esc(row("ref.dirs", i, DIRS[i]));
    return h.altitude > 75 ? W("almw.skyOverhead", "overhead") : h.altitude < 20 ? W("almw.skyLow", "low in the {dir}", { dir }) : h.altitude < 50 ? W("almw.skyMid", "in the {dir}", { dir }) : W("almw.skyHigh", "high in the {dir}", { dir }); };
  function tonight9() { const m = midnight(isoToday()); return new Date(m.getTime() + 21 * 3600000); }
  function skyCard() {
    const t = tonight9();
    const best = CONST.map(c => [c, A.Horizon(t, OBS, c[3], c[4], "normal")]).sort((a, b) => b[1].altitude - a[1].altitude)[0];
    const ci = CONST.indexOf(best[0]), k = best[0][0], [la, en] = row("ref.constellations", ci, [best[0][1], best[0][2]]).map(esc);
    const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map(n => {
      const eq = A.Equator(A.Body[n], t, OBS, true, true), h = A.Horizon(t, OBS, eq.ra, eq.dec, "normal");
      return h.altitude > 5 ? `${n} ${where(h)}` : null;
    }).filter(Boolean);
    return `<div class="alm-k">${esc(window.T ? T("alm.sky", "Tonight's Sky") : "Tonight's Sky")}</div>
      <img class="plate" src="../img/sky/${k}.jpg" alt="">
      <div class="alm-t">${la}, ${en}</div>
      <div class="alm-s">${W("almw.skyAt", "{where} at 9 pm", { where: where(best[1]) }).replace(/^./, c => c.toUpperCase())}</div>
      <div class="alm-s">${planets.length ? planets.join(" · ") : (window.T ? T("alm.skyNone", "No bright planets up at 9 pm") : "No bright planets up at 9 pm")}</div>
      <div class="alm-c">${W("credits.sky", "Johannes Hevelius, Uranographia, 1690 (drawn as on a globe, so mirrored) · public domain")}</div>`;
  }


  /* ---------- the Connecticut River, from the USGS gauge at Holyoke (and the Mill River, which runs through Leeds) ---------- */
  let RIVER = null, riverAt = 0;
  async function loadRiver() {
    if (RIVER && Date.now() - riverAt < 30 * 60000) return RIVER;
    const base = "https://waterservices.usgs.gov/nwis/";
    const [iv, dv, st] = await Promise.all([
      fetch(base + "iv/?format=json&sites=01172010,01171500&parameterCd=00060,00065&period=P2D").then(r => r.ok ? r.json() : null),
      fetch(base + "dv/?format=json&sites=01172010&parameterCd=00060&period=P30D").then(r => r.ok ? r.json() : null).catch(() => null),
      (RIVER && RIVER.norm) ? Promise.resolve(null) : fetch(base + "stat/?format=rdb&sites=01172010&statReportType=daily&statTypeCd=median,p25,p75&parameterCd=00060").then(r => r.ok ? r.text() : null).catch(() => null),
    ]);
    if (!iv) throw new Error("usgs");
    const out = {};
    for (const s of iv.value.timeSeries) {
      const site = s.sourceInfo.siteCode[0].value, v = s.variable.variableCode[0].value;
      out[site + ":" + v] = s.values[0].value.filter(x => +x.value > -999).map(x => [Date.parse(x.dateTime), +x.value]);
    }
    // the last 30 days, one mean a day (noon of each day), from the daily-values service
    out.daily = dv ? dv.value.timeSeries[0].values[0].value.filter(x => +x.value > -999).map(x => [Date.parse(x.dateTime.slice(0, 10) + "T12:00:00"), +x.value]) : [];
    // the normal range for each day of the year (25th to 75th percentile, and the median), 2003 onward
    out.norm = (RIVER && RIVER.norm) || {};
    if (st) for (const line of st.split("\n")) {
      const f = line.split("\t"); if (f[0] !== "USGS") continue;
      out.norm[`${f[5]}-${f[6]}`] = [+f[10], +f[11], +f[12]];
    }
    RIVER = out; riverAt = Date.now(); return out;
  }
  function riverCard() {
    const R = RIVER; if (!R) { loadRiver().then(showCardNow).catch(() => {}); throw new Error("no river yet"); }
    const iv = R["01172010:00060"] || [], h = R["01172010:00065"] || [], mill = R["01171500:00060"] || [];
    if (!iv.length) throw new Error("no flow");
    const last = iv[iv.length - 1], dayAgo = iv.find(x => x[0] >= last[0] - DAY) || iv[0];
    const ch = (last[1] - dayAgo[1]) / dayAgo[1], trend = ch > .05 ? W("almw.riverRising", "rising") : ch < -.05 ? W("almw.riverFalling", "falling") : W("almw.riverSteady", "steady");
    const q = [...(R.daily || []).filter(x => x[0] < last[0] - 6 * 3600000), last];   // 30 daily means, then the latest reading
    const start = Math.min(q[0][0], last[0] - 29 * DAY);
    const md = ts => { const d = new Date(ts); return `${d.getMonth() + 1}-${d.getDate()}`; };
    const band = []; for (let ts = start; ts <= last[0] + 1; ts += DAY) { const n = R.norm && R.norm[md(ts)]; if (n) band.push([ts, ...n]); }
    const vals = [...q.map(x => x[1]), ...band.flatMap(b => [b[1], b[3]])];
    const W = 300, H = 92, P = 6, top = 6, bot = H - 16, lo = Math.min(...vals) * .9, hi = Math.max(...vals) * 1.05;
    const X = ts => P + (ts - start) / (last[0] - start) * (W - 2 * P), Y = v => bot - (v - lo) / ((hi - lo) || 1) * (bot - top);
    const line = pts => pts.map((x, i) => (i ? "L" : "M") + X(x[0]).toFixed(1) + "," + Y(x[1]).toFixed(1)).join("");
    const bandD = band.length ? band.map((b, i) => (i ? "L" : "M") + X(b[0]).toFixed(1) + "," + Y(b[3]).toFixed(1)).join("") + [...band].reverse().map(b => "L" + X(b[0]).toFixed(1) + "," + Y(b[1]).toFixed(1)).join("") + "Z" : "";
    const med = band.length ? line(band.map(b => [b[0], b[2]])) : "";
    const ticks = [0, 7, 14, 21, 28].map(k => last[0] - k * DAY).filter(ts => ts >= start).map(ts => `<line class="rule" x1="${X(ts)}" x2="${X(ts)}" y1="${top}" y2="${bot}"/><text x="${X(ts)}" y="${H - 5}" text-anchor="${ts === last[0] ? "end" : "middle"}">${ts === last[0] ? W("almw.riverToday", "today") : fmt(new Date(ts), TZ, { month: "short", day: "numeric" })}</text>`).join("");
    const nToday = R.norm && R.norm[md(last[0])];
    const usual = nToday ? Math.round(nToday[1]).toLocaleString("en-US") : "";
    const vsNormal = nToday ? (last[1] < nToday[0] ? W("almw.riverBelow", "below normal for late {month} (usually {usual})", { month: fmt(new Date(last[0]), TZ, { month: "long" }), usual }) : last[1] > nToday[2] ? W("almw.riverAbove", "above normal for the time of year (usually {usual})", { usual }) : W("almw.riverNormal", "about normal for the time of year")) : "";
    return `<div class="alm-k">${esc(window.T ? T("alm.river", "The River") : "The River")}</div>
      <div class="alm-t">${esc(window.T ? T("alm.riverName", "The Connecticut at Holyoke") : "The Connecticut at Holyoke")}</div>
      <svg class="alm-day" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect class="ink" x="${P}" y="${top}" width="${W - 2 * P}" height="${bot - top}" fill="none"/>${ticks}
        ${bandD ? `<path d="${bandD}" class="normband"/><path d="${med}" class="normline" fill="none"/>` : ""}
        <path d="${line(q)}" class="ink curve" fill="none"/>
        <circle class="hodie" cx="${X(last[0])}" cy="${Y(last[1])}" r="3"/></svg>
      <div class="alm-s">${W("almw.riverFlow", "{cfs} cubic feet a second, {trend}", { cfs: `<b class="num">${Math.round(last[1]).toLocaleString("en-US")}</b>`, trend })}${h.length ? " · " + W("almw.riverGauge", "gauge {ft} ft", { ft: h[h.length - 1][1].toFixed(1) }) : ""}</div>
      <div class="alm-s">${vsNormal || W("almw.riverRange", "Past month: {lo} to {hi} cfs", { lo: Math.round(Math.min(...q.map(x => x[1]))).toLocaleString("en-US"), hi: Math.round(Math.max(...q.map(x => x[1]))).toLocaleString("en-US") })}</div>
      ${mill.length ? `<div class="alm-s">${W("almw.riverMill", "The Mill River at Northampton: {cfs} cfs", { cfs: Math.round(mill[mill.length - 1][1]) })}</div>` : ""}
      <div class="alm-c">${W("credits.river", "Last 30 days; shaded: the usual range for the date, 2003–now · USGS gauges 01172010 and 01171500, provisional")}</div>`;
  }

  /* ---------- shooting stars: the next major meteor shower (peak dates and rates after the IMO calendar) ---------- */
  const SHOWERS = [["01-03", "Quadrantids", "Boötes", 80, "Jan 3–4"], ["04-22", "Lyrids", "Lyra", 18, "Apr 21–22"], ["05-06", "Eta Aquariids", "Aquarius", 50, "May 5–6"],
    ["08-12", "Perseids", "Perseus", 100, "Aug 12–13"], ["10-21", "Orionids", "Orion", 20, "Oct 20–21"], ["11-17", "Leonids", "Leo", 15, "Nov 16–17"],
    ["12-14", "Geminids", "Gemini", 150, "Dec 13–14"], ["12-22", "Ursids", "Ursa Minor", 10, "Dec 21–22"]];
  function meteorCard() {
    const t = isoToday(), y = +t.slice(0, 4);
    const list = SHOWERS.map((s, i) => { let iso = `${y}-${s[0]}`; if (iso < t) iso = `${y + 1}-${s[0]}`; const [nm, rd, ng] = row("ref.showers", i, [s[1], s[2], s[4]]).map(esc); return [iso, nm, rd, s[3], ng]; }).sort((a, b) => a[0] < b[0] ? -1 : 1);
    const [iso, name, rad, zhr, nights] = list[0], n = daysTo(iso);
    const lit = Math.round(A.Illumination(A.Body.Moon, new Date(iso + "T08:00:00Z")).phase_fraction * 100);
    const moon = lit < 25 ? W("almw.meteorDark", "a dark sky, with little moonlight") : lit < 60 ? W("almw.meteorSome", "a {lit}% moon, so some glare", { lit }) : W("almw.meteorBright", "a {lit}% moon washing out the fainter ones", { lit });
    return `<div class="alm-k">${esc(window.T ? T("alm.meteor", "Shooting Stars") : "Shooting Stars")}</div>
      <img class="plate" src="../img/leonids-1833.jpg" alt="">
      <div class="alm-t">${W("almw.meteorName", "The {name}", { name })}</div>
      <div class="alm-s">${W("almw.meteorNights", "{peak}: the nights of {nights}", { peak: n === 0 ? W("almw.meteorTonight", "Peak tonight") : n === 1 ? W("almw.meteorTomorrow", "Peak tomorrow night") : W("almw.meteorDays", "Peak in {n} days", { n }), nights })}</div>
      <div class="alm-s">${W("almw.meteorRate", "Up to {zhr} an hour from {radiant}, under ideal skies · {moon}", { zhr, radiant: rad, moon })}</div>
      <div class="alm-c">${W("credits.meteor", "The great Leonid storm of 1833, engraving by Adolf Vollmy, 1889 · public domain")}</div>`;
  }


  /* ---------- in season: a plant of western Massachusetts, changing every week or so, on an antique plate ---------- */
  const PLANTS = [   // [from week, file, common name, binomial, note, plate credit]
    [1, "winterberry", "Winterberry", "Ilex verticillata", "A holly that drops its leaves; the red berries hang on all winter", "The American Flora, vol. 4, 1855"],
    [7, "hemlock", "Eastern hemlock", "Tsuga canadensis", "The dark evergreen of cool, shady ravines", "F. A. Michaux, The North American Sylva, 1819"],
    [11, "skunk", "Skunk cabbage", "Symplocarpus foetidus", "The first to bloom, warming its own hood enough to melt the snow", "The American Flora, vol. 3, 1855"],
    [15, "bloodroot", "Bloodroot", "Sanguinaria canadensis", "Brief white flowers; the root bleeds an orange-red sap", "Curtis's Botanical Magazine, plate 162, 1791"],
    [17, "arbutus", "Trailing arbutus", "Epigaea repens", "The mayflower, Massachusetts's state flower", "Maria Morris, Wild Flowers of Nova Scotia, 1840"],
    [19, "trillium", "Red trillium", "Trillium erectum", "Wake-robin: three petals over three leaves", "The Botanical Magazine, plate 470, 1800"],
    [21, "columbine", "Wild columbine", "Aquilegia canadensis", "Nodding red-and-yellow spurs that hummingbirds love", "The Botanical Magazine, plate 246, 1794"],
    [23, "laurel", "Mountain laurel", "Kalmia latifolia", "Clouds of pink-white cups on the wooded hillsides", "The Botanical Magazine, plate 175, 1792"],
    [27, "ghostpipe", "Indian pipe", "Monotropa uniflora", "A ghostly white plant with no green in it at all", "Alice Lounsberry, A Guide to the Wild Flowers, 1899"],
    [31, "cardinal", "Cardinal flower", "Lobelia cardinalis", "Scarlet spikes along the stream banks", "The Botanical Magazine, plate 320, 1795"],
    [36, "goldenrod", "Canada goldenrod", "Solidago canadensis", "Gold along every field edge", "Step & Watson, Favourite Flowers, 1896"],
    [40, "aster", "New England aster", "Symphyotrichum novae-angliae", "Purple asters, the last big bloom before frost", "F. S. Mathews, Field Book of American Wild Flowers, 1902"],
    [44, "witchhazel", "Witch hazel", "Hamamelis virginiana", "Spidery yellow flowers on bare branches, in November", "C. F. Millspaugh, American Medicinal Plants, 1887"],
    [49, "winterberry", "Winterberry", "Ilex verticillata", "A holly that drops its leaves; the red berries hang on all winter", "The American Flora, vol. 4, 1855"]];
  function plantCard() {
    const t = isoToday(), week = Math.floor((Date.parse(t) - Date.parse(t.slice(0, 4) + "-01-01")) / DAY / 7) + 1;
    const p0 = [...PLANTS].reverse().find(x => week >= x[0]) || PLANTS[0], pr = row("credits.plants", PLANTS.indexOf(p0), p0.slice(2)).map(esc), p = [p0[0], p0[1], ...pr];
    return `<div class="alm-k">${esc(window.T ? T("alm.plant", "In Season") : "In Season")}</div>
      <img class="plate" src="../img/bot/${p[1]}.jpg" alt="">
      <div class="alm-t">${p[2]}</div><div class="alm-la">${p[3]}</div>
      <div class="alm-s">${p[4]}</div>
      <div class="alm-c">${p[5]} · ${W("credits.pd", "public domain")}</div>`;
  }


  /* ---------- bird of the day: a recent sighting near Leeds with its Audubon plate (found by the family data job) ---------- */
  function birdCard() {
    if (window.isTG && isTG()) return `<div class="alm-k">${esc(TT("alm.bird", "Bird of the Day"))}</div>
      <img class="plate" src="../img/turkey/audubon-turkey.jpg" alt="">
      <div class="alm-t">${W("thanksgiving.birdName", "Wild Turkey")}</div><div class="alm-la">Meleagris gallopavo</div>
      <div class="alm-s">${W("thanksgiving.birdLine", "Plate 1 of The Birds of America; wild flocks roam the woods around Leeds")}</div>
      <div class="alm-c">${W("thanksgiving.birdCredit", "John James Audubon, engraved by W. H. Lizars, 1827 · The Birds of America, plate 1 · public domain")}</div>`;
    const b = (typeof DATA !== "undefined" && DATA) ? DATA.bird : null;
    if (!b || !b.plate) throw new Error("no bird");
    const seen = b.seen ? fmt(new Date(b.seen + "T12:00:00Z"), TZ, { month: "short", day: "numeric" }) : "";
    const m = /^(.*?)(?: after)? John James Audubon, (.*?), (\d{4})/.exec(b.plate_title || "");
    const credit = m ? `${b.plate_title.includes("Havell") ? "Robert Havell after " : ""}John James Audubon, ${m[2]}, ${m[3]}` : (b.plate_title || "Audubon, The Birds of America");
    return `<div class="alm-k">${esc(window.T ? T("alm.bird", "Bird of the Day") : "Bird of the Day")}</div>
      <img class="plate" src="${esc(b.plate)}" alt="">
      <div class="alm-t">${esc(b.common)}</div><div class="alm-la">${esc(b.sci)}</div>
      <div class="alm-s">${W("almw.birdWhere", "{how} near Leeds", { how: b.source === "ebird-notable" ? W("almw.birdNotable", "A notable sighting") : W("almw.birdSeen", "Seen") })}${seen ? " " + W("almw.birdOn", "on {date}", { date: seen }) : ""}${b.sightings > 1 ? ", " + W("almw.birdReports", "{n} reports this week", { n: b.sightings }) : ""}</div>
      <div class="alm-c">${esc(credit)}, ${W("credits.bird", "The Birds of America · public domain · sighting via {source}", { source: b.source && b.source.startsWith("ebird") ? "eBird" : "iNaturalist" })}</div>`;
  }

  /* ---------- infinite monkey theorem: one monkey at a time on a live channel; every 10 minutes the one on screen types a real line with one letter wrong ---------- */
  const MONKEY_TITLE = "Infinite Monkey Theorem · Live Trial";   // Morgan may rename this
  const LINES = [
    "To be, or not to be, that is the question",
    "Something is rotten in the state of Denmark",
    "There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy",
    "The lady doth protest too much, methinks",
    "Brevity is the soul of wit",
    "Though this be madness, yet there is method in't",
    "Alas, poor Yorick! I knew him, Horatio",
    "The rest is silence",
    "Frailty, thy name is woman!",
    "Neither a borrower nor a lender be",
    "This above all: to thine own self be true",
    "Good night, sweet prince, and flights of angels sing thee to thy rest",
    "There is nothing either good or bad, but thinking makes it so",
    "The play's the thing wherein I'll catch the conscience of the king",
    "What a piece of work is a man!",
    "I must be cruel only to be kind",
    "Get thee to a nunnery",
    "O, that this too too solid flesh would melt",
    "Words, words, words",
    "The time is out of joint",
    "I am but mad north-north-west",
    "Sweets to the sweet: farewell!",
    "When sorrows come, they come not single spies, but in battalions",
    "Murder most foul, as in the best it is",
    "I could be bounded in a nutshell and count myself a king of infinite space",
    "One may smile, and smile, and be a villain",
    "Give every man thy ear, but few thy voice",
    "The readiness is all",
    "My words fly up, my thoughts remain below",
    "We know what we are, but know not what we may be",
    "How weary, stale, flat, and unprofitable seem to me all the uses of this world",
    "To sleep, perchance to dream: ay, there's the rub",
    "Doubt thou the stars are fire",
    "Hold, as 'twere, the mirror up to nature",
    "There's a divinity that shapes our ends, rough-hew them how we will",
    "Conscience does make cowards of us all",
  ];
  const MONKEYS = ["Bonzo", "Bubbles", "Mabel", "Gus", "Pickles", "Dr. Fernsby", "Coco", "Biscuit", "Reginald", "Mo", "Pudding", "Sir Toby", "Peanut", "Lulu", "Barnaby",
    "Clementine", "Winston", "Noodle", "Professor Hobbs", "Dot", "Mungo", "Petunia", "Ham", "Enos", "Tiberius", "Rufus", "Marmalade", "Ziggy", "Agnes", "Chuckles",
    "Nutmeg", "Admiral Tibbs", "Olive", "Bartholomew", "Duchess", "Squeak", "Humphrey", "Fig", "Mrs. Pennywhistle", "Captain Biffle", "Waffles", "Gertrude"];
  const KEYS = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzetaoinshrdlu;;,,..''kkqqwwppffjj           ";
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const rnd = n => Math.floor(Math.random() * n), fmtN = n => n.toLocaleString("en-US");
  function oneWrong(line) {   // exactly one letter changed, a different letter each time
    const idx = [...line].map((c, i) => /[a-z]/i.test(c) ? i : -1).filter(i => i >= 0), i = idx[rnd(idx.length)], c = line[i];
    let r = c.toLowerCase(); while (r === c.toLowerCase()) r = "abcdefghijklmnopqrstuvwxyz"[rnd(26)];
    return line.slice(0, i) + (c === c.toUpperCase() ? r.toUpperCase() : r) + line.slice(i + 1);
  }
  const ROSTER = {}, usedNums = new Set();   // monkey -> typewriter, fixed for this session
  function typewriterOf(name) { if (!ROSTER[name]) { let n; do n = 1 + rnd(10000); while (usedNums.has(n)); usedNums.add(n); ROSTER[name] = n; } return ROSTER[name]; }
  let bag = [];
  function nextLine() { const L = TT("monkeys.lines", LINES); if (!bag.length || bag.some(i => i >= L.length)) { bag = L.map((_, i) => i); for (let i = bag.length - 1; i > 0; i--) { const j = rnd(i + 1); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return L[bag.pop()]; }
  const MK = { name: "", num: 0, text: "", line: null, lineStart: 0, typed: 0, hitAt: 0, keys: 0, cps: 7.4, chanAt: 0, connecting: 0, seen: new Set(), shownAt: 0, nextHit: 0, endedAt: -1e12 };
  function pickMonkey() {
    const ALL = TT("monkeys.names", MONKEYS);
    let pool = ALL.filter(m => !MK.seen.has(m) && m !== MK.name); if (!pool.length) { MK.seen.clear(); pool = ALL.filter(m => m !== MK.name); }
    const name = pool[rnd(pool.length)]; MK.seen.add(name); return name;
  }
  function switchChannel() {   // flicker "connecting", then a new monkey at its own typewriter
    const name = pickMonkey(), num = typewriterOf(name);
    MK.connecting = 18; MK.pending = [name, num]; MK.text = ""; MK.line = null;
    const lab = $("mklab"); if (lab) { lab.textContent = PL("monkeys.connecting", "Connecting to typewriter {n}…", { n: fmtN(num) }); lab.classList.add("conn"); }
    const f = $("mkfeed"); if (f) f.textContent = "";
  }
  function monkeyCard() {
    MK.shownAt = Date.now(); MK.nextHit = MK.shownAt + (Q.get("hamlet") ? 6000 : 4 * 60000); MK.seen.clear();
    setTimeout(switchChannel, 50);
    const R = (k, id) => `<div class="mkr"><span>${k}</span><b id="${id}">—</b></div>`;
    return `<div class="mk">
      <div class="mkh"><span>${esc(window.T ? T("alm.monkeys", MONKEY_TITLE) : MONKEY_TITLE)}</span><i class="mkrec">${esc(TT("monkeys.live", "● LIVE"))}</i></div>
      <div class="mkstrip">${R(esc(TT("monkeys.typewriter", "Typewriter")), "mkn")}${R(esc(TT("monkeys.subject", "Subject")), "mks")}${R(esc(TT("monkeys.keystrokes", "Keystrokes")), "mkk")}${R(esc(TT("monkeys.cps", "Chars / sec")), "mkc")}${R(esc(TT("monkeys.time", "Trial time")), "mkt")}</div>
      <div class="mkscreen"><div class="mklab" id="mklab"></div><div class="mkfeed" id="mkfeed"></div></div></div>`;
  }
  function monkeyPaint() {
    const el = $("mkfeed"); if (!el) return;
    if (MK.line) { const s = Math.max(0, MK.lineStart), e = MK.lineStart + MK.typed; el.innerHTML = esc(MK.text.slice(0, s)) + `<span class="${MK.hitAt && Date.now() - MK.hitAt > 180000 ? "" : "hit"}">${esc(MK.text.slice(s, e))}</span>` + esc(MK.text.slice(e)); }
    else el.textContent = MK.text;
  }
  function monkeyStrip() {
    if (!$("mkn")) return;
    const t = Math.floor((Date.now() - MK.shownAt) / 1000), hh = String(Math.floor(t / 3600)).padStart(2, "0"), mm = String(Math.floor(t / 60) % 60).padStart(2, "0"), ss = String(t % 60).padStart(2, "0");
    MK.cps = Math.max(5.1, Math.min(9.8, MK.cps + (Math.random() - .5) * .6));
    $("mkn").textContent = MK.num ? fmtN(MK.num) : "—"; $("mks").textContent = MK.name || "—"; $("mkk").textContent = fmtN(MK.keys);
    $("mkc").textContent = MK.connecting ? "0.0" : MK.cps.toFixed(1); $("mkt").textContent = `T+${hh}:${mm}:${ss}`;
  }
  function monkeyTick() {
    if (!$("mkfeed")) return;
    if (MK.connecting > 0) {
      if (--MK.connecting === 0) { [MK.name, MK.num] = MK.pending; MK.chanAt = Date.now(); MK.hitAt = 0;
        // the monkey has been at it a while: arrive on a full page of its earlier typing, never a blank screen
        let back = ""; while (back.length < 1500) back += KEYS[rnd(KEYS.length)];
        MK.text = back; MK.keys = 20000 + rnd(400000);
        const lab = $("mklab"); lab.classList.remove("conn"); lab.textContent = PL("monkeys.input", "Live input · Typewriter {n} · {name}", { n: fmtN(MK.num), name: MK.name }); }
      return;
    }
    const now = Date.now();
    if (!MK.line && now >= MK.nextHit) {   // the moment: this monkey types a real line, one letter off
      MK.nextHit = now + 10 * 60000; MK.line = oneWrong(nextLine()); MK.text += MK.text && !MK.text.endsWith(" ") ? " " : ""; MK.lineStart = MK.text.length; MK.typed = 0; MK.hitAt = 0;
    }
    let add = "";
    if (MK.line && MK.typed < MK.line.length) { add = MK.line[MK.typed++]; if (MK.typed === MK.line.length) { MK.hitAt = now; add += " "; } }
    else { add = KEYS[rnd(KEYS.length)]; if (Math.random() < .3) add += KEYS[rnd(KEYS.length)]; }
    if (add) { MK.keys += add.length; MK.text += add; const cut = Math.max(0, MK.text.length - 1600); if (cut) { MK.text = MK.text.slice(cut); MK.lineStart -= cut; } }
    if (MK.line && MK.lineStart + MK.line.length <= 0) MK.line = null;
    if (now - MK.chanAt > 60000 && (!MK.line || (MK.hitAt && now - MK.hitAt > 45000))) return switchChannel();
    monkeyPaint();
  }
  setInterval(monkeyTick, 140); setInterval(monkeyStrip, 1000);

  /* ---------- Thanksgiving only: the Mamdani facial hair monitor (a joke; beard grows ~0.4 mm a day) ---------- */
  const BEARD_LOG = [["07:02", "Beard confirmed present."], ["08:15", "Overnight growth within normal limits."], ["09:30", "Parade coverage: beard visible, no change."],
    ["11:10", "No trim detected."], ["12:45", "Moustache and beard remain in agreement."], ["14:20", "Stuffing proximity: low."], ["15:35", "Gravy proximity: elevated. Monitoring."],
    ["16:50", "Cranberry incident ruled out."], ["18:05", "Post-dinner beard integrity: holding."], ["19:40", "Pie crumb sweep recommended."], ["21:15", "No change. Watch continues tomorrow."]];
  function beardCard() {
    const R = (k, id, v = "—") => `<div class="mkr"><span>${k}</span><b id="${id}">${v}</b></div>`;
    const days = Math.floor((Date.parse(isoToday()) - Date.parse("2026-01-01")) / 864e5) + 1;
    setTimeout(beardTick, 30);
    return `<div class="mk">
      <div class="mkh"><span>${esc(TT("beard.title", "Mamdani Facial Hair Monitor"))}</span><i class="mkrec">${esc(TT("monkeys.live", "● LIVE"))}</i></div>
      <div class="mkstrip">${R("Subject", "bdS", "Mayor, NYC")}${R("Status", "bdT", "Beard")}${R("Coverage", "bdC", "100%")}${R("Days in office", "bdD", fmtN(days))}${R("Trim", "bdR", "None seen")}${R("Growth today", "bdG")}</div>
      <div class="mkscreen"><div class="mklab">${esc(TT("beard.feed", "Observation log · Thanksgiving"))}</div><div class="mkfeed" id="bdfeed"></div></div></div>`;
  }
  function beardTick() {
    const g = $("bdG"); if (!g) return;
    const p = {}; for (const x of new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    const secs = +p.hour * 3600 + +p.minute * 60 + +p.second, hm = `${p.hour}:${p.minute}`;
    g.textContent = (secs * 0.4 / 86400).toFixed(4) + "mm";
    const f = $("bdfeed"); if (f) { const L = BEARD_LOG.filter(r => r[0] <= hm).slice(-7).map(r => r.join("  ")); const s = (L.length ? L : ["Awaiting first observation."]).join("\n"); if (f.textContent !== s) f.textContent = s; }
  }
  setInterval(beardTick, 1000);

  /* ---------- the Almanac panel ---------- */
  const CARDS = { moon: moonCard, sky: skyCard, day: dayCard, river: riverCard, meteor: meteorCard, plant: plantCard, bird: birdCard, monkeys: monkeyCard };
  let ci = 0, lastName = null;
  function showCardNow() { if (lastName && $("almbody")) try { $("almbody").innerHTML = (lastName === "beard" ? beardCard : CARDS[lastName])(); } catch (e) {} }
  function showCard(force) {
    const box = $("almbody"); if (!box || !A) return;
    const tgOn = window.isTG && isTG(), names = (tgOn ? ["beard"] : []).concat(Object.keys(CARDS)), pin = typeof force === "string" ? force : Q.get("alm");
    const showing = box.dataset.card === "monkeys";
    const tg = window.isTG && isTG();   // Thanksgiving: the monkeys get a short turn, every three hours or so, so the Thanksgivings of yore have the room
    if (tg && MK.endedAt < 0) MK.endedAt = Date.now() - 120 * 60000;   // and not within the first hour after a load
    if (!pin && showing && Date.now() - MK.shownAt < (tg ? 10 : 20) * 60000) return;   // the monkeys get at least 20 minutes (10 on Thanksgiving)
    if (showing && !pin) MK.endedAt = Date.now();
    const ALL = Object.assign({ beard: beardCard }, CARDS);
    let name = ALL[pin] ? pin : names[ci++ % names.length];
    if (!pin && name === "monkeys" && Date.now() - MK.endedAt < (tg ? 180 : 40) * 60000) name = names[ci++ % names.length];
    box.classList.add("off");
    setTimeout(() => { lastName = name; try { box.innerHTML = ALL[name](); box.dataset.card = name; box.classList.toggle("pic", !!box.querySelector(".plate")); box.parentElement.classList.toggle("pic", !!box.querySelector(".plate")); } catch (e) { if (!pin) { box.classList.remove("off"); return showCard(); } } box.classList.remove("off"); }, 700);
  }

  /* ---------- a quirky countdown, a different one each day ---------- */
  function nextMD(md) { const t = isoToday(), y = +t.slice(0, 4); let iso = `${y}-${md}`; if (iso < t) iso = `${y + 1}-${md}`; return iso; }
  // the countdown templates come from the Family board note (DATA.copy.odd); {n} is shown bold, {s} is "s" unless n is 1
  const OD = (k, d, v = {}) => window.CH ? CH("odd." + k, d, v) : d.replace(/\{(\w+)\}/g, (m, x) => x in v ? v[x] : m);
  const B = n => `<b>${n}</b>`, S = n => n === 1 ? "" : "s";
  function oddLines() {
    const now = new Date(), t = isoToday(), y = +t.slice(0, 4), L = [];
    if (A) {
      const f = nextFull(now), fd = daysTo(isoIn(f.date, TZ));
      if (fd > 0) L.push(OD("moon", "{n} day{s} until the {moon} Moon is full", { n: B(fd), s: S(fd), moon: f.name }));
      const s = A.Seasons(y), s2 = A.Seasons(y + 1);
      const dec = isoIn(s.dec_solstice.date, TZ), jun = isoIn(s.jun_solstice.date, TZ) >= t ? isoIn(s.jun_solstice.date, TZ) : isoIn(s2.jun_solstice.date, TZ);
      const decN = dec >= t ? dec : isoIn(s2.dec_solstice.date, TZ);
      if (daysTo(decN) < daysTo(jun)) L.push(daysTo(decN) ? OD("winter", "{n} days until the winter solstice, and then the light starts coming back", { n: B(daysTo(decN)) }) : OD("winterDay", "The winter solstice: from tomorrow the days get longer"));
      else L.push(daysTo(jun) ? OD("summer", "{n} days of lengthening days left, until the summer solstice", { n: B(daysTo(jun)) }) : OD("summerDay", "The summer solstice: the longest day of the year"));
    }
    const bloom = daysTo(nextMD("06-16")); if (bloom) L.push(OD("bloomsday", "{n} days until Bloomsday", { n: B(bloom) }));
    const pets = [["07-27", "Hercules"], ["10-05", "Nimona"], ["07-01", "Buster & Lucille"]].map(([md, n]) => [daysTo(nextMD(md)), n]).sort((a, b) => a[0] - b[0])[0];
    if (pets[0]) L.push(OD("gotcha", "{n} days until {pet}’s next gotcha day", { n: B(pets[0]), pet: esc(pets[1]) }));
    const moon = nextMD("07-20"); L.push(OD("moonLanding", "{n} days until the {nth} anniversary of the first moon landing", { n: B(daysTo(moon)), nth: `${+moon.slice(0, 4) - 1969}th` }));
    let leap = y; while (!(leap % 4 === 0 && (leap % 100 !== 0 || leap % 400 === 0)) || `${leap}-02-29` < t) leap++;
    L.push(OD("leap", "{n} days until the next leap day, February 29, {year}", { n: B(daysTo(`${leap}-02-29`)), year: leap }));
    L.push(OD("halley", "{n} days until Halley’s Comet swings back round the Sun", { n: B(daysTo("2061-07-28").toLocaleString("en-US")) }));
    const xmas = daysTo(nextMD("12-25"));
    L.push(xmas === 0 ? OD("christmasDay", "Christmas: today") : OD("christmas", "{n} day{s} until Christmas", { n: B(xmas), s: S(xmas) }));
    return L;
  }
  function renderOdd() {
    const el = $("odd"); if (!el) return;
    if (window.isTG && isTG()) { el.innerHTML = W("thanksgiving.today", "Thanksgiving: today"); el.hidden = false; return; }
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
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    el.textContent = `${row("ref.gaDays", wd, GA_DAYS[wd])}, ${d} ${row("ref.gaMonths", m - 1, GA_MONTHS[m - 1])}`;
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
      <g class="tk">${ticks}</g><text x="30" y="14" class="tl">${W("almw.tideDialHigh", "HIGH")}</text><text x="30" y="50" class="tl">${W("almw.tideDialLow", "LOW")}</text>
      <line x1="30" y1="30" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" class="needle"/><circle cx="30" cy="30" r="2.4" class="pin"/></svg>
      <div><div class="tt">${W("almw.tideTitle", "Dublin Bay tides")}</div>
      <div class="tv">${nh ? W("almw.tideHigh", "High water {time}", { time: `<b>${hm(nh.d, DUB)}</b>` }) : ""}${nh && nl ? " · " : ""}${nl ? W("almw.tideLow", "low {time}", { time: `<b>${hm(nl.d, DUB)}</b>` }) : ""}</div></div>`;
    el.hidden = false;
  }


  /* ---------- event banners: they show only when there's something to see ---------- */
  // Northern lights: NOAA SWPC's 3-day Kp forecast; at about 42°N aurora is plausible from Kp 6.
  let auroraKp = 0;
  async function checkAurora() {
    try {
      const r = await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"); if (!r.ok) return;
      const now = Date.now(), rows = await r.json();
      auroraKp = Math.max(0, ...rows.filter(x => x.observed !== "observed" && Date.parse(x.time_tag + "Z") > now - 3 * 3600000 && Date.parse(x.time_tag + "Z") < now + 24 * 3600000).map(x => +x.kp));
    } catch (e) {}
    renderBanner();
  }
  // The ISS: CelesTrak's orbit elements, propagated here with satellite.js. A pass counts when the station is
  // at least 10° up and in sunlight while the sky at Leeds is dark (Sun 6° below the horizon).
  let issTle = null, issTleAt = 0, issPass = null;
  async function checkISS() {
    if (!window.satellite || !A) return;
    try {
      if (!issTle || Date.now() - issTleAt > 12 * 3600000) {
        const r = await fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE"); if (!r.ok) return;
        const l = (await r.text()).trim().split(/\r?\n/); if (l.length < 3) return;
        issTle = satellite.twoline2satrec(l[1].trim(), l[2].trim()); issTleAt = Date.now();
      }
      const gd = { latitude: satellite.degreesToRadians(PO.lat), longitude: satellite.degreesToRadians(PO.lon), height: .07 };
      const start = Date.now() - 10 * 60000, passes = []; let cur = null;
      for (let t = start; t < start + 16 * 3600000; t += 20000) {
        const d = new Date(t), pv = satellite.propagate(issTle, d); if (!pv.position) continue;
        const look = satellite.ecfToLookAngles(gd, satellite.eciToEcf(pv.position, satellite.gstime(d)));
        const el = look.elevation * 180 / Math.PI;
        let vis = false;
        if (el >= 10 && A.Horizon(d, OBS, ...(() => { const e = A.Equator(A.Body.Sun, d, OBS, true, true); return [e.ra, e.dec]; })(), "normal").altitude < -6) {
          const sv = A.GeoVector(A.Body.Sun, d, true), n = Math.hypot(sv.x, sv.y, sv.z), su = [sv.x / n, sv.y / n, sv.z / n];
          const p = pv.position, dot = p.x * su[0] + p.y * su[1] + p.z * su[2];
          const perp = Math.hypot(p.x - dot * su[0], p.y - dot * su[1], p.z - dot * su[2]);
          vis = !(dot < 0 && perp < 6371);
        }
        const az = look.azimuth * 180 / Math.PI;
        if (vis) { if (!cur) cur = { start: d, startAz: az, max: el }; cur.end = d; cur.endAz = az; cur.max = Math.max(cur.max, el); }
        else if (cur) { passes.push(cur); cur = null; }
      }
      if (cur) passes.push(cur);
      issPass = passes.find(p => p.end > Date.now() && p.max >= 20) || null;
    } catch (e) {}
    renderBanner();
  }
  const DIR16 = ["north", "north-northeast", "northeast", "east-northeast", "east", "east-southeast", "southeast", "south-southeast", "south", "south-southwest", "southwest", "west-southwest", "west", "west-northwest", "northwest", "north-northwest"];
  const dir16 = a => DIR16[Math.round(((a % 360) + 360) % 360 / 22.5) % 16];
  function renderBanner() {
    const el = $("skybanner"); if (!el) return;
    const force = Q.get("banner"), parts = [];
    const hmNow = fmt(new Date(), TZ, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    if ((window.isTG && isTG() && hmNow >= "08:30" && hmNow < "12:00") || force === "parade") parts.push(window.CH ? CH("thanksgiving.parade", "*The parade is on.*", {}, "b") : "<b>The parade is on.</b>");
    const SB = (k, d, v) => window.CH ? CH("sky." + k, d, v, "b") : d.replace(/\*([^*]+)\*/g, "<b>$1</b>").replace(/\{(\w+)\}/g, (m, x) => v[x]);
    if (auroraKp >= 6 || force === "aurora") parts.push(SB("aurora", "*Northern lights possible tonight.* NOAA forecasts a Kp of {kp}; look low to the north after dark.", { kp: force === "aurora" ? "6.7" : auroraKp.toFixed(1) }));
    const p = issPass || (force === "iss" ? { start: new Date(Date.now() + 3600000), end: new Date(Date.now() + 3600000 + 300000), startAz: 300, endAz: 120, max: 54 } : null);
    if (p) {
      const mins = Math.max(1, Math.round((p.end - p.start) / 60000));
      parts.push(SB("iss", "*Look up: the ISS passes over at {time}*, from the {from} to the {to}, {mins} minute{s}, up to {height}° high.", { time: hm(p.start), from: dir16(p.startAz), to: dir16(p.endAz), mins, s: mins > 1 ? "s" : "", height: Math.round(p.max) }));
    }
    el.innerHTML = parts.join("<br>"); el.hidden = !parts.length;
  }

  function daily() { renderOdd(); renderGa(); }
  daily(); renderTide(); loadRiver().catch(() => {}); showCard(); checkAurora(); checkISS();
  document.addEventListener("copy", () => { renderOdd(); renderGa(); renderTide(); renderBanner(); showCardNow(); });
  setInterval(checkAurora, 3 * 3600000); setInterval(checkISS, 30 * 60000); setInterval(renderBanner, 5 * 60000);   // the parade banner comes and goes
  let lastDay = isoToday();
  setInterval(() => { if (isoToday() !== lastDay) { lastDay = isoToday(); daily(); } renderTide(); }, 5 * 60000);
  setInterval(showCard, 3 * 60000);
  if (Q.get("hamlet")) setTimeout(() => showCard("monkeys"), 1500);   // ?hamlet=1: bring the monkeys up and strike after a few seconds
  setTimeout(renderTide, 15000);   // once the encrypted data has loaded
})();
