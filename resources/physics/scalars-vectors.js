/* scalars-vectors.js — interactives for the Scalars and Vectors lesson */

(function () {
  /* ============================================================
     Interactive 1: scalar and vector on 1D number lines
     ============================================================ */
  let currentScalarValue = 0;
  const updateScalarPosition = () => {
    // Each step moves by 50px; origin (0) is at x=250
    const dot = document.getElementById("scalar-dot");
    dot.setAttribute("cx", 250 + 50 * currentScalarValue);
  };
  document.getElementById("scalarMinusBtn").addEventListener("click", () => {
    if (currentScalarValue > -4) { currentScalarValue--; updateScalarPosition(); }
  });
  document.getElementById("scalarPlusBtn").addEventListener("click", () => {
    if (currentScalarValue < 4) { currentScalarValue++; updateScalarPosition(); }
  });

  let currentVectorValue = 2;
  const updateVectorPosition = () => {
    const vectorLine = document.getElementById("vector-line");
    const vectorDot = document.getElementById("vector-dot");
    if (currentVectorValue === 0) {
      vectorLine.style.display = "none";
      vectorDot.style.display = "block";
    } else {
      vectorLine.style.display = "block";
      vectorDot.style.display = "none";
      vectorLine.setAttribute("x2", 250 + 50 * currentVectorValue);
    }
  };
  document.getElementById("vectorMinusBtn").addEventListener("click", () => {
    if (currentVectorValue > -4) { currentVectorValue--; updateVectorPosition(); }
  });
  document.getElementById("vectorPlusBtn").addEventListener("click", () => {
    if (currentVectorValue < 4) { currentVectorValue++; updateVectorPosition(); }
  });
  updateVectorPosition();

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
     Exercise: drag-and-drop (with tap-to-place for touchscreens)
     ============================================================ */
  const items = [
    { id: "mass", label: "Mass" },
    { id: "velocity", label: "Velocity" },
    { id: "temperature", label: "Temperature" },
    { id: "force", label: "Force" },
    { id: "speed", label: "Speed" },
    { id: "energy", label: "Energy" },
    { id: "distance", label: "Distance" },
    { id: "electrical-potential", label: "Electrical potential" },
    { id: "acceleration", label: "Acceleration" },
    { id: "displacement", label: "Displacement" },
    { id: "momentum", label: "Momentum" },
    { id: "weight", label: "Weight" },
    { id: "electrical-field", label: "Electrical field" }
  ];

  const scalarIDs = ["mass", "temperature", "speed", "energy", "distance", "electrical-potential"];

  let currentIndex = 0;
  let initialCompletionText = "";

  const displayNextItem = () => {
    const draggablesContainer = document.getElementById("draggables");
    draggablesContainer.innerHTML = "";

    if (currentIndex < items.length) {
      const item = items[currentIndex];
      const newElem = document.createElement("div");
      newElem.id = item.id;
      newElem.className = "draggable";
      newElem.draggable = true;
      newElem.textContent = item.label;
      newElem.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.id);
      });
      draggablesContainer.appendChild(newElem);
    } else {
      document.getElementById("completion-message").innerHTML = `
        <h2>Great work classifying these quantities!</h2>
        <p><strong>Remember:</strong></p>
        <dl>
          <dt>Scalars</dt>
          <dd>(e.g., mass, temperature, energy) have magnitude (size) only and no direction.</dd>
          <dt>Vectors</dt>
          <dd>(e.g., velocity, force, acceleration) have both magnitude and direction.</dd>
        </dl>
        <p>
          Some pairs, like <strong>mass vs. weight</strong> or <strong>distance vs. displacement</strong>, highlight this distinction particularly well. As you move on to topics like <strong>force diagrams</strong>, <strong>projectile motion</strong>, or <strong>electric fields</strong>, be sure to use vector concepts — directions really matter in calculating resultant forces or field strengths.
        </p>
      `;
    }
  };

  // Classify the current item into a zone (shared by drop and tap)
  const classifyCurrentItem = (dropZone) => {
    if (currentIndex >= items.length) return;
    const draggedItem = document.getElementById(items[currentIndex].id);
    const feedback = document.getElementById("feedback");
    if (!draggedItem) return;

    const correctType = scalarIDs.includes(draggedItem.id) ? "scalars" : "vectors";

    if (dropZone.id === correctType) {
      dropZone.appendChild(draggedItem);
      draggedItem.draggable = false;
      feedback.textContent = "";
      currentIndex++;
      displayNextItem();
    } else {
      feedback.textContent = `Oops! "${draggedItem.textContent}" doesn't belong there. Remember, scalars have magnitude only, while vectors have both magnitude and direction. Try again!`;
    }
    dropZone.classList.remove("dragover");
  };

  const restartExercise = () => {
    currentIndex = 0;
    document.getElementById("draggables").innerHTML = "";
    document.getElementById("scalars").innerHTML = '<h3>Scalars</h3><p class="drop-zone-hint">Magnitude only</p>';
    document.getElementById("vectors").innerHTML = '<h3>Vectors</h3><p class="drop-zone-hint">Magnitude and direction</p>';
    document.getElementById("feedback").textContent = "";
    document.getElementById("completion-message").innerHTML = initialCompletionText;
    displayNextItem();
  };

  initialCompletionText = document.getElementById("completion-message").innerHTML;
  displayNextItem();

  [document.getElementById("scalars"), document.getElementById("vectors")].forEach((zone) => {
    zone.addEventListener("dragover", (e) => e.preventDefault());
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      classifyCurrentItem(zone);
    });
    zone.addEventListener("dragenter", () => zone.classList.add("dragover"));
    zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
    // Tap/click fallback for touchscreens: tapping a zone classifies the current item
    zone.addEventListener("click", () => classifyCurrentItem(zone));
  });

  document.getElementById("restart-button").addEventListener("click", restartExercise);

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
      reflectionExplanation.innerHTML = "When comparing two vector quantities of the same type, you must take both their magnitude and direction into account. For scalars, only the magnitude matters. This means that any mathematical operation involving vectors — like addition, subtraction, or multiplication — must consider both magnitude and direction, making vector calculations more complex than those involving scalars.";
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
})();
