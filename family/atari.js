/* Original self-playing games in the spirit of the Atari 2600/800, for the family board's arcade.
   Each game draws on a 160x90 canvas, plays itself, and keeps its own score line.
   game = { name, init() -> state, step(s), draw(x, s, C), score(s) -> text, over(s) -> bool }
   C(name) returns a theme colour: bg, line, fg, amber, sage, lilac. */
(function () {
  const W = 160, H = 90;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const bg = (x, C) => { x.fillStyle = C("bg"); x.fillRect(0, 0, W, H); };

  /* ---- Masonry: knock out the wall with a paddle and ball ---- */
  const masonry = {
    name: "Masonry",
    init() {
      const bricks = [];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) bricks.push({ x: 3 + c * 11, y: 10 + r * 5, r, on: true });
      return { bricks, px: W / 2, bx: W / 2, by: 60, vx: rnd(-1.2, 1.2) || .8, vy: -1.6, pts: 0, balls: 3, wall: 1, aim: 0 };
    },
    step(s) {
      s.bx += s.vx; s.by += s.vy;
      if (s.bx < 2 || s.bx > W - 2) s.vx *= -1;
      if (s.by < 2) s.vy = Math.abs(s.vy);
      for (const b of s.bricks) if (b.on && s.bx > b.x - 1 && s.bx < b.x + 11 && s.by > b.y - 1 && s.by < b.y + 5) {
        b.on = false; s.vy *= -1; s.pts += (5 - b.r) * 10; break;
      }
      // the computer chases the ball, aiming a little off-centre to angle it, and now and then misjudges
      if (s.vy > 0 && s.by > 50 && !s.aimed) { s.aim = Math.random() < .07 ? rnd(14, 20) * (Math.random() < .5 ? -1 : 1) : rnd(-4, 4); s.aimed = true; }
      if (s.vy < 0) s.aimed = false;
      s.px += clamp(s.bx + s.aim - s.px, -2.6, 2.6); s.px = clamp(s.px, 9, W - 9);
      if (s.vy > 0 && s.by >= H - 7 && s.by <= H - 4 && Math.abs(s.bx - s.px) < 10) { s.vy = -Math.abs(s.vy); s.vx = clamp((s.bx - s.px) * .22, -2.2, 2.2) || .4; }
      if (s.by > H + 3) { s.balls--; Object.assign(s, { bx: s.px, by: 60, vx: rnd(-1, 1) || .7, vy: -1.6 }); }
      if (!s.bricks.some(b => b.on)) { const n = masonry.init(); n.pts = s.pts; n.balls = s.balls; n.wall = s.wall + 1; n.vy = -1.6 - s.wall * .2; Object.assign(s, n); }
    },
    draw(x, s, C) {
      bg(x, C);
      const rows = [C("amber"), C("amber"), C("lilac"), C("sage"), C("sage")];
      for (const b of s.bricks) if (b.on) { x.fillStyle = rows[b.r]; x.fillRect(b.x, b.y, 10, 4); }
      x.fillStyle = C("fg"); x.fillRect(Math.round(s.px) - 9, H - 5, 18, 2); x.fillRect(Math.round(s.bx) - 1, Math.round(s.by) - 1, 2, 2);
    },
    score: s => `${s.pts} · ${"●".repeat(Math.max(0, s.balls))}`,
    over: s => s.balls <= 0,
  };

  /* ---- Soft Landing: bring the lander down gently on the pad ---- */
  function terrain() {
    const pts = [], pad = Math.floor(rnd(2, 11)) * 12;
    let y = rnd(60, 80);
    for (let i = 0; i <= W; i += 12) { if (i !== pad && i !== pad + 12) y = clamp(y + rnd(-14, 14), 48, 86); pts.push([i, y]); }
    const py = pts[pad / 12][1]; pts[pad / 12 + 1][1] = py;
    return { pts, pad, py };
  }
  const lander = {
    name: "Soft Landing",
    init() { return { ...terrain(), lx: rnd(20, 140), ly: 8, vx: rnd(-.5, .5), vy: 0, fuel: 100, burn: 0, side: 0, landed: 0, crashed: 0, wait: 0, msg: "" }; },
    step(s) {
      if (s.wait > 0) { if (--s.wait === 0) Object.assign(s, terrain(), { lx: rnd(20, 140), ly: 8, vx: rnd(-.6, .6), vy: 0, fuel: Math.min(100, s.fuel + 40), msg: "" }); return; }
      const target = s.pad + 12, dx = target - s.lx, height = s.py - s.ly;
      s.side = Math.abs(dx) > 2 ? Math.sign(dx) * (Math.abs(s.vx) < Math.min(1, Math.abs(dx) / 30) || Math.sign(s.vx) !== Math.sign(dx) ? 1 : 0) : (Math.abs(s.vx) > .05 ? -Math.sign(s.vx) : 0);
      if (Math.abs(dx) < 3 && Math.abs(s.vx) > .1) s.side = -Math.sign(s.vx);
      const want = height > 30 ? .9 : height > 10 ? .45 : .22;
      s.burn = s.fuel > 0 && (s.vy > want + (s.jitter || 0) || (Math.abs(dx) > 14 && height < 22)) ? 1 : 0;
      if (Math.random() < .01) s.jitter = rnd(-.15, .35);
      s.vy += .02 - s.burn * .05; s.vx += s.side * .012;
      if (s.burn || s.side) s.fuel = Math.max(0, s.fuel - (s.burn ? .25 : .08));
      s.lx += s.vx; s.ly += s.vy;
      if (s.lx < 3 || s.lx > W - 3) { s.vx *= -.5; s.lx = clamp(s.lx, 3, W - 3); }
      const i = clamp(Math.floor(s.lx / 12), 0, s.pts.length - 2), [x0, y0] = s.pts[i], [x1, y1] = s.pts[i + 1];
      const ground = y0 + (y1 - y0) * (s.lx - x0) / 12;
      if (s.ly + 3 >= ground) {
        const onPad = s.lx > s.pad + 2 && s.lx < s.pad + 22;
        if (onPad && s.vy < .45 && Math.abs(s.vx) < .3) { s.landed++; s.msg = "THE EAGLE HAS LANDED"; } else { s.crashed++; s.msg = "CRATER"; }
        s.ly = ground - 3; s.burn = 0; s.side = 0; s.wait = 75;
      }
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); for (let i = 0; i < 18; i++) x.fillRect((i * 37) % W, (i * 23) % 40, 1, 1);
      x.strokeStyle = C("sage"); x.lineWidth = 1; x.beginPath(); s.pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke();
      x.fillStyle = C("amber"); x.fillRect(s.pad + 1, s.py - 1, 22, 2);
      const lx = Math.round(s.lx), ly = Math.round(s.ly);
      x.fillStyle = s.msg === "CRATER" ? C("amber") : C("fg");
      if (s.msg === "CRATER") { for (let k = 0; k < 6; k++) x.fillRect(lx + rnd(-6, 6), ly + rnd(-5, 2), 2, 2); }
      else { x.fillRect(lx - 2, ly - 3, 5, 4); x.fillRect(lx - 3, ly + 1, 1, 2); x.fillRect(lx + 3, ly + 1, 1, 2); }
      if (s.burn) { x.fillStyle = C("amber"); x.fillRect(lx, ly + 1, 1, 2 + Math.floor(Math.random() * 3)); }
      if (s.side) { x.fillStyle = C("amber"); x.fillRect(lx - s.side * 4, ly - 2, 1, 1); }
      x.fillStyle = C("line"); x.fillRect(2, 2, 30, 2); x.fillStyle = C("sage"); x.fillRect(2, 2, 30 * s.fuel / 100, 2);
      if (s.msg) { x.fillStyle = C("fg"); x.font = "6px monospace"; x.textAlign = "center"; x.fillText(s.msg, W / 2, 20); x.textAlign = "left"; }
    },
    score: s => `${s.landed} landed · ${s.crashed} lost`,
    over: s => s.landed + s.crashed >= 12,
  };

  /* ---- Goose Patrol: a V of geese crosses the sky; the cannon at the pond tries to tag them with snowballs ---- */
  const geese = {
    name: "Goose Patrol",
    init() { return { cx: W / 2, flock: null, balls: [], cool: 0, tagged: 0, passed: 0, wave: 0, feathers: [] }; },
    newFlock(s) {
      const n = 5 + (s.wave % 3) * 2, dir = s.wave % 2 ? -1 : 1, y0 = rnd(12, 30), birds = [];
      for (let i = 0; i < n; i++) { const k = Math.ceil(i / 2) * (i % 2 ? 1 : -1); birds.push({ ox: -Math.abs(k) * 7, oy: k * 4, on: true }); }
      s.flock = { x: dir > 0 ? -10 : W + 10, y: y0, dir, v: .55 + s.wave * .04, birds, flap: 0 }; s.wave++;
    },
    step(s) {
      if (!s.flock) geese.newFlock(s);
      const f = s.flock; f.x += f.dir * f.v; f.flap++; f.y += Math.sin(f.flap / 20) * .15;
      const live = f.birds.filter(b => b.on);
      // aim at the lead goose that's still flying, leading the shot
      const tgt = live.sort((a, b) => b.ox - a.ox)[0];
      if (tgt) {
        const gx = f.x + f.dir * tgt.ox, gy = f.y + tgt.oy, t = (H - 8 - gy) / 2.6, lead = gx + f.dir * f.v * t + (s.miss || 0);
        s.cx += clamp(lead - s.cx, -1.6, 1.6); s.cx = clamp(s.cx, 6, W - 6);
        if (--s.cool <= 0 && Math.abs(lead - s.cx) < 4) { s.balls.push({ x: s.cx, y: H - 9 }); s.cool = rnd(18, 34); s.miss = Math.random() < .35 ? rnd(-9, 9) : 0; }
      }
      for (const b of s.balls) {
        b.y -= 2.6;
        for (const g of f.birds) if (g.on && Math.abs(b.x - (f.x + f.dir * g.ox)) < 3 && Math.abs(b.y - (f.y + g.oy)) < 3) {
          g.on = false; b.dead = true; s.tagged++;
          for (let k = 0; k < 5; k++) s.feathers.push({ x: b.x, y: b.y, vx: rnd(-.6, .6), vy: rnd(-.6, .2), life: 40 });
        }
        if (b.y < 0) b.dead = true;
      }
      s.balls = s.balls.filter(b => !b.dead);
      for (const p of s.feathers) { p.x += p.vx; p.y += p.vy; p.vy += .02; p.life--; }
      s.feathers = s.feathers.filter(p => p.life > 0);
      const gone = f.dir > 0 ? f.x - 60 > W : f.x + 60 < 0;
      if (gone || !live.length) { s.passed += f.birds.filter(b => b.on).length; s.flock = null; }
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); x.fillRect(0, H - 4, W, 4);
      x.fillStyle = C("sage"); for (let i = 4; i < W; i += 19) x.fillRect(i, H - 7, 1, 3);
      const f = s.flock;
      if (f) for (const g of f.birds) if (g.on) {
        const gx = Math.round(f.x + f.dir * g.ox), gy = Math.round(f.y + g.oy), up = (f.flap >> 3) & 1;
        x.fillStyle = C("fg"); x.fillRect(gx - 2, gy, 5, 1); x.fillRect(gx + f.dir * 3, gy - 1, 1, 1);
        x.fillRect(gx - 1, gy + (up ? -2 : 1), 1, 1); x.fillRect(gx + 1, gy + (up ? -2 : 1), 1, 1);
      }
      x.fillStyle = C("fg"); for (const p of s.feathers) x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      x.fillStyle = C("fg"); for (const b of s.balls) x.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
      x.fillStyle = C("amber"); x.fillRect(Math.round(s.cx) - 4, H - 8, 9, 4); x.fillRect(Math.round(s.cx) - 1, H - 11, 3, 3);
    },
    score: s => `${s.tagged} · ${s.passed} away`,
    over: s => s.wave > 10 && !s.flock,
  };

  /* ---- Light Trails: two riders leave walls behind them; the first to hit one loses the round ---- */
  const CELL = 2, GW = W / CELL, GH = H / CELL;
  const trails = {
    name: "Light Trails",
    init() { const s = { wins: [0, 0], round: 0 }; trails.reset(s); return s; },
    reset(s) {
      s.grid = new Uint8Array(GW * GH); s.wait = 0; s.loser = -1;
      s.r = [{ x: 15, y: GH >> 1, dx: 1, dy: 0, c: 1 }, { x: GW - 16, y: GH >> 1, dx: -1, dy: 0, c: 2 }];
      for (const r of s.r) s.grid[r.y * GW + r.x] = r.c;
    },
    free(s, x, y) { return x >= 0 && y >= 0 && x < GW && y < GH && !s.grid[y * GW + x]; },
    room(s, x, y, dx, dy) { let n = 0; while (n < 30 && trails.free(s, x + dx * (n + 1), y + dy * (n + 1))) n++; return n; },
    step(s) {
      if (s.wait > 0) { if (--s.wait === 0) trails.reset(s); return; }
      for (const r of s.r) {
        const ahead = trails.room(s, r.x, r.y, r.dx, r.dy);
        if (ahead < 3 + Math.random() * 3 || Math.random() < .03) {
          const opts = [[r.dy, -r.dx], [-r.dy, r.dx]].map(([dx, dy]) => [dx, dy, trails.room(s, r.x, r.y, dx, dy) + Math.random() * 4]);
          opts.sort((a, b) => b[2] - a[2]);
          if (opts[0][2] > ahead || ahead < 2) { r.dx = opts[0][0]; r.dy = opts[0][1]; }
        }
      }
      const dead = s.r.map(r => !trails.free(s, r.x + r.dx, r.y + r.dy));
      s.r.forEach((r, i) => { if (!dead[i]) { r.x += r.dx; r.y += r.dy; s.grid[r.y * GW + r.x] = r.c; } });
      if (dead[0] || dead[1]) { s.round++; if (dead[0] && !dead[1]) s.wins[1]++; else if (dead[1] && !dead[0]) s.wins[0]++; s.loser = dead[0] && dead[1] ? 2 : dead[0] ? 0 : 1; s.wait = 50; }
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); for (let i = 0; i < W; i += 16) x.fillRect(i, 0, 1, H); for (let j = 0; j < H; j += 16) x.fillRect(0, j, W, 1);
      const col = [null, C("amber"), C("lilac")];
      for (let y = 0; y < GH; y++) for (let xx = 0; xx < GW; xx++) { const v = s.grid[y * GW + xx]; if (v) { x.fillStyle = col[v]; x.fillRect(xx * CELL, y * CELL, CELL, CELL); } }
      s.r.forEach((r, i) => { x.fillStyle = s.wait && (s.loser === i || s.loser === 2) && (s.wait >> 2) & 1 ? C("bg") : C("fg"); x.fillRect(r.x * CELL - 1, r.y * CELL - 1, 4, 4); });
    },
    score: s => `${s.wins[0]} · ${s.wins[1]}`,
    over: s => Math.max(...s.wins) >= 7,
  };

  /* ---- Slalom: a skier threads the gates down the mountain against the clock ---- */
  const slalom = {
    name: "Slalom",
    init() { return { sx: W / 2, vx: 0, gates: [], trees: [], dist: 0, made: 0, missed: 0, runs: 0, next: 30, t: 0, best: null, runT: 0, fall: 0 }; },
    step(s) {
      s.t++; s.runT++;
      if (s.fall > 0) { s.fall--; return; }
      const speed = 1.1;
      for (const g of s.gates) g.y -= speed; for (const t of s.trees) t.y -= speed;
      if ((s.next -= speed) <= 0) {
        const gx = clamp((s.gates.length ? s.gates[s.gates.length - 1].x : W / 2) + rnd(-38, 38), 20, W - 20);
        s.gates.push({ x: gx, y: H + 4, w: 16, done: false, flag: s.made + s.missed & 1 }); s.next = rnd(26, 34);
        if (Math.random() < .7) s.trees.push({ x: Math.random() < .5 ? rnd(2, 14) : rnd(W - 14, W - 2), y: H + 8 });
      }
      const tgt = s.gates.find(g => !g.done && g.y > 14);
      if (tgt) { const want = tgt.x + (s.wobble || 0) - s.sx; s.vx += clamp(want * .02 - s.vx * .18, -.12, .12); if (Math.random() < .02) s.wobble = Math.random() < .25 ? rnd(-14, 14) : 0; }
      s.sx = clamp(s.sx + s.vx, 4, W - 4);
      for (const g of s.gates) if (!g.done && g.y <= 18) {
        g.done = true;
        if (Math.abs(s.sx - g.x) < g.w / 2) s.made++; else { s.missed++; if (Math.abs(s.sx - g.x) < g.w / 2 + 3) s.fall = 30; }
      }
      s.gates = s.gates.filter(g => g.y > -6); s.trees = s.trees.filter(t => t.y > -10);
      if (s.made + s.missed >= 20 * (s.runs + 1)) { s.runs++; }
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); for (let i = 0; i < 30; i++) x.fillRect((i * 53) % W, Math.floor((((i * 31 - s.t * 1.1) % H) + H) % H), 1, 1);
      for (const t of s.trees) { x.fillStyle = C("sage"); const tx = Math.round(t.x), ty = Math.round(t.y); x.fillRect(tx - 1, ty - 6, 2, 2); x.fillRect(tx - 2, ty - 4, 4, 2); x.fillRect(tx - 3, ty - 2, 6, 2); x.fillStyle = C("line"); x.fillRect(tx, ty, 1, 2); }
      for (const g of s.gates) { x.fillStyle = g.flag ? C("amber") : C("lilac"); const gy = Math.round(g.y); x.fillRect(Math.round(g.x - g.w / 2) - 1, gy - 5, 1, 6); x.fillRect(Math.round(g.x + g.w / 2), gy - 5, 1, 6); x.fillRect(Math.round(g.x - g.w / 2) - 1, gy - 5, 3, 2); x.fillRect(Math.round(g.x + g.w / 2) - 2, gy - 5, 3, 2); }
      const sx = Math.round(s.sx), lean = clamp(Math.round(s.vx * 2), -2, 2);
      x.fillStyle = C("fg");
      if (s.fall > 0) { x.fillRect(sx - 4, 18, 8, 2); x.fillRect(sx + 2, 16, 2, 2); }
      else { x.fillRect(sx - 1, 12, 2, 2); x.fillRect(sx - 1 + (lean > 0 ? 1 : 0), 14, 2, 3); x.fillRect(sx - 3 + lean, 18, 2, 1); x.fillRect(sx + 1 + lean, 18, 2, 1); x.fillRect(sx - 3 + lean, 17, 1, 1); x.fillRect(sx + 2 + lean, 17, 1, 1); }
    },
    score: s => `${s.made} · ${s.missed} missed`,
    over: s => s.made + s.missed >= 40,
  };

  /* ---- Dust Bunnies: a swaying drift of dust bunnies sinks toward the floor; the duster at the bottom puffs them away ---- */
  const bunnies = {
    name: "Dust Bunnies",
    init() { const s = { dx: W / 2, puffs: [], lint: [], pts: 0, lives: 3, wave: 0, t: 0, hurt: 0, poofs: [] }; bunnies.wave(s); return s; },
    wave(s) {
      s.b = []; s.wave++; s.sink = 0; s.cool = 20;
      for (let r = 0; r < 4; r++) for (let c = 0; c < (r % 2 ? 6 : 7); c++) s.b.push({ ox: (c - (r % 2 ? 2.5 : 3)) * 15, oy: 8 + r * 8, on: true, r });
    },
    pos(s, b) { return { x: W / 2 + b.ox + Math.sin(s.t / 55 + b.r * .7) * 22, y: b.oy + s.sink }; },
    step(s) {
      s.t++; if (s.hurt > 0) s.hurt--;
      s.sink += .012 + s.wave * .004;
      const live = s.b.filter(b => b.on);
      // the duster picks the lowest bunny it can reach and steps aside from falling lint
      let tx = s.dx;
      if (live.length) { const lo = live.map(b => bunnies.pos(s, b)).sort((a, c) => c.y - a.y || Math.abs(a.x - s.dx) - Math.abs(c.x - s.dx))[0]; tx = lo.x + (s.aim || 0); }
      const danger = s.lint.find(l => l.y > H - 26 && Math.abs(l.x - s.dx) < 6 && !l.unseen);
      if (danger) tx = s.dx + (danger.x > s.dx ? -12 : 12);
      s.dx = clamp(s.dx + clamp(tx - s.dx, -1.4, 1.4), 6, W - 6);
      if (--s.cool <= 0 && s.puffs.length < 2 && live.length && !s.hurt) { s.puffs.push({ x: s.dx, y: H - 10 }); s.cool = rnd(14, 26); s.aim = Math.random() < .3 ? rnd(-8, 8) : 0; }
      if (live.length && Math.random() < .014 + s.wave * .007) { const b = live[Math.floor(Math.random() * live.length)], p = bunnies.pos(s, b); s.lint.push({ x: p.x, y: p.y + 3, w: rnd(-.3, .3), unseen: Math.random() < .15 }); }
      for (const p of s.puffs) {
        p.y -= 2.2;
        for (const b of live) { if (!b.on) continue; const q = bunnies.pos(s, b); if (Math.abs(p.x - q.x) < 4 && Math.abs(p.y - q.y) < 3) { b.on = false; p.dead = true; s.pts += 10 * (4 - b.r); s.poofs.push({ x: q.x, y: q.y, life: 14 }); break; } }
        if (p.y < 0) p.dead = true;
      }
      for (const l of s.lint) {
        l.y += .9; l.x += Math.sin((s.t + l.y) / 6) * .3 + l.w * .2;
        if (l.y > H - 10 && l.y < H - 4 && Math.abs(l.x - s.dx) < 4 && !s.hurt) { l.dead = true; s.lives--; s.hurt = 50; }
        if (l.y > H) l.dead = true;
      }
      s.puffs = s.puffs.filter(p => !p.dead); s.lint = s.lint.filter(l => !l.dead);
      for (const p of s.poofs) p.life--; s.poofs = s.poofs.filter(p => p.life > 0);
      if (!s.b.some(b => b.on)) bunnies.wave(s);
      else if (live.some(b => bunnies.pos(s, b).y > H - 16)) { s.lives--; s.hurt = 50; bunnies.wave(s); }
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); x.fillRect(0, H - 3, W, 3); for (let i = 3; i < W; i += 12) x.fillRect(i, H - 4, 6, 1);   // floorboards
      const hop = (s.t >> 4) & 1;
      for (const b of s.b) if (b.on) {
        const { x: bx, y: by } = bunnies.pos(s, b), X = Math.round(bx), Y = Math.round(by);
        x.fillStyle = b.r < 2 ? C("lilac") : C("fg");
        x.fillRect(X - 3, Y - 1, 7, 3); x.fillRect(X - 2, Y - 2, 5, 1); x.fillRect(X - 2, Y + 2, 5, 1);
        x.fillRect(X - 4, Y + hop - 1, 1, 1); x.fillRect(X + 4, Y - hop, 1, 1);   // tufts
        x.fillRect(X - 1, Y - 4 + hop, 1, 2); x.fillRect(X + 1, Y - 4, 1, 2);       // ears
        x.fillStyle = C("bg"); x.fillRect(X - 1, Y, 1, 1); x.fillRect(X + 1, Y, 1, 1);
      }
      x.fillStyle = C("fg"); for (const p of s.poofs) { const k = 14 - p.life; for (let a = 0; a < 6; a++) x.fillRect(Math.round(p.x + Math.cos(a) * k * .5), Math.round(p.y + Math.sin(a) * k * .4), 1, 1); }
      x.fillStyle = C("sage"); for (const l of s.lint) x.fillRect(Math.round(l.x), Math.round(l.y), 1, 2);
      x.fillStyle = C("fg"); for (const p of s.puffs) { x.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); x.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); }
      if (!(s.hurt && (s.hurt >> 2) & 1)) {   // the duster: a handle and a fan of feathers
        const dx = Math.round(s.dx); x.fillStyle = C("amber");
        x.fillRect(dx - 1, H - 7, 2, 4); x.fillRect(dx - 4, H - 9, 9, 2); x.fillRect(dx - 3, H - 11, 7, 2); x.fillRect(dx - 1, H - 12, 3, 1);
      }
    },
    score: s => `${s.pts} · ${"♥".repeat(Math.max(0, s.lives))}`,
    over: s => s.lives <= 0 || s.wave > 6,
  };

  /* ---- Salvage: a little tug drifts and thrusts through a field of tumbling scrap, cutting it into smaller scrap (line drawing) ---- */
  const wrap = (v, m) => (v % m + m) % m;
  const salvage = {
    name: "Salvage",
    init() { const s = { sh: { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0 }, shots: [], bits: [], pts: 0, lives: 3, wave: 0, dead: 0, cool: 0, sparks: [], t: 0 }; salvage.wave(s); return s; },
    rock(x, y, size) {
      const n = 7 + Math.floor(Math.random() * 3), pts = [];
      for (let i = 0; i < n; i++) pts.push(.65 + Math.random() * .45);
      const a = Math.random() * Math.PI * 2, v = (.25 + Math.random() * .3) * (4 - size) / 2;
      return { x, y, size, r: size * 4 + 2, pts, rot: 0, spin: rnd(-.03, .03), vx: Math.cos(a) * v, vy: Math.sin(a) * v, panel: Math.random() < .4 };
    },
    wave(s) {
      s.wave++; s.bits = [];
      for (let i = 0; i < 2 + s.wave; i++) { const e = Math.random() < .5; s.bits.push(salvage.rock(e ? rnd(0, W) : (Math.random() < .5 ? 4 : W - 4), e ? (Math.random() < .5 ? 4 : H - 4) : rnd(0, H), 3)); }
    },
    step(s) {
      s.t++;
      const sh = s.sh;
      if (s.dead > 0) { if (--s.dead === 0) { const clear = s.bits.every(b => Math.hypot(b.x - W / 2, b.y - H / 2) > 22); if (clear) Object.assign(sh, { x: W / 2, y: H / 2, vx: 0, vy: 0 }); else s.dead = 10; } }
      else {
        // pick the nearest scrap, lead it, turn toward it; back off when something is about to hit
        let best = null, bd = 1e9;
        for (const b of s.bits) { const d = Math.hypot(b.x - sh.x, b.y - sh.y) - b.r; if (d < bd) { bd = d; best = b; } }
        if (best) {
          const t = Math.hypot(best.x - sh.x, best.y - sh.y) / 2.4;
          const want = Math.atan2(best.y + best.vy * t - sh.y, best.x + best.vx * t - sh.x) + (s.wob || 0);
          let da = wrap(want - sh.a + Math.PI, Math.PI * 2) - Math.PI;
          sh.a += clamp(da, -.07, .07);
          if (bd < 10) { sh.vx -= Math.cos(sh.a) * .05; sh.vy -= Math.sin(sh.a) * .05; }
          else if (bd > 40) { sh.vx += Math.cos(sh.a) * .03; sh.vy += Math.sin(sh.a) * .03; s.thrust = 1; }
          if (--s.cool <= 0 && Math.abs(da) < .12) { s.shots.push({ x: sh.x + Math.cos(sh.a) * 4, y: sh.y + Math.sin(sh.a) * 4, vx: Math.cos(sh.a) * 2.4 + sh.vx, vy: Math.sin(sh.a) * 2.4 + sh.vy, life: 40 }); s.cool = rnd(10, 18); s.wob = Math.random() < .3 ? rnd(-.25, .25) : 0; }
        }
        sh.vx *= .985; sh.vy *= .985; sh.x = wrap(sh.x + sh.vx, W); sh.y = wrap(sh.y + sh.vy, H);
        for (const b of s.bits) if (Math.hypot(b.x - sh.x, b.y - sh.y) < b.r * .8 + 2) { s.lives--; s.dead = 70; for (let k = 0; k < 10; k++) s.sparks.push({ x: sh.x, y: sh.y, vx: rnd(-1, 1), vy: rnd(-1, 1), life: 30 }); break; }
      }
      for (const b of s.bits) { b.x = wrap(b.x + b.vx, W); b.y = wrap(b.y + b.vy, H); b.rot += b.spin; }
      const born = [];
      for (const p of s.shots) {
        p.x = wrap(p.x + p.vx, W); p.y = wrap(p.y + p.vy, H); if (--p.life <= 0) p.dead = true;
        for (const b of s.bits) if (!b.dead && Math.hypot(b.x - p.x, b.y - p.y) < b.r) {
          b.dead = p.dead = true; s.pts += [0, 100, 50, 20][b.size];
          if (b.size > 1) for (let k = 0; k < 2; k++) born.push(salvage.rock(b.x, b.y, b.size - 1));
          for (let k = 0; k < 4; k++) s.sparks.push({ x: b.x, y: b.y, vx: rnd(-.8, .8), vy: rnd(-.8, .8), life: 18 });
          break;
        }
      }
      s.bits = s.bits.filter(b => !b.dead).concat(born); s.shots = s.shots.filter(p => !p.dead);
      for (const p of s.sparks) { p.x += p.vx; p.y += p.vy; p.life--; } s.sparks = s.sparks.filter(p => p.life > 0);
      if (!s.bits.length) salvage.wave(s);
    },
    draw(x, s, C) {
      bg(x, C);
      x.fillStyle = C("line"); for (let i = 0; i < 24; i++) x.fillRect((i * 67) % W, (i * 29) % H, 1, 1);
      x.lineWidth = 1; x.lineJoin = "round";
      for (const b of s.bits) {
        x.strokeStyle = b.panel ? C("lilac") : C("fg"); x.beginPath();
        b.pts.forEach((k, i) => { const a = b.rot + i / b.pts.length * Math.PI * 2, px = b.x + Math.cos(a) * b.r * k, py = b.y + Math.sin(a) * b.r * k; i ? x.lineTo(px, py) : x.moveTo(px, py); });
        x.closePath(); x.stroke();
        if (b.panel && b.size > 1) { x.beginPath(); x.moveTo(b.x - b.r * .4, b.y); x.lineTo(b.x + b.r * .4, b.y); x.stroke(); }
      }
      x.fillStyle = C("fg"); for (const p of s.shots) x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      x.fillStyle = C("amber"); for (const p of s.sparks) x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      if (!s.dead) {   // the tug: a blunt pentagon with a tow hook, and a flicker of exhaust when it thrusts
        const sh = s.sh, c = Math.cos(sh.a), n = Math.sin(sh.a), P = (f, r) => [sh.x + c * f - n * r, sh.y + n * f + c * r];
        x.strokeStyle = C("amber"); x.beginPath();
        [[4, 0], [1, 2.5], [-3, 2.5], [-3, -2.5], [1, -2.5]].forEach(([f, r], i) => { const [px, py] = P(f, r); i ? x.lineTo(px, py) : x.moveTo(px, py); });
        x.closePath(); x.stroke();
        if (s.thrust && (s.t >> 1) & 1) { x.strokeStyle = C("sage"); x.beginPath(); const [a1, b1] = P(-3, 0), [a2, b2] = P(-6, 0); x.moveTo(a1, b1); x.lineTo(a2, b2); x.stroke(); }
        s.thrust = 0;
      }
    },
    score: s => `${s.pts} · ${"▲".repeat(Math.max(0, s.lives))}`,
    over: s => (s.lives <= 0 && !s.dead) || s.wave > 5,
  };

  /* ---- Route 9: a chihuahua crosses four lanes of Route 9, then the Mill River on drifting logs and inner tubes ---- */
  const ROW = 9, LANES = [
    // row 0 is the far bank, 1-3 the river, 4 the median, 5-8 the road, 9 the near verge
    null,
    { river: true, v: .45, len: 22, gap: 40, kind: "log" },
    { river: true, v: -.6, len: 10, gap: 26, kind: "tube" },
    { river: true, v: .35, len: 30, gap: 46, kind: "log" },
    null,
    { v: -.9, len: 10, gap: 44, kind: "car" },
    { v: .7, len: 18, gap: 60, kind: "truck" },
    { v: -1.2, len: 9, gap: 50, kind: "car" },
    { v: .55, len: 10, gap: 38, kind: "car" },
    null,
  ];
  const route9 = {
    name: "Route 9",
    init() {
      const s = { t: 0, home: 0, lost: 0, objs: LANES.map((L, r) => L ? Array.from({ length: Math.ceil((W + 60) / (L.len + L.gap)) }, (_, i) => ({ x: i * (L.len + L.gap) + rnd(0, L.gap * .5), c: Math.floor(Math.random() * 3) })) : []), splat: 0, flags: [] };
      route9.spawn(s); return s;
    },
    spawn(s) { s.d = { col: 10, row: 9, x: 10 * 8 + 4, hop: 0, from: null, wait: 0 }; },
    span: L => (L.len + L.gap) * Math.ceil((W + 60) / (L.len + L.gap)),
    ox(s, r, o, dt) { const L = LANES[r]; return wrap(o.x + L.v * (s.t + dt), route9.span(L)) - 30; },
    hit(s, r, x, dt) {   // is a car on that spot (road) / is there something to stand on (river), dt frames from now
      const L = LANES[r]; if (!L) return false;
      const on = s.objs[r].some(o => { const ox = route9.ox(s, r, o, dt); return x > ox - (L.river ? 0 : 3) && x < ox + L.len + (L.river ? 0 : 3); });
      return L.river ? !on : on;
    },
    safe(s, r, x, from, to) { for (let k = from; k <= to; k += 2) { const L = LANES[r], xx = L && L.river ? x + L.v * k : x; if (xx < 2 || xx > W - 2 || route9.hit(s, r, xx, k)) return false; } return true; },
    step(s) {
      s.t++;
      const d = s.d;
      if (s.splat > 0) { if (--s.splat === 0) route9.spawn(s); return; }
      if (d.hop > 0) { d.hop--; if (d.hop === 0) d.from = null; }
      const L = LANES[d.row];
      if (L && L.river && !d.hop) d.x += L.v;   // riding a log or a tube
      if (!d.hop && (d.x < 1 || d.x > W - 1 || (L && route9.hit(s, d.row, d.x, 0)))) { s.lost++; s.splat = 40; s.splatKind = L && L.river ? "splash" : "honk"; return; }
      if (d.row === 0) { s.home++; s.flags.push(d.x); if (s.flags.length > 6) s.flags.shift(); s.splat = 30; s.splatKind = "home"; return; }
      if (d.hop || --d.wait > 0) return;
      // choose a hop: forward if it's safe to land and to stay a moment, otherwise wait, sidestep, or back up
      const tries = [[-1, 0], [0, 0], [0, -8], [0, 8], [1, 0]];
      if (Math.random() < .05) tries.unshift([0, Math.random() < .5 ? -8 : 8]);   // now and then a sniff to the side
      for (const [dr, dx] of tries) {
        const r = d.row + dr, x = d.x + dx;
        if (r < 0 || r > 9 || x < 4 || x > W - 4) continue;
        const LL = LANES[r];
        if (!LL ? true : route9.safe(s, r, x, 6, 22)) {
          if (dr === 0 && dx === 0) { d.wait = 4; return; }
          d.from = { row: d.row, x: d.x }; d.row = r; d.x = x; d.hop = 6; d.wait = Math.random() < .15 ? rnd(10, 30) : 3; return;
        }
      }
      d.wait = 4;
    },
    draw(x, s, C) {
      bg(x, C);
      const y0 = r => r * ROW;
      x.fillStyle = C("sage"); x.globalAlpha = .35; x.fillRect(0, y0(0), W, ROW); x.fillRect(0, y0(4), W, ROW); x.fillRect(0, y0(9), W, ROW); x.globalAlpha = 1;
      x.fillStyle = C("lilac"); x.globalAlpha = .22; x.fillRect(0, y0(1), W, ROW * 3); x.globalAlpha = 1;
      x.fillStyle = C("lilac"); for (let i = 0; i < 18; i++) x.fillRect(Math.round(wrap(i * 37 + s.t * (i % 2 ? .3 : -.2), W)), y0(1 + i % 3) + 4, 3, 1);   // ripples
      x.fillStyle = C("line"); x.fillRect(0, y0(5), W, ROW * 4);
      x.fillStyle = C("amber"); for (let i = 0; i < W; i += 14) x.fillRect(i, y0(7) - 1, 8, 1);   // double yellow at the middle
      x.fillStyle = C("fg"); for (const r of [6, 8]) for (let i = 0; i < W; i += 16) x.fillRect(i, y0(r) - 1, 6, 1);
      x.fillStyle = C("fg"); x.font = "5px monospace"; x.fillText("9", W - 7, y0(9) + 7);
      x.fillStyle = C("amber"); for (const f of s.flags) { x.fillRect(Math.round(f), 1, 1, 7); x.fillRect(Math.round(f) + 1, 1, 3, 2); }
      LANES.forEach((L, r) => {
        if (!L) return;
        for (const o of s.objs[r]) {
          const X = Math.round(route9.ox(s, r, o, 0)), Y = y0(r);
          if (L.kind === "log") { x.fillStyle = C("amber"); x.globalAlpha = .7; x.fillRect(X, Y + 2, L.len, 5); x.globalAlpha = 1; x.fillStyle = C("bg"); x.fillRect(X + 4, Y + 4, 1, 1); x.fillRect(X + L.len - 6, Y + 3, 1, 1); }
          else if (L.kind === "tube") { x.fillStyle = C("fg"); x.fillRect(X + 1, Y + 2, L.len - 2, 5); x.fillStyle = C("lilac"); x.fillRect(X + 3, Y + 4, L.len - 6, 1); }
          else {
            x.fillStyle = [C("amber"), C("lilac"), C("fg")][o.c]; x.fillRect(X, Y + 2, L.len, L.kind === "truck" ? 6 : 5);
            if (L.kind === "truck") { x.fillStyle = C("fg"); x.fillRect(L.v > 0 ? X + L.len - 5 : X, Y + 2, 5, 6); }
            x.fillStyle = C("bg"); x.fillRect(X + 2, Y + 7, 2, 1); x.fillRect(X + L.len - 4, Y + 7, 2, 1);   // wheels
            x.fillStyle = C("fg"); x.fillRect(L.v > 0 ? X + L.len - 1 : X, Y + 3, 1, 1);   // headlight
          }
        }
      });
      const d = s.d;
      let dy = y0(d.row) + 4, dxp = d.x;
      if (d.hop && d.from) { const k = d.hop / 6; dy = y0(d.row) * (1 - k) + y0(d.from.row) * k + 4 - Math.sin((1 - k) * Math.PI) * 2; dxp = d.x * (1 - k) + d.from.x * k; }
      if (s.splat && s.splatKind !== "home") {
        x.fillStyle = s.splatKind === "splash" ? C("fg") : C("amber");
        for (let a = 0; a < 8; a++) x.fillRect(Math.round(dxp + Math.cos(a) * (40 - s.splat) * .15), Math.round(dy + Math.sin(a) * (40 - s.splat) * .1), 1, 1);
      } else {   // the chihuahua: small body, big ears, a curl of tail
        const X = Math.round(dxp), Y = Math.round(dy);
        x.fillStyle = C("amber"); x.fillRect(X - 2, Y - 1, 4, 3); x.fillRect(X - 1, Y - 3, 3, 2);
        x.fillRect(X - 2, Y - 4, 1, 1); x.fillRect(X + 2, Y - 4, 1, 1);   // ears
        x.fillRect(X - 3, Y - 2, 1, 1);                                    // tail
        x.fillStyle = C("bg"); x.fillRect(X, Y - 2, 1, 1);
      }
    },
    score: s => `${s.home} home · ${s.lost} lost`,
    over: s => s.home + s.lost >= 14 && !s.splat,
  };

  window.ATARI = [masonry, bunnies, lander, salvage, geese, route9, trails, slalom];
})();
