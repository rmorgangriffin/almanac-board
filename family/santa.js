/* Santa's Christmas Eve run, worked out on the board itself (no feed, so it can't fail and needs no network).
   Santa follows midnight west around the world: he reaches each place at its local midnight on Christmas Eve,
   starting at UTC+14 (5am Eastern on the 24th) and finishing at UTC-11 (6am Eastern on the 25th).
   Offsets are December's (southern-hemisphere summer time where they keep it).
   SANTA.at(ms) -> { phase: "before" | "flying" | "home", city, region, next, nextRegion, nextAt, homes, lat, lng }
   ?santat=19:05 (Eastern, on the board's date) previews a moment. */
(function () {
  // [UTC offset in hours, place, region, lat, lng]; within one offset, listed east to west
  const STOPS = [
    [14, "Kiritimati", "Kiribati", 1.9, -157.4],
    [13, "Nukuʻalofa", "Tonga", -21.1, -175.2], [13, "Auckland", "New Zealand", -36.8, 174.8], [13, "Apia", "Samoa", -13.8, -171.8],
    [12, "Suva", "Fiji", -18.1, 178.4], [12, "Tarawa", "Kiribati", 1.4, 173.0],
    [11, "Sydney", "Australia", -33.9, 151.2], [11, "Melbourne", "Australia", -37.8, 145.0], [11, "Hobart", "Tasmania", -42.9, 147.3], [11, "Honiara", "Solomon Islands", -9.4, 160.0],
    [10.5, "Adelaide", "Australia", -34.9, 138.6],
    [10, "Brisbane", "Australia", -27.5, 153.0], [10, "Port Moresby", "Papua New Guinea", -9.4, 147.2], [10, "Guam", "Mariana Islands", 13.4, 144.8],
    [9.5, "Darwin", "Australia", -12.5, 130.8],
    [9, "Sapporo", "Japan", 43.1, 141.4], [9, "Tokyo", "Japan", 35.7, 139.7], [9, "Osaka", "Japan", 34.7, 135.5], [9, "Seoul", "South Korea", 37.6, 127.0],
    [8, "Shanghai", "China", 31.2, 121.5], [8, "Taipei", "Taiwan", 25.0, 121.6], [8, "Manila", "Philippines", 14.6, 121.0], [8, "Beijing", "China", 39.9, 116.4],
    [8, "Hong Kong", "China", 22.3, 114.2], [8, "Perth", "Australia", -31.9, 115.9], [8, "Singapore", "Singapore", 1.35, 103.8],
    [7, "Hanoi", "Vietnam", 21.0, 105.8], [7, "Jakarta", "Indonesia", -6.2, 106.8], [7, "Bangkok", "Thailand", 13.8, 100.5],
    [6.5, "Yangon", "Myanmar", 16.8, 96.2],
    [6, "Dhaka", "Bangladesh", 23.8, 90.4], [6, "Almaty", "Kazakhstan", 43.2, 76.9],
    [5.75, "Kathmandu", "Nepal", 27.7, 85.3],
    [5.5, "Kolkata", "India", 22.6, 88.4], [5.5, "Chennai", "India", 13.1, 80.3], [5.5, "Delhi", "India", 28.6, 77.2], [5.5, "Colombo", "Sri Lanka", 6.9, 79.9], [5.5, "Mumbai", "India", 19.1, 72.9],
    [5, "Tashkent", "Uzbekistan", 41.3, 69.3], [5, "Lahore", "Pakistan", 31.5, 74.3], [5, "Karachi", "Pakistan", 24.9, 67.0], [5, "Malé", "Maldives", 4.2, 73.5],
    [4.5, "Kabul", "Afghanistan", 34.5, 69.2],
    [4, "Dubai", "United Arab Emirates", 25.2, 55.3], [4, "Tbilisi", "Georgia", 41.7, 44.8], [4, "Mauritius", "Indian Ocean", -20.2, 57.5],
    [3.5, "Tehran", "Iran", 35.7, 51.4],
    [3, "Moscow", "Russia", 55.8, 37.6], [3, "Nairobi", "Kenya", -1.3, 36.8], [3, "Addis Ababa", "Ethiopia", 9.0, 38.7], [3, "Riyadh", "Saudi Arabia", 24.7, 46.7], [3, "Istanbul", "Türkiye", 41.0, 29.0],
    [2, "Helsinki", "Finland", 60.2, 24.9], [2, "Cairo", "Egypt", 30.0, 31.2], [2, "Bethlehem", "West Bank", 31.7, 35.2], [2, "Athens", "Greece", 38.0, 23.7], [2, "Johannesburg", "South Africa", -26.2, 28.0], [2, "Cape Town", "South Africa", -33.9, 18.4],
    [1, "Stockholm", "Sweden", 59.3, 18.1], [1, "Vienna", "Austria", 48.2, 16.4], [1, "Rome", "Italy", 41.9, 12.5], [1, "Berlin", "Germany", 52.5, 13.4], [1, "Oslo", "Norway", 59.9, 10.8],
    [1, "Lagos", "Nigeria", 6.5, 3.4], [1, "Paris", "France", 48.9, 2.35], [1, "Madrid", "Spain", 40.4, -3.7],
    [0, "London", "England", 51.5, -0.13], [0, "Accra", "Ghana", 5.6, -0.2], [0, "Cardiff", "Wales", 51.5, -3.2], [0, "Belfast", "Northern Ireland", 54.6, -5.9],
    [0, "Dublin", "Ireland", 53.35, -6.26], [0, "Lisbon", "Portugal", 38.7, -9.1], [0, "Galway", "Ireland", 53.3, -9.05], [0, "Reykjavík", "Iceland", 64.1, -21.9],
    [-1, "Praia", "Cape Verde", 14.9, -23.5], [-1, "the Azores", "Portugal", 37.7, -25.7],
    [-2, "Nuuk", "Greenland", 64.2, -51.7], [-2, "South Georgia", "South Atlantic", -54.3, -36.5],
    [-3, "Recife", "Brazil", -8.05, -34.9], [-3, "Rio de Janeiro", "Brazil", -22.9, -43.2], [-3, "São Paulo", "Brazil", -23.6, -46.6], [-3, "Montevideo", "Uruguay", -34.9, -56.2], [-3, "Buenos Aires", "Argentina", -34.6, -58.4], [-3, "Santiago", "Chile", -33.4, -70.7],
    [-3.5, "St. John's", "Newfoundland", 47.6, -52.7],
    [-4, "Halifax", "Nova Scotia", 44.6, -63.6], [-4, "San Juan", "Puerto Rico", 18.5, -66.1], [-4, "Caracas", "Venezuela", 10.5, -66.9], [-4, "La Paz", "Bolivia", -16.5, -68.1],
    [-5, "Boston", "Massachusetts", 42.36, -71.06], [-5, "Leeds", "Massachusetts", 42.355, -72.703], [-5, "New York", "New York", 40.7, -74.0], [-5, "Toronto", "Ontario", 43.7, -79.4],
    [-5, "Havana", "Cuba", 23.1, -82.4], [-5, "Bogotá", "Colombia", 4.7, -74.1], [-5, "Lima", "Peru", -12.0, -77.0],
    [-6, "Chicago", "Illinois", 41.9, -87.6], [-6, "New Orleans", "Louisiana", 30.0, -90.1], [-6, "Mexico City", "Mexico", 19.4, -99.1], [-6, "Winnipeg", "Manitoba", 49.9, -97.1],
    [-7, "Denver", "Colorado", 39.7, -105.0], [-7, "Phoenix", "Arizona", 33.4, -112.1], [-7, "Calgary", "Alberta", 51.0, -114.1],
    [-8, "Vancouver", "British Columbia", 49.3, -123.1], [-8, "San Francisco", "California", 37.8, -122.4], [-8, "Los Angeles", "California", 34.05, -118.2],
    [-9, "Anchorage", "Alaska", 61.2, -149.9],
    [-10, "Honolulu", "Hawaii", 21.3, -157.9],
    [-11, "Pago Pago", "American Samoa", -14.3, -170.7],
  ];
  // people (in millions) living at each offset, roughly; homes = people / 3.5
  const POP = { 14: 0.1, 13: 6, 12: 2, 11: 30, 10.5: 2, 10: 45, 9.5: 0.3, 9: 240, 8: 1720, 7: 520, 6.5: 55, 6: 220, 5.75: 31, 5.5: 1470, 5: 300, 4.5: 42, 4: 60, 3.5: 90,
    3: 560, 2: 460, 1: 560, 0: 260, "-1": 1, "-2": 0.1, "-3": 260, "-3.5": 0.5, "-4": 75, "-5": 260, "-6": 200, "-7": 35, "-8": 60, "-9": 1, "-10": 1.5, "-11": 0.1 };
  const OFFS = [...new Set(STOPS.map(s => s[0]))];   // already east to west
  const Q = new URLSearchParams(location.search);

  function eveUTC(ms) {   // midnight UTC that starts Dec 25 of the Christmas this moment belongs to
    const y = new Date(ms - 11 * 36e5).getUTCFullYear();   // Christmas morning stays on the right side of New Year
    return Date.UTC(y, 11, 25);
  }
  function plan(ms) {
    const base = eveUTC(ms), out = [];
    for (const o of OFFS) {
      const here = STOPS.filter(s => s[0] === o), t0 = base - o * 36e5;   // local midnight at this offset
      here.forEach((s, i) => out.push({ at: t0 + i * (50 / here.length) * 6e4, off: o, city: s[1], region: s[2], lat: s[3], lng: s[4] }));
    }
    return out;
  }
  function homes(ms) {
    const base = eveUTC(ms); let tot = 0;
    for (const o of OFFS) {
      const t0 = base - o * 36e5, p = POP[o] || 0;
      if (ms >= t0 + 36e5) tot += p; else if (ms > t0) tot += p * (ms - t0) / 36e5;
    }
    return tot * 1e6 / 3.5;
  }
  function at(ms) {
    const P = plan(ms), first = P[0], last = P[P.length - 1];
    if (ms < first.at) return { phase: "before", takeoff: first.at, next: first.city, nextRegion: first.region, nextAt: first.at, homes: 0, lat: 84.6, lng: 168 };
    if (ms >= last.at + 50 * 6e4) return { phase: "home", homes: homes(ms), lat: 84.6, lng: 168 };
    let i = 0; while (i + 1 < P.length && P[i + 1].at <= ms) i++;
    const s = P[i], n = P[i + 1];
    return { phase: "flying", city: s.city, region: s.region, lat: s.lat, lng: s.lng, next: n ? n.city : "the North Pole", nextRegion: n ? n.region : "", nextAt: n ? n.at : last.at + 50 * 6e4, homes: homes(ms) };
  }
  function cityAt(name, ms) { const s = plan(ms).find(p => p.city === name); return s ? s.at : null; }
  // "now", honouring ?date=YYYY-MM-DD and ?santat=HH:MM (Eastern; EST is UTC-5 all December)
  function now() {
    const d = Q.get("date"), t = Q.get("santat");
    if (!d && !t) return Date.now();
    const p = {}; for (const x of new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date())) p[x.type] = x.value;
    const [Y, M, D] = (d || `${p.year}-${p.month}-${p.day}`).split("-").map(Number), [h, m] = (t || `${p.hour}:${p.minute}`).split(":").map(Number);
    return Date.UTC(Y, M - 1, D, h + 5, m, t ? 0 : +p.second);
  }
  // the card shows from 6am Eastern on Dec 24 to 3am on Dec 25 (?santa=1 forces it on)
  function live(ms) { const base = eveUTC(ms); return Q.get("santa") === "1" || (ms >= base - 13 * 36e5 && ms < base + 8 * 36e5); }
  window.SANTA = { at, cityAt, now, live, stops: STOPS };
})();
