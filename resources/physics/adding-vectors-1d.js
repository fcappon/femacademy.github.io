/* adding-vectors-1d.js — interactives for the Adding Vectors in One Dimension lesson */

(function () {
  const MINUS = "−"; // display minus sign
  const fmtSigned = (v) => (v > 0 ? "+" + v : v < 0 ? MINUS + (-v) : "0");
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  // One arrowhead size for every vector on the page (matches Lesson 1's heads).
  // Shafts stop at the head's base so no line shows underneath the head.
  const HEAD_LEN = 30, HEAD_HALF = 10.5;
  const headPoints = (tipX, y, dir) =>
    tipX + "," + y + " " + (tipX - dir * HEAD_LEN) + "," + (y - HEAD_HALF) + " " + (tipX - dir * HEAD_LEN) + "," + (y + HEAD_HALF);

  // Shared drawing of a shaft + head + zero-dot arrow between two SVG x positions
  const drawArrow = (els, tailX, tipX, y) => {
    if (tailX === tipX) {
      els.line.style.display = "none";
      els.head.style.display = "none";
      els.dot.style.display = "block";
      els.dot.setAttribute("cx", tailX);
      els.dot.setAttribute("cy", y);
      return;
    }
    const dir = tipX > tailX ? 1 : -1;
    els.dot.style.display = "none";
    els.head.style.display = "block";
    els.head.setAttribute("points", headPoints(tipX, y, dir));
    const shaftEnd = Math.abs(tipX - tailX) > HEAD_LEN ? tipX - dir * HEAD_LEN : tailX;
    if (shaftEnd === tailX) {
      els.line.style.display = "none";
    } else {
      els.line.style.display = "block";
      els.line.setAttribute("x1", tailX);
      els.line.setAttribute("x2", shaftEnd);
      els.line.setAttribute("y1", y);
      els.line.setAttribute("y2", y);
    }
  };

  /* ============================================================
     Interactive 1: adding two vectors on a number line
     ============================================================ */
  const AV_MIN = -8, AV_MAX = 8;
  const avX = (v) => 250 + 25 * v;
  let v1 = 3, v2 = 0, hasV2 = false;

  // Position an arrow (or a dot for zero) with its value label
  const setAvArrow = (prefix, from, to, y) => {
    const els = {
      line: document.getElementById(prefix + "-line"),
      head: document.getElementById(prefix + "-head"),
      dot: document.getElementById(prefix + "-dot")
    };
    drawArrow(els, avX(from), avX(to), y);
    document.getElementById(prefix + "-label").setAttribute("x", avX((from + to) / 2));
  };

  const avCaption = document.getElementById("av-caption");

  const updateInteractive1 = () => {
    setAvArrow("av-vec1", 0, v1, 62);
    document.getElementById("av-vec1-label").textContent = fmtSigned(v1);

    document.getElementById("av-vec2-group").style.display = hasV2 ? "block" : "none";
    if (hasV2) {
      setAvArrow("av-vec2", v1, v1 + v2, 38);
      document.getElementById("av-vec2-label").textContent = fmtSigned(v2);
    }

    const r = v1 + (hasV2 ? v2 : 0);
    setAvArrow("av-res", 0, r, 152);

    const phrase = r > 0
      ? "the resultant is " + r + " km east."
      : r < 0
        ? "the resultant is " + (-r) + " km west."
        : "the resultant is zero.";
    avCaption.textContent = hasV2
      ? "(" + fmtSigned(v1) + ") + (" + fmtSigned(v2) + ") = " + fmtSigned(r) + ", so " + phrase
      : "(" + fmtSigned(v1) + ") = " + fmtSigned(v1) + ", so " + phrase;
  };

  const changeV1 = (d) => {
    const nv = v1 + d;
    if (nv < AV_MIN || nv > AV_MAX) return;
    if (hasV2 && (nv + v2 < AV_MIN || nv + v2 > AV_MAX)) return;
    v1 = nv;
    updateInteractive1();
  };

  const changeV2 = (d) => {
    const nv = v2 + d;
    if (v1 + nv < AV_MIN || v1 + nv > AV_MAX) return;
    v2 = nv;
    updateInteractive1();
  };

  document.getElementById("av1MinusBtn").addEventListener("click", () => changeV1(-1));
  document.getElementById("av1PlusBtn").addEventListener("click", () => changeV1(1));
  document.getElementById("av2MinusBtn").addEventListener("click", () => changeV2(-1));
  document.getElementById("av2PlusBtn").addEventListener("click", () => changeV2(1));

  document.getElementById("addSecondVectorBtn").addEventListener("click", (e) => {
    hasV2 = true;
    v2 = (v1 + 2 <= AV_MAX) ? 2 : -2;
    e.target.style.display = "none";
    document.getElementById("av2Controls").style.display = "flex";
    document.getElementById("tipToTailNote").removeAttribute("hidden");
    updateInteractive1();
  });

  updateInteractive1();

  // Explanation toggle
  const toggleLink = document.getElementById("toggleExplanation");
  const toggleExplanation = () => {
    const explanation = document.getElementById("explanationText");
    const isHidden = explanation.style.display === "none";
    explanation.style.display = isHidden ? "block" : "none";
    toggleLink.textContent = isHidden
      ? "▲ Hide Explanation (Click to collapse)"
      : "▼ Show Explanation (Click to expand)";
  };
  toggleLink.addEventListener("click", (e) => { e.preventDefault(); toggleExplanation(); });
  toggleLink.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExplanation(); }
  });

  /* ============================================================
     Reflection exercise
     ============================================================ */
  const reflectionExplanation = document.getElementById("reflection-explanation");
  const initialReflectionText = reflectionExplanation.innerHTML;

  const submitReflection = () => {
    const input = document.getElementById("reflection-input");
    const answerText = input.value.trim();
    if (answerText !== "") {
      const newPara = document.createElement("p");
      newPara.textContent = answerText;
      document.getElementById("student-reflections").appendChild(newPara);
      reflectionExplanation.innerHTML = "Distance is the total length of the path travelled, regardless of direction — it is a scalar. Displacement is the straight line from start to finish, with a direction — it is a vector. Walking east and then west increases your distance, but the two movements partly cancel in your displacement.";
      input.value = "";
    }
  };

  document.getElementById("reflection-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); submitReflection(); }
  });
  document.getElementById("reflection-enter").addEventListener("click", submitReflection);
  document.getElementById("reflection-clear").addEventListener("click", () => {
    document.getElementById("reflection-input").value = "";
    document.getElementById("student-reflections").innerHTML = "";
    reflectionExplanation.innerHTML = initialReflectionText;
  });

  /* ============================================================
     Exercise part 1: build vector sums on a number line
     ============================================================ */
  const EX_MIN = -20, EX_MAX = 20;
  const exX = (v) => 250 + 10 * v;
  const SVGNS = "http://www.w3.org/2000/svg";
  const exSvg = document.getElementById("exerciseLine");
  const ROW_Y = [96, 62, 28];
  const COLOURS = ["var(--accent)", "var(--brand)", "var(--success)"];

  const mk = (tag, attrs) => {
    const el = document.createElementNS(SVGNS, tag);
    Object.entries(attrs).forEach(([k, val]) => el.setAttribute(k, val));
    return el;
  };

  // Build the axis: line, minor ticks every 1, major ticks and labels every 5
  const axis = document.getElementById("ex-axis");
  axis.appendChild(mk("line", { x1: exX(EX_MIN), y1: 126, x2: exX(EX_MAX), y2: 126, stroke: "var(--text)", "stroke-width": 2 }));
  for (let v = EX_MIN; v <= EX_MAX; v++) {
    const major = v % 5 === 0;
    const zero = v === 0;
    axis.appendChild(mk("line", {
      x1: exX(v), x2: exX(v),
      y1: zero ? 117 : major ? 119 : 123,
      y2: zero ? 135 : major ? 133 : 129,
      stroke: "var(--text)",
      "stroke-width": zero ? 3 : major ? 2 : 1
    }));
    if (major) {
      const label = mk("text", { x: exX(v), y: 150, "text-anchor": "middle", "font-size": 13, fill: "var(--text)" });
      label.textContent = v < 0 ? "-" + (-v) : String(v);
      axis.appendChild(label);
    }
  }

  const vectors = [];      // placed vector values, in placement order
  const vectorEls = [];    // corresponding SVG element groups
  const tokens = [...document.querySelectorAll("#vector-tray .vector-token")];
  const showResultantBox = document.getElementById("ex-show-resultant");

  // Convert a pointer event to SVG x coordinate
  const svgPointX = (e) => {
    const p = exSvg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const ctm = exSvg.getScreenCTM();
    return ctm ? p.matrixTransform(ctm.inverse()).x : 250;
  };

  // Allowed value range for vector i so every tip stays within the line
  const allowedRange = (i) => {
    let pre = 0;
    for (let j = 0; j < i; j++) pre += vectors[j];
    let lo = EX_MIN - pre, hi = EX_MAX - pre, rest = 0;
    for (let k = i + 1; k < vectors.length; k++) {
      rest += vectors[k];
      lo = Math.max(lo, EX_MIN - pre - rest);
      hi = Math.min(hi, EX_MAX - pre - rest);
    }
    return [lo, hi];
  };

  const updateExercise = () => {
    let pre = 0;
    vectors.forEach((val, i) => {
      const from = pre, to = pre + val;
      const y = ROW_Y[i];
      const els = vectorEls[i];
      drawArrow(els, exX(from), exX(to), y);
      els.label.setAttribute("x", exX((from + to) / 2));
      els.label.setAttribute("y", y - 9);
      els.label.textContent = fmtSigned(val);
      [els.handle, els.hit].forEach((h) => {
        h.setAttribute("cx", exX(to));
        h.setAttribute("cy", y);
      });
      pre = to;
    });

    // Tray shows the remaining tokens
    const remaining = 3 - vectors.length;
    tokens.forEach((t, j) => { t.style.display = j < remaining ? "" : "none"; });

    // Resultant
    const group = document.getElementById("ex-resultant");
    if (showResultantBox.checked && vectors.length > 0) {
      group.style.display = "block";
      const total = pre;
      drawArrow({
        line: document.getElementById("ex-res-line"),
        head: document.getElementById("ex-res-head"),
        dot: document.getElementById("ex-res-dot")
      }, exX(0), exX(total), 168);
      const label = document.getElementById("ex-res-label");
      label.textContent = "Resultant = " + fmtSigned(total);
      label.setAttribute("x", Math.min(430, Math.max(70, exX(total / 2))));
    } else {
      group.style.display = "none";
    }
  };

  // Create the SVG elements for a newly placed vector and wire up tip dragging
  const createVectorEls = (i) => {
    const colour = COLOURS[i];
    const g = mk("g", {});
    const line = mk("line", { stroke: colour, "stroke-width": 3 });
    const head = mk("polygon", { fill: colour });
    const dot = mk("circle", { r: 6, fill: colour, style: "display: none;" });
    const label = mk("text", { "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: colour });
    const handle = mk("circle", { r: 5, fill: "var(--bg)", stroke: colour, "stroke-width": 2, class: "vector-handle" });
    const hit = mk("circle", { r: 14, fill: "transparent", class: "vector-handle" });
    g.append(line, head, dot, label, handle, hit);
    document.getElementById("ex-vectors").appendChild(g);

    hit.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try { hit.setPointerCapture(e.pointerId); } catch (_) { /* pointer already inactive */ }
      const [lo, hi] = allowedRange(i);
      let pre = 0;
      for (let j = 0; j < i; j++) pre += vectors[j];
      const onMove = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        const raw = Math.round((svgPointX(ev) - 250) / 10 - pre);
        const nv = Math.min(hi, Math.max(lo, raw));
        if (nv !== vectors[i]) {
          vectors[i] = nv;
          updateExercise();
        }
      };
      const onUp = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });

    return { group: g, line, head, dot, label, handle, hit };
  };

  // Default value for a newly placed vector: +5 east if it fits, otherwise west
  const defaultValue = (end) => {
    const roomEast = EX_MAX - end;
    return roomEast >= 1 ? Math.min(5, roomEast) : -Math.min(5, end - EX_MIN);
  };

  const placeVector = (value) => {
    if (vectors.length >= 3) return;
    const i = vectors.length;
    vectors.push(value);
    vectorEls.push(createVectorEls(i));
    updateExercise();
  };

  const currentEnd = () => vectors.reduce((s, v) => s + v, 0);

  tokens.forEach((token) => {
    token.addEventListener("click", () => placeVector(defaultValue(currentEnd())));
    token.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", "vector");
    });
  });

  const svgWrap = document.getElementById("ex-svg-wrap");
  svgWrap.addEventListener("dragover", (e) => e.preventDefault());
  svgWrap.addEventListener("drop", (e) => {
    e.preventDefault();
    if (vectors.length >= 3) return;
    const end = currentEnd();
    let value = Math.round((svgPointX(e) - 250) / 10 - end);
    value = Math.min(EX_MAX - end, Math.max(EX_MIN - end, value));
    if (value === 0) value = defaultValue(end);
    placeVector(value);
  });

  showResultantBox.addEventListener("change", updateExercise);

  document.getElementById("restart-button").addEventListener("click", () => {
    vectorEls.forEach((els) => els.group.remove());
    vectors.length = 0;
    vectorEls.length = 0;
    updateExercise();
  });

  updateExercise();

  /* ============================================================
     Exercise part 2: question engine
     ============================================================ */
  const FEEDBACK_INCORRECT = "Not quite. Try dragging the vectors onto the number line above to see the resultant, then have another go.";
  const FEEDBACK_Q4_CORRECT = "Correct — the forces are balanced, so the resultant force is zero and the rope does not accelerate.";
  const FEEDBACK_CORRECT = "Correct — well done!";

  const templates = [
    {
      unit: "m",
      generate: () => {
        const a = randInt(1, 19);
        const b = randInt(1, 20 - a);
        return { a, b, answer: a + b };
      },
      text: (q) => "A person walks " + q.a + " metres east from their home to the postbox, then walks a further " + q.b + " metres east to the bus stop. What is their displacement? Take east as positive."
    },
    {
      unit: "N",
      generate: () => {
        const a = randInt(1, 19);
        const b = randInt(1, 20 - a);
        return { a, b, answer: -(a + b) };
      },
      text: (q) => "Two students push a broken-down go-kart along a straight road. One pushes with a force of " + q.a + " newtons to the left, the other with a force of " + q.b + " newtons to the left. Taking right as positive, what is the resultant force on the go-kart?"
    },
    {
      unit: "m",
      generate: () => {
        let a, b;
        if (Math.random() < 2 / 3) {
          a = randInt(2, 20);
          b = randInt(1, a - 1);
        } else {
          a = randInt(1, 19);
          b = randInt(a + 1, 20);
        }
        return { a, b, answer: b - a };
      },
      text: (q) => "A person walks " + q.a + " metres west from their home to the supermarket. They notice their keys have fallen out of their pocket, walk " + q.b + " metres east, and find them there. What is their displacement from home? Take east as positive."
    },
    {
      unit: "N",
      generate: () => {
        const a = randInt(1, 20);
        return { a, answer: 0 };
      },
      text: (q) => "In a tug of war, the team on the left side pulls the rope with a force of " + q.a + " newtons, while the team on the right side pulls with a force of " + q.a + " newtons. Taking right as positive, what is the resultant force on the rope?"
    }
  ];

  const solved = [false, false, false, false];
  let current = 0;
  let question = templates[0].generate();

  const answerInput = document.getElementById("answer-input");
  const questionFeedback = document.getElementById("question-feedback");
  const circles = [0, 1, 2, 3].map((i) => document.getElementById("circle-" + i));

  const renderQuestion = () => {
    document.getElementById("question-text").textContent = templates[current].text(question);
    document.getElementById("answer-unit").textContent = templates[current].unit;
    circles.forEach((c, i) => {
      c.classList.toggle("solved", solved[i]);
      c.classList.toggle("current", i === current);
    });
    answerInput.value = "";
  };

  const checkAnswer = () => {
    const raw = answerInput.value.trim().replace(/−/g, "-");
    if (!/^[+-]?\d+$/.test(raw) || parseInt(raw, 10) !== question.answer) {
      questionFeedback.textContent = FEEDBACK_INCORRECT;
      return;
    }
    solved[current] = true;
    questionFeedback.textContent = current === 3 ? FEEDBACK_Q4_CORRECT : FEEDBACK_CORRECT;
    if (solved.every(Boolean)) {
      document.getElementById("completion-message").removeAttribute("hidden");
    }
    current = (current + 1) % 4;
    question = templates[current].generate();
    renderQuestion();
  };

  const newQuestion = () => {
    question = templates[current].generate();
    questionFeedback.textContent = "";
    renderQuestion();
  };

  document.getElementById("check-button").addEventListener("click", checkAnswer);
  document.getElementById("new-question-button").addEventListener("click", newQuestion);
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); checkAnswer(); }
  });
  circles.forEach((c, i) => {
    c.addEventListener("click", () => {
      current = i;
      question = templates[current].generate();
      questionFeedback.textContent = "";
      renderQuestion();
    });
  });

  renderQuestion();
})();
