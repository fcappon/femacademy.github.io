/* adding-vectors-2d-alevel.js — Interactive 2 (components) and exercises for the A-Level 2D page */

(function () {
  const MINUS = "−"; // display minus sign
  const fmtSigned = (v) => (v > 0 ? "+" + v : v < 0 ? MINUS + (-v) : "0");
  const fmtNum = (v) => (v < 0 ? MINUS + (-v) : String(v));
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Parse a decimal number, accepting a leading + / - / − sign
  const parseNum = (input) => {
    const s = input.value.trim().replace(/−/g, "-");
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return null;
    return parseFloat(s);
  };

  // Step once on tap/click, then auto-repeat while the button is held down.
  const bindStepper = (btn, fn) => {
    let delay = null, repeat = null;
    const stop = () => {
      clearTimeout(delay);
      clearInterval(repeat);
      delay = repeat = null;
    };
    btn.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      fn();
      delay = setTimeout(() => { repeat = setInterval(fn, 90); }, 400);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => btn.addEventListener(type, stop));
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
    btn.addEventListener("click", (e) => { if (e.detail === 0) fn(); });
  };

  // Collapsible toggle in the established ▼/▲ pattern
  const wireToggle = (linkId, boxId, showText, hideText) => {
    const link = document.getElementById(linkId);
    const box = document.getElementById(boxId);
    const flip = () => {
      const isHidden = box.style.display === "none";
      box.style.display = isHidden ? "block" : "none";
      link.textContent = isHidden ? hideText : showText;
    };
    link.addEventListener("click", (e) => { e.preventDefault(); flip(); });
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
  };

  /* ============================================================
     Shared 2D plot machinery (square scale, −10…+10 both axes)
     ============================================================ */
  const SVGNS = "http://www.w3.org/2000/svg";
  const HEAD_LEN = 30, HEAD_HALF = 10.5;
  const X = (v) => 250 + 20 * v;
  const Y = (w) => 250 - 20 * w;

  const mk = (tag, attrs) => {
    const el = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, val]) => el.setAttribute(k, val));
    return el;
  };

  const buildAxes = (groupId) => {
    const g = document.getElementById(groupId);
    g.appendChild(mk("line", { x1: 32, y1: 250, x2: 468, y2: 250, stroke: "var(--text)", "stroke-width": 2 }));
    g.appendChild(mk("line", { x1: 250, y1: 468, x2: 250, y2: 32, stroke: "var(--text)", "stroke-width": 2 }));
    for (let v = -10; v <= 10; v++) {
      if (v === 0) continue;
      const major = v % 5 === 0;
      g.appendChild(mk("line", {
        x1: X(v), x2: X(v),
        y1: major ? 245 : 247, y2: major ? 255 : 253,
        stroke: "var(--text)", "stroke-width": major ? 2 : 1
      }));
      g.appendChild(mk("line", {
        y1: Y(v), y2: Y(v),
        x1: major ? 245 : 247, x2: major ? 255 : 253,
        stroke: "var(--text)", "stroke-width": major ? 2 : 1
      }));
      if (major) {
        const lx = mk("text", { x: X(v), y: 270, "text-anchor": "middle", "font-size": 12, fill: "var(--text)" });
        lx.textContent = v < 0 ? MINUS + (-v) : String(v);
        g.appendChild(lx);
        const ly = mk("text", { x: 238, y: Y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "var(--text)" });
        ly.textContent = v < 0 ? MINUS + (-v) : String(v);
        g.appendChild(ly);
      }
    }
    const zero = mk("text", { x: 242, y: 266, "text-anchor": "end", "font-size": 12, fill: "var(--muted)" });
    zero.textContent = "0";
    g.appendChild(zero);
    const xName = mk("text", { x: 476, y: 254, "text-anchor": "middle", "font-size": 14, "font-style": "italic", fill: "var(--text)" });
    xName.textContent = "x";
    g.appendChild(xName);
    const yName = mk("text", { x: 242, y: 42, "text-anchor": "end", "font-size": 14, "font-style": "italic", fill: "var(--text)" });
    yName.textContent = "y";
    g.appendChild(yName);
  };

  // Draw an arrow between two pixel positions: shaft stops at the head's base
  const drawArrow2D = (els, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      els.line.style.display = "none";
      els.head.style.display = "none";
      els.dot.style.display = "block";
      els.dot.setAttribute("cx", x1);
      els.dot.setAttribute("cy", y1);
      return;
    }
    const ux = dx / len, uy = dy / len;
    const bx = x2 - HEAD_LEN * ux, by = y2 - HEAD_LEN * uy;
    els.dot.style.display = "none";
    els.head.style.display = "block";
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
  };

  const grabEls = (prefix) => ({
    line: document.getElementById(prefix + "-line"),
    head: document.getElementById(prefix + "-head"),
    dot: document.getElementById(prefix + "-dot")
  });

  /* ============================================================
     Interactive 2: components of a vector
     ============================================================ */
  buildAxes("i2-axes");
  let vX = 6, vY = 8;
  const i2cx = grabEls("i2-cx"), i2cy = grabEls("i2-cy"), i2v = grabEls("i2-v");
  const i2cxLabel = document.getElementById("i2-cx-label");
  const i2cyLabel = document.getElementById("i2-cy-label");
  const i2vLabel = document.getElementById("i2-v-label");
  const i2arc = document.getElementById("i2-arc");
  const i2theta = document.getElementById("i2-theta");
  const calcText = document.getElementById("calcText");

  // Components hide entirely (no dot) at zero length
  const drawComponent = (els, label, x1, y1, x2, y2) => {
    if (x1 === x2 && y1 === y2) {
      els.line.style.display = "none";
      els.head.style.display = "none";
      els.dot.style.display = "none";
      label.style.display = "none";
    } else {
      drawArrow2D(els, x1, y1, x2, y2);
      els.dot.style.display = "none";
      label.style.display = "block";
    }
  };

  const updateInteractive2 = () => {
    drawComponent(i2cx, i2cxLabel, X(0), Y(0), X(vX), Y(0));
    i2cxLabel.setAttribute("x", X(vX / 2));
    i2cxLabel.setAttribute("y", 284);

    drawComponent(i2cy, i2cyLabel, X(vX), Y(0), X(vX), Y(vY));
    i2cyLabel.setAttribute("x", Math.min(X(vX) + 10, 452));
    i2cyLabel.setAttribute("y", Y(vY / 2) + 4);

    drawArrow2D(i2v, X(0), Y(0), X(vX), Y(vY));
    const dx = X(vX) - 250, dy = Y(vY) - 250;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      i2vLabel.style.display = "none";
    } else {
      const ux = dx / len, uy = dy / len;
      i2vLabel.style.display = "block";
      i2vLabel.setAttribute("x", 250 + dx / 2 + 16 * uy);
      i2vLabel.setAttribute("y", 250 + dy / 2 - 16 * ux + 4);
    }

    // Angle arc from the positive x-axis to V
    const phi = Math.atan2(vY, vX);
    if (len === 0 || phi === 0) {
      i2arc.style.display = "none";
      i2theta.style.display = "none";
    } else {
      i2arc.style.display = "block";
      i2theta.style.display = "block";
      const sweep = phi > 0 ? 0 : 1;
      const ex = 250 + 35 * Math.cos(phi);
      const ey = 250 - 35 * Math.sin(phi);
      i2arc.setAttribute("d", "M 285 250 A 35 35 0 0 " + sweep + " " + ex.toFixed(1) + " " + ey.toFixed(1));
      i2theta.setAttribute("x", (250 + 48 * Math.cos(phi / 2)).toFixed(1));
      i2theta.setAttribute("y", (250 - 48 * Math.sin(phi / 2) + 4).toFixed(1));
    }

    // Live calculation (kept up to date even while collapsed)
    if (vX === 0 && vY === 0) {
      calcText.innerHTML = "<div>Set V<sub>x</sub> and V<sub>y</sub> to see the calculation.</div>";
      return;
    }
    const mag = Math.hypot(vX, vY).toFixed(1);
    let html = "<div>V = √((" + fmtNum(vX) + ")² + (" + fmtNum(vY) + ")²) = √(" + (vX * vX + vY * vY) + ") = " + mag + "</div>";
    if (vX === 0) {
      html += "<div>θ = " + (vY > 0 ? "90" : MINUS + "90") + "°</div>";
    } else if (vY === 0) {
      html += "<div>θ = " + (vX > 0 ? "0" : "180") + "°</div>";
    } else {
      const ang = toDeg(Math.atan(Math.abs(vY) / Math.abs(vX))).toFixed(1);
      const wording = (vY > 0 ? "above" : "below") + " the " + (vX > 0 ? "positive" : "negative") + " x-axis";
      html += "<div>θ = tan⁻¹(" + Math.abs(vY) + "/" + Math.abs(vX) + ") = " + ang + "° " + wording + "</div>";
    }
    calcText.innerHTML = html;
  };

  bindStepper(document.getElementById("i2vxMinus"), () => { if (vX > -10) { vX--; updateInteractive2(); } });
  bindStepper(document.getElementById("i2vxPlus"), () => { if (vX < 10) { vX++; updateInteractive2(); } });
  bindStepper(document.getElementById("i2vyMinus"), () => { if (vY > -10) { vY--; updateInteractive2(); } });
  bindStepper(document.getElementById("i2vyPlus"), () => { if (vY < 10) { vY++; updateInteractive2(); } });
  updateInteractive2();

  wireToggle("toggleCalc", "calcText", "▼ Show the calculation of V and θ", "▲ Hide the calculation of V and θ");

  /* ============================================================
     Exercise set 1: resultant vectors (Pythagorean triples)
     ============================================================ */
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [10, 24, 26], [20, 21, 29], [18, 24, 30]];
  const pickLegs = () => {
    const t = TRIPLES[randInt(0, TRIPLES.length - 1)];
    return Math.random() < 0.5 ? [t[0], t[1], t[2]] : [t[1], t[0], t[2]];
  };
  const NOT_QUITE = "Not quite. Sketch the two vectors tip-to-tail, check Pythagoras for the magnitude and tan⁻¹ for the angle, then have another go.";

  const ex1Templates = [
    {
      generate: () => {
        const [a, b, c] = pickLegs();
        return {
          mag: c, ang: toDeg(Math.atan(b / a)), unit: "km",
          html: "A jogger runs " + a + " km east and then " + b + " km north. What is the magnitude of their displacement from the start, and the angle it makes north of east?"
        };
      }
    },
    {
      generate: () => {
        const [p, q, c] = pickLegs();
        const s = randInt(1, Math.min(10, 30 - q));
        const n = q + s;
        return {
          mag: c, ang: toDeg(Math.atan(q / p)), unit: "blocks",
          html: "A delivery van drives " + n + " blocks north, then " + p + " blocks east, then " + s + " blocks south. The blocks are all of equal length. What is the magnitude of the van's displacement from the start, in blocks, and the angle it makes north of east?"
        };
      }
    },
    {
      generate: () => {
        const [p, q, c] = pickLegs();
        const sign = Math.random() < 0.5 ? 1 : -1;
        return {
          mag: c, ang: sign * toDeg(Math.atan(q / p)), unit: "units",
          html: "A vector V has components V<sub>x</sub> = +" + p + " units and V<sub>y</sub> = " + (sign > 0 ? "+" : MINUS) + q + " units. Find the magnitude of V and the angle it makes with the positive x-axis. (A negative angle means below the axis.)"
        };
      }
    }
  ];

  const ex1Solved = [false, false, false];
  let ex1Current = 0;
  let ex1Q = ex1Templates[0].generate();
  const ex1Mag = document.getElementById("ex1-mag");
  const ex1Ang = document.getElementById("ex1-ang");
  const ex1Feedback = document.getElementById("ex1-feedback");
  const ex1Circles = [0, 1, 2].map((i) => document.getElementById("ex1-circle-" + i));

  const ex1Render = () => {
    document.getElementById("ex1-question").innerHTML = ex1Q.html;
    document.getElementById("ex1-mag-unit").textContent = ex1Q.unit;
    ex1Circles.forEach((c, i) => {
      c.classList.toggle("solved", ex1Solved[i]);
      c.classList.toggle("current", i === ex1Current);
    });
    ex1Mag.value = "";
    ex1Ang.value = "";
  };

  const ex1Check = () => {
    const m = parseNum(ex1Mag);
    const an = parseNum(ex1Ang);
    const magOK = m !== null && Math.abs(m - ex1Q.mag) < 1e-9;
    const angOK = an !== null && Math.abs(an - ex1Q.ang) <= 0.2 + 1e-9;
    if (magOK && angOK) {
      ex1Solved[ex1Current] = true;
      ex1Feedback.textContent = "Correct — well done!";
      if (ex1Solved.every(Boolean)) {
        document.getElementById("ex1-complete").removeAttribute("hidden");
      }
      ex1Current = (ex1Current + 1) % 3;
      ex1Q = ex1Templates[ex1Current].generate();
      ex1Render();
    } else {
      ex1Feedback.textContent = NOT_QUITE + (magOK && !angOK ? " Is your calculator in degrees mode?" : "");
    }
  };

  document.getElementById("ex1-check").addEventListener("click", ex1Check);
  document.getElementById("ex1-new").addEventListener("click", () => {
    ex1Q = ex1Templates[ex1Current].generate();
    ex1Feedback.textContent = "";
    ex1Render();
  });
  [ex1Mag, ex1Ang].forEach((input) => input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); ex1Check(); }
  }));
  ex1Circles.forEach((c, i) => {
    c.addEventListener("click", () => {
      ex1Current = i;
      ex1Q = ex1Templates[i].generate();
      ex1Feedback.textContent = "";
      ex1Render();
    });
  });
  ex1Render();

  /* ============================================================
     Guided exercise: drone velocity components
     ============================================================ */
  const GX_HINTS = [
    "Is your calculator in degrees mode?",
    "Check which side is adjacent to the angle: the angle is measured from north, so cos goes with north.",
    "Did you convert minutes to seconds?"
  ];
  const gx = { v: 0, th: 0, t: 0 };
  const gxAttempts = [0, 0, 0, 0];

  const gxAnswers = () => {
    const vN = gx.v * Math.cos(toRad(gx.th));
    const vW = gx.v * Math.sin(toRad(gx.th));
    return [vN, vW, vN * gx.t * 60, vW * gx.t * 60];
  };

  // Draw the current question's velocity vector west of north on the grid
  const gxDrawDiagram = () => {
    const rad = toRad(gx.th);
    const ox = 300, oy = 280, len = 210;
    const tx = ox - len * Math.sin(rad), ty = oy - len * Math.cos(rad);
    drawArrow2D(grabEls("gx-v"), ox, oy, tx, ty);
    const ux = (tx - ox) / len, uy = (ty - oy) / len;
    const label = document.getElementById("gx-v-label");
    label.setAttribute("x", ((ox + tx) / 2 + 36 * uy).toFixed(1));
    label.setAttribute("y", ((oy + ty) / 2 - 36 * ux + 4).toFixed(1));
    label.textContent = "v = " + gx.v + " m/s";
    const arc = document.getElementById("gx-arc");
    arc.setAttribute("d", "M 300 225 A 55 55 0 0 0 " +
      (ox - 55 * Math.sin(rad)).toFixed(1) + " " + (oy - 55 * Math.cos(rad)).toFixed(1));
    const arcLabel = document.getElementById("gx-arc-label");
    arcLabel.setAttribute("x", (ox - 78 * Math.sin(rad / 2)).toFixed(1));
    arcLabel.setAttribute("y", (oy - 78 * Math.cos(rad / 2) + 4).toFixed(1));
    arcLabel.textContent = gx.th + "°";
  };

  const gxGenerate = () => {
    gx.v = randInt(10, 30);
    gx.th = randInt(25, 65);
    gx.t = [2, 4, 5, 10][randInt(0, 3)];
    document.getElementById("gx-v").textContent = gx.v;
    document.getElementById("gx-theta").textContent = gx.th;
    document.getElementById("gx-t").textContent = gx.t;
    document.getElementById("gx-t2").textContent = gx.t;
    gxDrawDiagram();
  };

  const gxReset = () => {
    gxGenerate();
    for (let i = 1; i <= 4; i++) {
      const step = document.getElementById("gx-step-" + i);
      step.classList.remove("done");
      if (i > 1) step.classList.add("d-none");
      const input = document.getElementById("gx-in-" + i);
      input.value = "";
      input.disabled = false;
      document.getElementById("gx-check-" + i).disabled = false;
      document.getElementById("gx-fb-" + i).textContent = "";
      gxAttempts[i - 1] = 0;
    }
    document.getElementById("gx-complete").setAttribute("hidden", "");
  };

  const gxCheck = (i) => {
    const answers = gxAnswers();
    const exact = answers[i - 1];
    const u = parseNum(document.getElementById("gx-in-" + i));
    const tolerance = i <= 2 ? 0.1 + 1e-9 : exact * 0.01 + 1e-9;
    if (u !== null && Math.abs(u - exact) <= tolerance) {
      document.getElementById("gx-step-" + i).classList.add("done");
      document.getElementById("gx-in-" + i).disabled = true;
      document.getElementById("gx-check-" + i).disabled = true;
      document.getElementById("gx-fb-" + i).textContent = "";
      if (i < 4) {
        document.getElementById("gx-step-" + (i + 1)).classList.remove("d-none");
      } else {
        document.getElementById("gx-complete").removeAttribute("hidden");
      }
    } else {
      gxAttempts[i - 1]++;
      const hints = i <= 2 ? GX_HINTS.slice(0, 2) : GX_HINTS;
      const hint = hints[Math.min(gxAttempts[i - 1] - 1, hints.length - 1)];
      document.getElementById("gx-fb-" + i).textContent = "Not quite. " + hint;
    }
  };

  for (let i = 1; i <= 4; i++) {
    document.getElementById("gx-check-" + i).addEventListener("click", () => gxCheck(i));
    document.getElementById("gx-in-" + i).addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); gxCheck(i); }
    });
  }
  document.getElementById("gx-new").addEventListener("click", gxReset);
  gxReset();

  /* ============================================================
     Unguided exercise: force components
     ============================================================ */
  const FX_HINT = "Remember the drone question: the component adjacent to the given angle uses cos, the opposite one uses sin. Here the angle is measured from the horizontal.";
  const round1 = (x) => Math.round(x * 10) / 10;
  const fx = { F: 0, th: 0 };
  let fxAttempts = 0;

  const fxGenerate = () => {
    fx.F = 10 * randInt(5, 40);
    fx.th = randInt(20, 70);
    document.getElementById("fx-F").textContent = fx.F;
    document.getElementById("fx-theta").textContent = fx.th;
  };

  const fxReset = () => {
    fxGenerate();
    fxAttempts = 0;
    document.getElementById("fx-h").value = "";
    document.getElementById("fx-v").value = "";
    document.getElementById("fx-feedback").textContent = "";
    document.getElementById("fx-complete").setAttribute("hidden", "");
  };

  const fxCheck = () => {
    const targetH = round1(fx.F * Math.cos(toRad(fx.th)));
    const targetV = round1(fx.F * Math.sin(toRad(fx.th)));
    const h = parseNum(document.getElementById("fx-h"));
    const v = parseNum(document.getElementById("fx-v"));
    const ok = h !== null && v !== null &&
      Math.abs(h - targetH) <= 0.1 + 1e-9 &&
      Math.abs(v - targetV) <= 0.1 + 1e-9;
    if (ok) {
      document.getElementById("fx-feedback").textContent = "";
      document.getElementById("fx-complete").removeAttribute("hidden");
    } else {
      fxAttempts++;
      document.getElementById("fx-feedback").textContent =
        FX_HINT + (fxAttempts >= 2 ? " Is your calculator in degrees mode?" : "");
    }
  };

  document.getElementById("fx-check").addEventListener("click", fxCheck);
  document.getElementById("fx-new").addEventListener("click", fxReset);
  ["fx-h", "fx-v"].forEach((id) => document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); fxCheck(); }
  }));
  fxReset();
})();
