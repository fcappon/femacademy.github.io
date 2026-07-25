/* adding-vectors-2d-gcse.js — Interactive 1 (adding two vectors) for the GCSE 2D page */

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
     Interactive 1: adding two vectors (free x and y components)
     ============================================================ */
  buildAxes("i1-axes");
  const i1v1 = { x: 6, y: 2 };
  const i1v2 = { x: -2, y: 6 };
  const i1va = grabEls("i1-va"), i1vb = grabEls("i1-vb"), i1res = grabEls("i1-res");
  const i1vaLabel = document.getElementById("i1-va-label");
  const i1vbLabel = document.getElementById("i1-vb-label");
  const i1calc = document.getElementById("i1-calc");

  // Place a vector's name label at its midpoint, offset perpendicular to it
  const placeVecLabel = (label, x1u, y1u, x2u, y2u) => {
    const px1 = X(x1u), py1 = Y(y1u), px2 = X(x2u), py2 = Y(y2u);
    const dx = px2 - px1, dy = py2 - py1;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      label.style.display = "none";
      return;
    }
    const ux = dx / len, uy = dy / len;
    label.style.display = "block";
    label.setAttribute("x", ((px1 + px2) / 2 + 16 * uy).toFixed(1));
    label.setAttribute("y", ((py1 + py2) / 2 - 16 * ux + 4).toFixed(1));
  };

  const updateInteractive1 = () => {
    const rx = i1v1.x + i1v2.x, ry = i1v1.y + i1v2.y;

    drawArrow2D(i1va, X(0), Y(0), X(i1v1.x), Y(i1v1.y));
    placeVecLabel(i1vaLabel, 0, 0, i1v1.x, i1v1.y);

    drawArrow2D(i1vb, X(i1v1.x), Y(i1v1.y), X(rx), Y(ry));
    placeVecLabel(i1vbLabel, i1v1.x, i1v1.y, rx, ry);

    drawArrow2D(i1res, X(0), Y(0), X(rx), Y(ry));

    const v1zero = i1v1.x === 0 && i1v1.y === 0;
    const v2zero = i1v2.x === 0 && i1v2.y === 0;
    if (v1zero && v2zero) {
      i1calc.innerHTML = "<div>Give each vector a size to see the calculation.</div>";
      return;
    }
    let html = "<div>R = " + Math.hypot(rx, ry).toFixed(1) + "</div>";
    if (rx === 0 && ry === 0) {
      html += "<div>The two vectors cancel — the resultant is zero.</div>";
    } else if (rx === 0) {
      html += "<div>θ = " + (ry > 0 ? "90" : MINUS + "90") + "°</div>";
    } else if (ry === 0) {
      html += "<div>θ = " + (rx > 0 ? "0" : "180") + "°</div>";
    } else {
      const ang = toDeg(Math.atan(Math.abs(ry) / Math.abs(rx))).toFixed(1);
      const wording = (ry > 0 ? "above" : "below") + " the " + (rx > 0 ? "positive" : "negative") + " x-axis";
      html += "<div>θ = tan⁻¹(" + Math.abs(ry) + "/" + Math.abs(rx) + ") = " + ang + "° " + wording + "</div>";
    }
    if (!v1zero && !v2zero && i1v1.x * i1v2.y - i1v1.y * i1v2.x === 0) {
      html += "<div>The vectors now lie along a single line — this is the 1D case from the previous lesson: just add the values.</div>";
    }
    i1calc.innerHTML = html;
  };

  // Keep each component and the resultant tip within the plot
  const i1Change = (vec, axis, d) => {
    const nv = vec[axis] + d;
    const sum = i1v1[axis] + i1v2[axis] + d;
    if (nv < -10 || nv > 10 || sum < -10 || sum > 10) return;
    vec[axis] = nv;
    updateInteractive1();
  };

  bindStepper(document.getElementById("i1v1xMinus"), () => i1Change(i1v1, "x", -1));
  bindStepper(document.getElementById("i1v1xPlus"), () => i1Change(i1v1, "x", 1));
  bindStepper(document.getElementById("i1v1yMinus"), () => i1Change(i1v1, "y", -1));
  bindStepper(document.getElementById("i1v1yPlus"), () => i1Change(i1v1, "y", 1));
  bindStepper(document.getElementById("i1v2xMinus"), () => i1Change(i1v2, "x", -1));
  bindStepper(document.getElementById("i1v2xPlus"), () => i1Change(i1v2, "x", 1));
  bindStepper(document.getElementById("i1v2yMinus"), () => i1Change(i1v2, "y", -1));
  bindStepper(document.getElementById("i1v2yPlus"), () => i1Change(i1v2, "y", 1));
  updateInteractive1();

  wireToggle("toggleThink", "thinkText", "▼ Show Answer (Click to expand)", "▲ Hide Answer (Click to collapse)");

})();
