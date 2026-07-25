/* tip-to-tail.js — draw-and-measure interactive for the Tip-to-Tail Method lesson */

(function () {
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const parseNum = (input) => {
    const s = input.value.trim().replace(/−/g, "-");
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return null;
    return parseFloat(s);
  };

  /* ============================================================
     Grid geometry: full four-quadrant grid, −7…7 on both axes,
     34 px per unit, centred in a 540×540 viewBox
     ============================================================ */
  const SVGNS = "http://www.w3.org/2000/svg";
  const U = 34;
  const GRID = 7;          // grid spans −GRID … +GRID on both axes
  const CX = 270, CY = 270; // pixel centre (origin) of the plot
  const PX = (v) => CX + U * v;
  const PY = (w) => CY - U * w;
  const GX = (px) => (px - CX) / U;
  const GY = (py) => (CY - py) / U;
  const HEAD_LEN = 26, HEAD_HALF = 9;

  const svg = document.getElementById("ttPlot");

  const mk = (tag, attrs) => {
    const el = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, val]) => el.setAttribute(k, val));
    return el;
  };

  const polar = (cx, cy, r, deg) => ({
    x: cx + r * Math.cos(deg * Math.PI / 180),
    y: cy + r * Math.sin(deg * Math.PI / 180)
  });

  // A small white circular-arrow (rotate) glyph, drawn inside a handle
  const appendRotateIcon = (g, cx, cy) => {
    const r = 5.5, a0 = 60, a1 = 310;
    const s = polar(cx, cy, r, a0), e = polar(cx, cy, r, a1);
    g.appendChild(mk("path", {
      d: "M " + s.x.toFixed(1) + " " + s.y.toFixed(1) + " A " + r + " " + r + " 0 1 1 " + e.x.toFixed(1) + " " + e.y.toFixed(1),
      fill: "none", stroke: "#fff", "stroke-width": 1.5, "stroke-linecap": "round", "pointer-events": "none"
    }));
    const ta = a1 * Math.PI / 180;
    const tang = { x: -Math.sin(ta), y: Math.cos(ta) };
    const perp = { x: Math.cos(ta), y: Math.sin(ta) };
    const nose = { x: e.x + tang.x * 4.5, y: e.y + tang.y * 4.5 };
    const b1 = { x: e.x + perp.x * 3, y: e.y + perp.y * 3 };
    const b2 = { x: e.x - perp.x * 3, y: e.y - perp.y * 3 };
    g.appendChild(mk("polygon", {
      points: nose.x.toFixed(1) + "," + nose.y.toFixed(1) + " " + b1.x.toFixed(1) + "," + b1.y.toFixed(1) + " " + b2.x.toFixed(1) + "," + b2.y.toFixed(1),
      fill: "#fff", "pointer-events": "none"
    }));
  };

  const toGrid = (e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const q = p.matrixTransform(ctm.inverse());
    return { x: GX(q.x), y: GY(q.y) };
  };

  // Light grey four-quadrant grid with darker axes
  const buildGrid = () => {
    const g = document.getElementById("tt-grid");
    for (let v = -GRID; v <= GRID; v++) {
      g.appendChild(mk("line", { x1: PX(v), y1: PY(GRID), x2: PX(v), y2: PY(-GRID), stroke: "var(--card-border)", "stroke-width": 1 }));
    }
    for (let w = -GRID; w <= GRID; w++) {
      g.appendChild(mk("line", { x1: PX(-GRID), y1: PY(w), x2: PX(GRID), y2: PY(w), stroke: "var(--card-border)", "stroke-width": 1 }));
    }
    // Axes
    g.appendChild(mk("line", { x1: PX(-GRID), y1: PY(0), x2: PX(GRID), y2: PY(0), stroke: "var(--text)", "stroke-width": 2 }));
    g.appendChild(mk("line", { x1: PX(0), y1: PY(GRID), x2: PX(0), y2: PY(-GRID), stroke: "var(--text)", "stroke-width": 2 }));
    // Axis number labels (every 2, both directions)
    for (let v = -GRID + 1; v <= GRID; v++) {
      if (v === 0 || v % 2 !== 0) continue;
      const t = mk("text", { x: PX(v), y: PY(0) + 15, "text-anchor": "middle", "font-size": 10, fill: "var(--muted)" });
      t.textContent = String(v);
      g.appendChild(t);
    }
    for (let w = -GRID + 1; w <= GRID; w++) {
      if (w === 0 || w % 2 !== 0) continue;
      const t = mk("text", { x: PX(0) - 7, y: PY(w) + 4, "text-anchor": "end", "font-size": 10, fill: "var(--muted)" });
      t.textContent = String(w);
      g.appendChild(t);
    }
    const zero = mk("text", { x: PX(0) - 7, y: PY(0) + 15, "text-anchor": "end", "font-size": 10, fill: "var(--muted)" });
    zero.textContent = "0";
    g.appendChild(zero);
    // Direction labels on the axis ends
    const right = mk("text", { x: PX(GRID) - 2, y: PY(0) - 6, "text-anchor": "end", "font-size": 12, "font-style": "italic", fill: "var(--text)" });
    right.textContent = "right →";
    g.appendChild(right);
    const up = mk("text", { x: PX(0) + 8, y: PY(GRID) + 4, "text-anchor": "start", "font-size": 12, "font-style": "italic", fill: "var(--text)" });
    up.textContent = "↑ up";
    g.appendChild(up);
  };

  /* ============================================================
     Vectors: fixed components, draggable tails (translation only)
     ============================================================ */
  const VEC_DEFS = {
    v1: { colour: "var(--accent)", label: "V", sub: "1" },
    v2: { colour: "var(--brand)", label: "V", sub: "2" },
    r: { colour: "var(--accent)", label: "R", sub: "", dashed: true }
  };
  const comps = { v1: { x: 0, y: 0 }, v2: { x: 0, y: 0 }, r: { x: 0, y: 0 } };
  const tails = { v1: { x: 0, y: 0 }, v2: { x: 0, y: 0 }, r: { x: 0, y: 0 } };
  const locked = { v1: false, v2: false, r: false };
  const vecEls = {};

  const buildVector = (key) => {
    const def = VEC_DEFS[key];
    const g = mk("g", {});
    const line = mk("line", { stroke: def.colour, "stroke-width": def.dashed ? 5 : 3 });
    if (def.dashed) line.setAttribute("stroke-dasharray", "8 4");
    const head = mk("polygon", { fill: def.colour });
    const label = mk("text", { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: def.colour });
    label.textContent = def.label;
    if (def.sub) {
      const ts = mk("tspan", { "font-size": 10, dy: 3 });
      ts.textContent = def.sub;
      label.appendChild(ts);
    }
    const hit = mk("line", { stroke: "transparent", "stroke-width": 24, "data-drag": "vec:" + key, style: "cursor: grab;" });
    g.append(line, head, label, hit);
    g.style.display = "none";
    document.getElementById("tt-vectors").appendChild(g);
    vecEls[key] = { group: g, line, head, label, hit };
  };

  const renderVector = (key) => {
    const els = vecEls[key];
    const x1 = PX(tails[key].x), y1 = PY(tails[key].y);
    const x2 = PX(tails[key].x + comps[key].x), y2 = PY(tails[key].y + comps[key].y);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const ux = dx / len, uy = dy / len;
    const bx = x2 - HEAD_LEN * ux, by = y2 - HEAD_LEN * uy;
    els.head.setAttribute("points",
      x2 + "," + y2 + " " +
      (bx - HEAD_HALF * uy) + "," + (by + HEAD_HALF * ux) + " " +
      (bx + HEAD_HALF * uy) + "," + (by - HEAD_HALF * ux));
    if (len > HEAD_LEN) {
      els.line.style.display = "block";
      els.line.setAttribute("x1", x1);
      els.line.setAttribute("y1", y1);
      els.line.setAttribute("x2", bx);
      els.line.setAttribute("y2", by);
    } else {
      els.line.style.display = "none";
    }
    els.hit.setAttribute("x1", x1);
    els.hit.setAttribute("y1", y1);
    els.hit.setAttribute("x2", x2);
    els.hit.setAttribute("y2", y2);
    els.label.setAttribute("x", ((x1 + x2) / 2 + 15 * uy).toFixed(1));
    els.label.setAttribute("y", ((y1 + y2) / 2 - 15 * ux + 4).toFixed(1));
  };

  const clampTail = (key, x, y) => {
    const c = comps[key];
    const loX = -GRID - Math.min(0, c.x), hiX = GRID - Math.max(0, c.x);
    const loY = -GRID - Math.min(0, c.y), hiY = GRID - Math.max(0, c.y);
    return { x: Math.min(hiX, Math.max(loX, x)), y: Math.min(hiY, Math.max(loY, y)) };
  };

  /* ============================================================
     Ruler: fixed length (full grid width), move and rotate only
     ============================================================ */
  const RULER_LEN = 2 * GRID; // spans the full grid width
  const rul = { ax: -GRID, ay: -GRID + 0.5, phi: 0 };

  const renderRuler = () => {
    const g = document.getElementById("tt-ruler");
    g.innerHTML = "";
    const ax = PX(rul.ax), ay = PY(rul.ay);
    const bx = PX(rul.ax + RULER_LEN * Math.cos(rul.phi));
    const by = PY(rul.ay + RULER_LEN * Math.sin(rul.phi));
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const W = 40;
    const body = mk("polygon", {
      points: ax + "," + ay + " " + bx + "," + by + " " + (bx + W * px) + "," + (by + W * py) + " " + (ax + W * px) + "," + (ay + W * py),
      fill: "var(--soft-bg)", "fill-opacity": 0.92, stroke: "var(--text)", "stroke-width": 1.5,
      "data-drag": "ruler-body", style: "cursor: grab;"
    });
    g.appendChild(body);
    // Ticks: whole units get a long tick + number, half units get a short tick
    for (let h = 0; h <= RULER_LEN * 2; h++) {
      const dist = h / 2;
      const tx = ax + dist * U * ux, ty = ay + dist * U * uy;
      const isInt = h % 2 === 0;
      g.appendChild(mk("line", {
        x1: tx, y1: ty, x2: tx + (isInt ? 11 : 6) * px, y2: ty + (isInt ? 11 : 6) * py,
        stroke: "var(--text)", "stroke-width": 1, "pointer-events": "none"
      }));
      if (isInt) {
        const num = mk("text", {
          x: tx + 24 * px, y: ty + 24 * py + 3, "text-anchor": "middle",
          "font-size": 10, fill: "var(--text)", "pointer-events": "none"
        });
        num.textContent = String(dist);
        g.appendChild(num);
      }
    }
    // Rotation handle (with a circular-arrow icon), rotates about the zero end
    const hx = ax + 8 * U * ux + 20 * px;
    const hy = ay + 8 * U * uy + 20 * py;
    g.appendChild(mk("circle", { cx: hx, cy: hy, r: 11, fill: "var(--brand)", "fill-opacity": 0.95, "data-drag": "ruler-rot", style: "cursor: grab;", "touch-action": "none" }));
    appendRotateIcon(g, hx, hy);
  };

  /* ============================================================
     Protractor: draggable full circle, 0° to the right, anticlockwise
     ============================================================ */
  const prot = { cx: 4, cy: -3 };
  const PROT_R = 3 * U;

  const buildProtractor = () => {
    const g = document.getElementById("tt-protractor");
    g.innerHTML = "";
    g.appendChild(mk("circle", {
      cx: 0, cy: 0, r: PROT_R,
      fill: "var(--soft-bg)", "fill-opacity": 0.82, stroke: "var(--text)", "stroke-width": 1.5,
      "data-drag": "prot", style: "cursor: grab;"
    }));
    for (let a = 0; a < 360; a += 10) {
      const rad = (a * Math.PI) / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const major = a % 30 === 0;
      // Screen y is down, so up uses −sin
      g.appendChild(mk("line", {
        x1: (PROT_R - (major ? 12 : 7)) * cos, y1: -(PROT_R - (major ? 12 : 7)) * sin,
        x2: (PROT_R - 2) * cos, y2: -(PROT_R - 2) * sin,
        stroke: "var(--text)", "stroke-width": major ? 1.5 : 1, "pointer-events": "none"
      }));
      if (major) {
        const t = mk("text", {
          x: (PROT_R - 24) * cos, y: -(PROT_R - 24) * sin + 3,
          "text-anchor": "middle", "font-size": 9, fill: "var(--text)", "pointer-events": "none"
        });
        t.textContent = String(a);
        g.appendChild(t);
      }
    }
    // Baseline, vertical line and centre cross
    g.appendChild(mk("line", { x1: -PROT_R, y1: 0, x2: PROT_R, y2: 0, stroke: "var(--text)", "stroke-width": 1, "pointer-events": "none" }));
    g.appendChild(mk("line", { x1: 0, y1: -PROT_R, x2: 0, y2: PROT_R, stroke: "var(--text)", "stroke-width": 1, "pointer-events": "none" }));
    g.appendChild(mk("line", { x1: -9, y1: 0, x2: 9, y2: 0, stroke: "var(--brand)", "stroke-width": 2, "pointer-events": "none" }));
    g.appendChild(mk("line", { x1: 0, y1: -9, x2: 0, y2: 9, stroke: "var(--brand)", "stroke-width": 2, "pointer-events": "none" }));
  };

  const renderProtractor = () => {
    document.getElementById("tt-protractor").setAttribute("transform", "translate(" + PX(prot.cx) + " " + PY(prot.cy) + ")");
  };

  /* ============================================================
     Exercise state and stage flow
     ============================================================ */
  // Resultant components (positive); a random quadrant is chosen each time.
  // Kept ≤ 6 so both the resultant and the tip-to-tail joint fit the grid.
  const R_POOL = [
    [3, 4], [4, 3], [5, 3], [3, 5], [6, 2], [2, 6], [5, 4], [4, 5],
    [6, 3], [3, 6], [5, 5], [4, 6], [6, 4], [2, 5], [5, 2], [6, 5], [5, 6]
  ];
  // Equal-and-opposite pairs for the equilibrium exercise (resultant zero)
  const EQ_POOL = [[3, 4], [4, 3], [5, 3], [3, 5], [6, 2], [2, 6], [5, 5], [4, 5], [5, 4], [6, 4], [4, 6]];

  const SESSION_LEN = 4;
  let exerciseIndex = 0; // 0-based position within the set of four
  let eqSlot = 0;        // which exercise in the set is the equilibrium one
  let exactLen = 0, exactAng = 0;
  let equilibrium = false;
  let stage = 1;
  const circles = [0, 1, 2, 3].map((i) => document.getElementById("tt-circle-" + i));
  const taskEl = document.getElementById("tt-task");
  const feedbackEl = document.getElementById("tt-feedback");
  const snapBox = document.getElementById("tt-snap");

  const setCircle = (i) => circles[i].classList.add("solved");
  const coin = () => (Math.random() < 0.5 ? 1 : -1);

  const randomStart = (key) => {
    for (let tries = 0; tries < 60; tries++) {
      const p = clampTail(key, randInt(-GRID, GRID), randInt(-GRID, GRID));
      const onOrigin = Math.abs(p.x) < 0.5 && Math.abs(p.y) < 0.5;
      if (!onOrigin) return p;
    }
    return clampTail(key, 4, 4);
  };

  // Show each given force as "magnitude N at angle°" (angle anticlockwise from the right)
  const forceAngle = (c) => (c.x === 0 && c.y === 0) ? 0 : Math.round(((toDeg(Math.atan2(c.y, c.x)) + 360) % 360));
  const updateGiven = () => {
    document.getElementById("tt-f1").textContent = Math.hypot(comps.v1.x, comps.v1.y).toFixed(1) + " N at " + forceAngle(comps.v1) + "°";
    document.getElementById("tt-f2").textContent = Math.hypot(comps.v2.x, comps.v2.y).toFixed(1) + " N at " + forceAngle(comps.v2) + "°";
  };

  const generate = (isEquilibrium) => {
    equilibrium = isEquilibrium;
    if (equilibrium) {
      const c = EQ_POOL[randInt(0, EQ_POOL.length - 1)];
      const sx = coin(), sy = coin();
      comps.v1 = { x: sx * c[0], y: sy * c[1] };
      comps.v2 = { x: -comps.v1.x, y: -comps.v1.y };
      comps.r = { x: 0, y: 0 };
      exactLen = 0;
      exactAng = 0;
    } else {
      const base = R_POOL[randInt(0, R_POOL.length - 1)];
      const rx = coin() * base[0], ry = coin() * base[1];
      comps.r = { x: rx, y: ry };
      // Split into two forces, keeping the tip-to-tail joint within ±(GRID−1)
      const lim = GRID - 1;
      let v1x = 0, v1y = 0, t = 0;
      do {
        v1x = randInt(Math.max(-lim, rx - lim), Math.min(lim, rx + lim));
        v1y = randInt(Math.max(-lim, ry - lim), Math.min(lim, ry + lim));
        t++;
      } while (t < 80 && ((v1x === 0 && v1y === 0) || (v1x === rx && v1y === ry)
        || Math.hypot(v1x, v1y) < 1.5 || Math.hypot(rx - v1x, ry - v1y) < 1.5));
      comps.v1 = { x: v1x, y: v1y };
      comps.v2 = { x: rx - v1x, y: ry - v1y };
      exactLen = Math.hypot(rx, ry);
      exactAng = (toDeg(Math.atan2(ry, rx)) + 360) % 360;
    }
    tails.v1 = randomStart("v1");
    tails.v2 = randomStart("v2");
    tails.r = randomStart("r");
    updateGiven();
  };

  const setTask = (text) => { taskEl.textContent = text; };

  // Completion box text: normal (from HTML) vs equilibrium round
  const NORMAL_COMPLETE = document.getElementById("tt-complete").textContent;
  const EQUILIBRIUM_COMPLETE = "Well done — the two forces are equal in size but opposite in direction, so they cancel: the resultant is zero. When the resultant force on an object is zero we say the forces are balanced, and the object stays still or keeps moving at a steady velocity.";
  const showCompletion = (isEquilibrium) => {
    const box = document.getElementById("tt-complete");
    box.textContent = isEquilibrium ? EQUILIBRIUM_COMPLETE : NORMAL_COMPLETE;
    box.removeAttribute("hidden");
  };

  // After a completed exercise: offer the next one, or finish the set of four
  const onExerciseComplete = () => {
    if (demoRunning) return;
    if (exerciseIndex >= SESSION_LEN - 1) {
      document.getElementById("tt-next").classList.add("d-none");
      document.getElementById("tt-restart").classList.remove("d-none");
      document.getElementById("tt-session-complete").removeAttribute("hidden");
      document.getElementById("tt-progress").textContent = "All " + SESSION_LEN + " exercises complete ✓";
    } else {
      document.getElementById("tt-next").classList.remove("d-none");
    }
  };

  const applyStage = () => {
    circles.forEach((c, i) => c.classList.toggle("current", i === stage - 1 && !c.classList.contains("solved")));
    document.getElementById("tt-ruler-hint").classList.toggle("d-none", stage !== 3);
    if (stage === 1) {
      setTask("Stage 1: Drag the two forces so they sit tip to tail, starting at the origin.");
    } else if (stage === 2) {
      setTask("Forces locked in place ✓ — Stage 2: drag the resultant so it runs from the origin to the tip of the second force.");
      vecEls.r.group.style.display = "block";
      renderVector("r");
    } else if (stage === 3) {
      setTask("Resultant locked ✓ — Stage 3: use the ruler to measure the length of the resultant, then enter it below.");
      document.getElementById("tt-ruler").style.display = "block";
      renderRuler();
      document.getElementById("tt-len-row").classList.remove("d-none");
    } else if (stage === 4) {
      setTask("Stage 4: use the protractor to measure the angle of the resultant, measured anticlockwise from the right (the positive x-axis), then enter it below.");
      document.getElementById("tt-protractor").style.display = "block";
      renderProtractor();
      document.getElementById("tt-ang-row").classList.remove("d-none");
    } else {
      setTask("All four stages complete ✓");
      showCompletion(false);
      onExerciseComplete();
    }
  };

  const near = (x, y, tx, ty) => {
    const tol = snapBox.checked ? 0.01 : 0.3;
    return Math.abs(x - tx) <= tol && Math.abs(y - ty) <= tol;
  };

  const checkPlacement = () => {
    if (stage === 1) {
      const chainA = near(tails.v1.x, tails.v1.y, 0, 0) && near(tails.v2.x, tails.v2.y, comps.v1.x, comps.v1.y);
      const chainB = near(tails.v2.x, tails.v2.y, 0, 0) && near(tails.v1.x, tails.v1.y, comps.v2.x, comps.v2.y);
      if (chainA || chainB) {
        locked.v1 = locked.v2 = true;
        setCircle(0);
        if (equilibrium) {
          // Second force lands back at the origin — resultant is zero, nothing to measure
          stage = 0;
          circles.forEach((c) => c.classList.remove("current"));
          document.getElementById("tt-ruler-hint").classList.add("d-none");
          setTask("The two forces cancel — the resultant is zero. ✓");
          showCompletion(true);
          onExerciseComplete();
          return;
        }
        stage = 2;
        applyStage();
      }
    } else if (stage === 2) {
      if (near(tails.r.x, tails.r.y, 0, 0)) {
        locked.r = true;
        setCircle(1);
        stage = 3;
        applyStage();
      }
    }
  };

  /* ============================================================
     Dragging (pointer events, window-level move/up)
     ============================================================ */
  let drag = null;
  const maybeSnap = (v) => (snapBox.checked ? Math.round(v) : Math.round(v * 20) / 20);

  svg.addEventListener("pointerdown", (e) => {
    if (demoRunning) return;
    const t = e.target.closest("[data-drag]");
    if (!t) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const kind = t.getAttribute("data-drag");
    const p = toGrid(e);
    if (kind.startsWith("vec:")) {
      const key = kind.slice(4);
      if (locked[key]) return;
      drag = { kind: "vec", key, offX: tails[key].x - p.x, offY: tails[key].y - p.y, pointerId: e.pointerId };
    } else if (kind === "ruler-body") {
      drag = { kind, offX: rul.ax - p.x, offY: rul.ay - p.y, pointerId: e.pointerId };
    } else if (kind === "ruler-rot") {
      drag = { kind, pointerId: e.pointerId };
    } else if (kind === "prot") {
      drag = { kind, offX: prot.cx - p.x, offY: prot.cy - p.y, pointerId: e.pointerId };
    }
    e.preventDefault();
  });

  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const p = toGrid(e);
    if (drag.kind === "vec") {
      const c = clampTail(drag.key, maybeSnap(p.x + drag.offX), maybeSnap(p.y + drag.offY));
      tails[drag.key] = c;
      renderVector(drag.key);
    } else if (drag.kind === "ruler-body") {
      rul.ax = maybeSnap(p.x + drag.offX);
      rul.ay = maybeSnap(p.y + drag.offY);
      renderRuler();
    } else if (drag.kind === "ruler-rot") {
      rul.phi = Math.atan2(p.y - rul.ay, p.x - rul.ax);
      renderRuler();
    } else if (drag.kind === "prot") {
      prot.cx = maybeSnap(p.x + drag.offX);
      prot.cy = maybeSnap(p.y + drag.offY);
      renderProtractor();
    }
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const wasVec = drag.kind === "vec";
    drag = null;
    if (wasVec) checkPlacement();
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  /* ============================================================
     Measurement checks
     ============================================================ */
  document.getElementById("tt-len-check").addEventListener("click", () => {
    const u = parseNum(document.getElementById("tt-len"));
    if (u !== null && Math.abs(u - exactLen) <= 0.2 + 1e-9) {
      setCircle(2);
      stage = 4;
      const f1 = Math.hypot(comps.v1.x, comps.v1.y).toFixed(1);
      const f2 = Math.hypot(comps.v2.x, comps.v2.y).toFixed(1);
      feedbackEl.textContent = "Correct — and it checks out: a " + f1 + " N and a " + f2 + " N force give a " + exactLen.toFixed(1) + " N resultant.";
      document.getElementById("tt-ruler").style.display = "none";
      applyStage();
    } else {
      feedbackEl.textContent = "Not quite. Line the ruler's zero mark up with the tail of the resultant, then read the scale at the arrow tip. Measure to one decimal place.";
    }
  });

  document.getElementById("tt-ang-check").addEventListener("click", () => {
    const u = parseNum(document.getElementById("tt-ang"));
    let diff = u === null ? 999 : Math.abs(((u % 360) + 360) % 360 - exactAng);
    diff = Math.min(diff, 360 - diff); // shortest way round the circle
    if (u !== null && diff <= 3 + 1e-9) {
      setCircle(3);
      stage = 5;
      feedbackEl.textContent = "Correct — well measured!";
      applyStage();
    } else {
      feedbackEl.textContent = "Not quite. Put the centre of the protractor on the origin, line its baseline up with the right (the positive x-axis), and read the scale anticlockwise to where the resultant arrow crosses it.";
    }
  });

  ["tt-len", "tt-ang"].forEach((id, i) => {
    document.getElementById(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById(i === 0 ? "tt-len-check" : "tt-ang-check").click();
      }
    });
  });

  /* ============================================================
     Reset / session flow (a set of four exercises, one equilibrium)
     ============================================================ */
  // Reset the board for a freshly generated exercise (equilibrium flag already set)
  const resetBoard = () => {
    stage = 1;
    locked.v1 = locked.v2 = locked.r = false;
    circles.forEach((c) => c.classList.remove("solved", "current"));
    feedbackEl.textContent = "";
    document.getElementById("tt-len").value = "";
    document.getElementById("tt-ang").value = "";
    document.getElementById("tt-len-row").classList.add("d-none");
    document.getElementById("tt-ang-row").classList.add("d-none");
    document.getElementById("tt-ruler").style.display = "none";
    document.getElementById("tt-protractor").style.display = "none";
    document.getElementById("tt-complete").setAttribute("hidden", "");
    document.getElementById("tt-next").classList.add("d-none");
    rul.ax = -GRID; rul.ay = -GRID + 0.5; rul.phi = 0;
    prot.cx = 4; prot.cy = -3;
    renderRuler();
    renderProtractor();
    vecEls.v1.group.style.display = "block";
    vecEls.v2.group.style.display = "block";
    vecEls.r.group.style.display = "none";
    renderVector("v1");
    renderVector("v2");
    applyStage();
  };

  // Load the current exercise in the set (equilibrium iff it is the chosen slot)
  const loadExercise = () => {
    generate(exerciseIndex === eqSlot);
    document.getElementById("tt-progress").textContent = "Exercise " + (exerciseIndex + 1) + " of " + SESSION_LEN;
    resetBoard();
  };

  // Begin a fresh set of four, with one equilibrium exercise placed at random
  const startSession = () => {
    exerciseIndex = 0;
    eqSlot = randInt(0, SESSION_LEN - 1);
    document.getElementById("tt-restart").classList.add("d-none");
    document.getElementById("tt-session-complete").setAttribute("hidden", "");
    loadExercise();
  };

  document.getElementById("tt-next").addEventListener("click", () => {
    if (exerciseIndex < SESSION_LEN - 1) { exerciseIndex++; loadExercise(); }
  });
  document.getElementById("tt-restart").addEventListener("click", startSession);

  /* ============================================================
     Demo: animate the full step-by-step process, then hand the
     student a fresh exercise to do themselves
     ============================================================ */
  let demoRunning = false;

  // Timer-driven so the demo also completes in throttled tabs
  const animate = (ms, step) => new Promise((resolve) => {
    const t0 = performance.now();
    const timer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      step(e);
      if (k >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, 16);
  });
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const glideVec = (key, to, ms) => {
    const from = { x: tails[key].x, y: tails[key].y };
    return animate(ms, (e) => {
      tails[key] = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      renderVector(key);
    });
  };

  const runDemo = async () => {
    if (demoRunning) return;
    demoRunning = true;
    document.getElementById("tt-demo").disabled = true;
    // The demo measures a resultant, so always use a non-equilibrium exercise
    generate(false);
    resetBoard();
    await pause(1000);

    // Stage 1: vectors tip-to-tail from the origin
    await glideVec("v1", { x: 0, y: 0 }, 900);
    await pause(700);
    await glideVec("v2", { x: comps.v1.x, y: comps.v1.y }, 900);
    checkPlacement();
    await pause(1400);

    // Stage 2: resultant from the origin
    await glideVec("r", { x: 0, y: 0 }, 900);
    checkPlacement();
    await pause(1400);

    // Stage 3: ruler along the resultant, then the measured length
    const rulFrom = { ax: rul.ax, ay: rul.ay, phi: rul.phi };
    const targetPhi = Math.atan2(comps.r.y, comps.r.x);
    await animate(1100, (e) => {
      rul.ax = rulFrom.ax * (1 - e);
      rul.ay = rulFrom.ay * (1 - e);
      rul.phi = rulFrom.phi + (targetPhi - rulFrom.phi) * e;
      renderRuler();
    });
    await pause(900);
    document.getElementById("tt-len").value = exactLen.toFixed(1);
    await pause(800);
    document.getElementById("tt-len-check").click();
    await pause(1400);

    // Stage 4: protractor onto the origin, then the measured angle
    const protFrom = { x: prot.cx, y: prot.cy };
    await animate(900, (e) => {
      prot.cx = protFrom.x * (1 - e);
      prot.cy = protFrom.y * (1 - e);
      renderProtractor();
    });
    await pause(900);
    document.getElementById("tt-ang").value = Math.round(exactAng);
    await pause(800);
    document.getElementById("tt-ang-check").click();
    await pause(2500);

    // Hand the current exercise back to the student, freshly reset
    demoRunning = false;
    loadExercise();
    document.getElementById("tt-demo").disabled = false;
  };

  document.getElementById("tt-demo").addEventListener("click", runDemo);

  buildGrid();
  ["v1", "v2", "r"].forEach(buildVector);
  buildProtractor();
  startSession();
})();
