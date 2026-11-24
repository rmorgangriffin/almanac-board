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
  function phaseName(a) {   // [English, short, Latin]
    if (a < 8 || a > 352) return ["New moon", "New", "Novilunium"];
    if (a < 84) return ["Waxing crescent", "Young crescent", "Luna crescens"];
    if (a < 96) return ["First quarter", "First quarter", "Luna dimidiata"];
    if (a < 172) return ["Waxing gibbous", "Waxing gibbous", "Luna gibbosa"];
    if (a < 188) return ["Full moon", "Full", "Plenilunium"];
    if (a < 264) return ["Waning gibbous", "Waning gibbous", "Luna gibbosa"];
    if (a < 276) return ["Last quarter", "Last quarter", "Luna dimidiata"];
    return ["Waning crescent", "Old crescent", "Luna decrescens"];
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
  const face = (ang, size, cls = "") => `<svg class="${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><image href="../img/moon-lro.webp" x="2" y="2" width="96" height="96"/><path d="${shadow(ang, 50, 50, 48)}" fill="rgba(12,8,4,.86)"/><circle cx="50" cy="50" r="48.5" fill="none" class="ink"/></svg>`;
  function moonCard() {
    const now = new Date(), ang = A.MoonPhase(now), age = ang / 360 * 29.530588;
    const lit = Math.round(A.Illumination(A.Body.Moon, now).phase_fraction * 100);
    const [en, , la] = phaseName(ang), f = nextFull(now), nw = A.SearchMoonPhase(0, now, 40).date;
    const strip = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getTime() + i * 3.69 * DAY), a = A.MoonPhase(d);
      return `<div class="mc${i ? "" : " on"}">${face(a, 30)}<div class="md">${i ? fmt(d, TZ, { month: "short", day: "numeric" }) : "Tonight"}</div><div class="mp">${phaseName(a)[1]}</div></div>`;
    }).join("");
    return `<div class="alm-k">The Moon</div>
      <div class="moonrow">${face(ang, 112, "big")}<div class="mtxt"><div class="alm-t">${en}</div><div class="alm-la">${la}</div>
        <div class="alm-s">${age.toFixed(1)} days old · ${lit}% lit</div></div></div>
      <div class="mstrip">${strip}</div>
      <div class="alm-s">Full moon ${dmy(f.date)} (the ${f.name} Moon) · New moon ${dmy(nw)}</div>
      <div class="alm-c">Lunar Reconnaissance Orbiter photo, NASA · public domain</div>`;
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
    return `<div class="alm-k">Daylight</div>
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


  /* ---------- tonight's sky: the constellation highest at 9 pm, on Hevelius's plate, and the planets ---------- */
  const CONST = [["uma", "Ursa Major", "the Great Bear", 11.0, 50], ["cvn", "Canes Venatici", "the Hunting Dogs", 13.0, 40], ["crb", "Corona Borealis", "the Northern Crown", 15.8, 32],
    ["her", "Hercules", "the strongman", 17.4, 27], ["lyr", "Lyra", "the Lyre", 18.8, 36], ["cyg", "Cygnus", "the Swan", 20.6, 42], ["del", "Delphinus", "the Dolphin", 20.7, 12],
    ["lac", "Lacerta", "the Lizard", 22.5, 46], ["peg", "Pegasus", "the Winged Horse", 22.7, 20], ["and", "Andromeda", "the Chained Princess", 0.8, 38], ["cas", "Cassiopeia", "the Queen", 1.0, 62],
    ["tri", "Triangulum", "the Triangle", 2.1, 32], ["per", "Perseus", "the Hero", 3.2, 45], ["ori", "Orion", "the Hunter", 5.6, 5], ["lyn", "Lynx", "the Lynx", 7.9, 47],
    ["cnc", "Cancer", "the Crab", 8.6, 20], ["lmi", "Leo Minor", "the Little Lion", 10.2, 33], ["leo", "Leo", "the Lion", 10.7, 13]];
  const DIRS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const where = h => h.altitude > 75 ? "overhead" : `${h.altitude < 20 ? "low in the" : h.altitude < 50 ? "in the" : "high in the"} ${DIRS[Math.round(h.azimuth / 45) % 8]}`;
  function tonight9() { const m = midnight(isoToday()); return new Date(m.getTime() + 21 * 3600000); }
  function skyCard() {
    const t = tonight9();
    const best = CONST.map(c => [c, A.Horizon(t, OBS, c[3], c[4], "normal")]).sort((a, b) => b[1].altitude - a[1].altitude)[0];
    const [k, la, en] = best[0];
    const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"].map(n => {
      const eq = A.Equator(A.Body[n], t, OBS, true, true), h = A.Horizon(t, OBS, eq.ra, eq.dec, "normal");
      return h.altitude > 5 ? `${n} ${where(h)}` : null;
    }).filter(Boolean);
    return `<div class="alm-k">Tonight's Sky</div>
      <img class="plate" src="../img/sky/${k}.jpg" alt="">
      <div class="alm-t">${la}, ${en}</div>
      <div class="alm-s">${where(best[1]).replace(/^./, c => c.toUpperCase())} at 9 pm</div>
      <div class="alm-s">${planets.length ? planets.join(" · ") : "No bright planets up at 9 pm"}</div>
      <div class="alm-c">Johannes Hevelius, Uranographia, 1690 (drawn as on a globe, so mirrored) · public domain</div>`;
  }


  /* ---------- the Connecticut River, from the USGS gauge at Holyoke (and the Mill River, which runs through Leeds) ---------- */
  let RIVER = null, riverAt = 0;
  async function loadRiver() {
    if (RIVER && Date.now() - riverAt < 30 * 60000) return RIVER;
    const r = await fetch("https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01172010,01171500&parameterCd=00060,00065&period=P7D");
    if (!r.ok) throw new Error("usgs");
    const d = await r.json(), out = {};
    for (const t of d.value.timeSeries) {
      const site = t.sourceInfo.siteCode[0].value, v = t.variable.variableCode[0].value;
      out[site + ":" + v] = t.values[0].value.filter(x => +x.value > -999).map(x => [Date.parse(x.dateTime), +x.value]);
    }
    RIVER = out; riverAt = Date.now(); return out;
  }
  function riverCard() {
    const R = RIVER; if (!R) { loadRiver().then(showCardNow).catch(() => {}); throw new Error("no river yet"); }
    const q = R["01172010:00060"] || [], h = R["01172010:00065"] || [], mill = R["01171500:00060"] || [];
    if (!q.length) throw new Error("no flow");
    const last = q[q.length - 1], dayAgo = q.find(x => x[0] >= last[0] - DAY) || q[0];
    const ch = (last[1] - dayAgo[1]) / dayAgo[1], trend = ch > .05 ? "rising" : ch < -.05 ? "falling" : "steady";
    const W = 300, H = 90, P = 6, lo = Math.min(...q.map(x => x[1])), hi = Math.max(...q.map(x => x[1]));
    const X = t => P + (t - q[0][0]) / (last[0] - q[0][0]) * (W - 2 * P), Y = v => H - 16 - (v - lo) / ((hi - lo) || 1) * (H - 30);
    const step = Math.max(1, Math.floor(q.length / 120));
    let d = ""; q.filter((_, i) => i % step === 0 || i === q.length - 1).forEach((x, i) => d += (i ? "L" : "M") + X(x[0]).toFixed(1) + "," + Y(x[1]).toFixed(1));
    const days = Array.from({ length: 8 }, (_, i) => last[0] - i * DAY).filter(t => t >= q[0][0]).map(t => `<line class="rule" x1="${X(t)}" x2="${X(t)}" y1="6" y2="${H - 16}"/><text x="${X(t)}" y="${H - 5}" text-anchor="middle">${fmt(new Date(t), TZ, { weekday: "narrow" })}</text>`).join("");
    return `<div class="alm-k">The River</div>
      <div class="alm-t">The Connecticut at Holyoke</div>
      <svg class="alm-day" viewBox="0 0 ${W} ${H}" aria-hidden="true"><rect class="ink" x="${P}" y="6" width="${W - 2 * P}" height="${H - 22}" fill="none"/>${days}
        <path d="${d}L${X(last[0])},${H - 16}L${X(q[0][0])},${H - 16}Z" fill="url(#rhatch)" opacity=".5"/><path d="${d}" class="ink curve" fill="none"/>
        <defs><pattern id="rhatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" class="ink"/></pattern></defs>
        <circle class="hodie" cx="${X(last[0])}" cy="${Y(last[1])}" r="3"/></svg>
      <div class="alm-s"><b class="num">${Math.round(last[1]).toLocaleString("en-US")}</b> cubic feet a second, ${trend}${h.length ? ` · gauge ${h[h.length - 1][1].toFixed(1)} ft` : ""}</div>
      <div class="alm-s">Past week: ${Math.round(lo).toLocaleString("en-US")} to ${Math.round(hi).toLocaleString("en-US")} cfs</div>
      ${mill.length ? `<div class="alm-s">The Mill River at Northampton: ${Math.round(mill[mill.length - 1][1])} cfs</div>` : ""}
      <div class="alm-c">U.S. Geological Survey gauges 01172010 and 01171500 · provisional data</div>`;
  }

  /* ---------- shooting stars: the next major meteor shower (peak dates and rates after the IMO calendar) ---------- */
  const SHOWERS = [["01-03", "Quadrantids", "Boötes", 80, "Jan 3–4"], ["04-22", "Lyrids", "Lyra", 18, "Apr 21–22"], ["05-06", "Eta Aquariids", "Aquarius", 50, "May 5–6"],
    ["08-12", "Perseids", "Perseus", 100, "Aug 12–13"], ["10-21", "Orionids", "Orion", 20, "Oct 20–21"], ["11-17", "Leonids", "Leo", 15, "Nov 16–17"],
    ["12-14", "Geminids", "Gemini", 150, "Dec 13–14"], ["12-22", "Ursids", "Ursa Minor", 10, "Dec 21–22"]];
  function meteorCard() {
    const t = isoToday(), y = +t.slice(0, 4);
    const list = SHOWERS.map(s => { let iso = `${y}-${s[0]}`; if (iso < t) iso = `${y + 1}-${s[0]}`; return [iso, ...s.slice(1)]; }).sort((a, b) => a[0] < b[0] ? -1 : 1);
    const [iso, name, rad, zhr, nights] = list[0], n = daysTo(iso);
    const lit = Math.round(A.Illumination(A.Body.Moon, new Date(iso + "T08:00:00Z")).phase_fraction * 100);
    const moon = lit < 25 ? "a dark sky, with little moonlight" : lit < 60 ? `a ${lit}% moon, so some glare` : `a ${lit}% moon washing out the fainter ones`;
    return `<div class="alm-k">Shooting Stars</div>
      <img class="plate" src="../img/leonids-1833.jpg" alt="">
      <div class="alm-t">The ${name}</div>
      <div class="alm-s">${n === 0 ? "Peak tonight" : n === 1 ? "Peak tomorrow night" : `Peak in ${n} days`}: the nights of ${nights}</div>
      <div class="alm-s">Up to ${zhr} an hour from ${rad}, under ideal skies · ${moon}</div>
      <div class="alm-c">The great Leonid storm of 1833, engraving by Adolf Vollmy, 1889 · public domain</div>`;
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
    const p = [...PLANTS].reverse().find(x => week >= x[0]) || PLANTS[0];
    return `<div class="alm-k">In Season</div>
      <img class="plate" src="../img/bot/${p[1]}.jpg" alt="">
      <div class="alm-t">${p[2]}</div><div class="alm-la">${p[3]}</div>
      <div class="alm-s">${p[4]}</div>
      <div class="alm-c">${p[5]} · public domain</div>`;
  }

  /* ---------- the Almanac panel ---------- */
  const CARDS = { moon: moonCard, sky: skyCard, day: dayCard, river: riverCard, meteor: meteorCard, plant: plantCard };
  let ci = 0, lastName = null;
  function showCardNow() { if (lastName && $("almbody")) try { $("almbody").innerHTML = CARDS[lastName](); } catch (e) {} }
  function showCard() {
    const box = $("almbody"); if (!box || !A) return;
    const names = Object.keys(CARDS), pin = Q.get("alm");
    const name = CARDS[pin] ? pin : names[ci++ % names.length];
    box.classList.add("off");
    setTimeout(() => { lastName = name; try { box.innerHTML = CARDS[name](); box.dataset.card = name; } catch (e) { if (!pin) { box.classList.remove("off"); return showCard(); } } box.classList.remove("off"); }, 700);
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
    if (auroraKp >= 6 || force === "aurora") parts.push(`<b>Northern lights possible tonight.</b> NOAA forecasts a Kp of ${force === "aurora" ? "6.7" : auroraKp.toFixed(1)}; look low to the north after dark.`);
    const p = issPass || (force === "iss" ? { start: new Date(Date.now() + 3600000), end: new Date(Date.now() + 3600000 + 300000), startAz: 300, endAz: 120, max: 54 } : null);
    if (p) {
      const mins = Math.max(1, Math.round((p.end - p.start) / 60000));
      parts.push(`<b>Look up: the ISS passes over at ${hm(p.start)}</b>, from the ${dir16(p.startAz)} to the ${dir16(p.endAz)}, ${mins} minute${mins > 1 ? "s" : ""}, up to ${Math.round(p.max)}° high.`);
    }
    el.innerHTML = parts.join("<br>"); el.hidden = !parts.length;
  }

  function daily() { renderOdd(); renderGa(); }
  daily(); renderTide(); loadRiver().catch(() => {}); showCard(); checkAurora(); checkISS();
  setInterval(checkAurora, 3 * 3600000); setInterval(checkISS, 30 * 60000);
  let lastDay = isoToday();
  setInterval(() => { if (isoToday() !== lastDay) { lastDay = isoToday(); daily(); } renderTide(); }, 5 * 60000);
  setInterval(showCard, 3 * 60000);
  setTimeout(renderTide, 15000);   // once the encrypted data has loaded
})();
