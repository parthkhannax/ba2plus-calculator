const screen = document.getElementById("screen");
const statusRow = document.getElementById("statusRow");
const keypad = document.querySelector(".keypad");
const tvmPanel = document.querySelector(".tvm-panel");

const tvmInputs = {
  n: document.getElementById("n"),
  iy: document.getElementById("iy"),
  pv: document.getElementById("pv"),
  pmt: document.getElementById("pmt"),
  fv: document.getElementById("fv")
};

let expression = "0";
let activeMode = "basic";

const formatNumber = (value) => {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  if (Math.abs(value) >= 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(6);
  }

  return value
    .toFixed(8)
    .replace(/\.?0+$/, "");
};

const setStatus = (text, isError = false) => {
  statusRow.textContent = text;
  statusRow.style.color = isError ? "var(--danger)" : "var(--accent-soft)";
};

const updateScreen = (value = expression) => {
  screen.textContent = value;
};

const clearAll = () => {
  expression = "0";
  Object.values(tvmInputs).forEach((input) => {
    input.value = "";
  });
  updateScreen("0");
  setStatus(`Mode: ${activeMode === "basic" ? "Basic" : "TVM"}`);
};

const appendValue = (value) => {
  if (expression === "0" && value !== ".") {
    expression = value;
  } else {
    expression += value;
  }
  updateScreen();
};

const safeEvaluate = () => {
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    expression = String(result);
    updateScreen(formatNumber(result));
    setStatus(`Mode: ${activeMode === "basic" ? "Basic" : "TVM"}`);
  } catch {
    updateScreen("Error");
    setStatus("Invalid expression", true);
    expression = "0";
  }
};

const toggleSign = () => {
  if (expression.startsWith("-")) {
    expression = expression.slice(1);
  } else {
    expression = `-${expression}`;
  }
  updateScreen();
};

const percent = () => {
  try {
    const numeric = Number(expression);
    expression = String(numeric / 100);
    updateScreen(formatNumber(numeric / 100));
  } catch {
    updateScreen("Error");
    setStatus("Percent failed", true);
    expression = "0";
  }
};

const numericValue = (key) => {
  const raw = tvmInputs[key].value;
  if (raw === "") {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const solveByBisection = (fn, left, right, maxIter = 120, tolerance = 1e-7) => {
  let fLeft = fn(left);
  let fRight = fn(right);

  if (fLeft === 0) return left;
  if (fRight === 0) return right;

  for (let expand = 0; expand < 12 && fLeft * fRight > 0; expand += 1) {
    left -= 0.5;
    right += 0.5;
    fLeft = fn(left);
    fRight = fn(right);
  }

  if (fLeft * fRight > 0) {
    return null;
  }

  for (let i = 0; i < maxIter; i += 1) {
    const mid = (left + right) / 2;
    const fMid = fn(mid);

    if (Math.abs(fMid) < tolerance) {
      return mid;
    }

    if (fLeft * fMid < 0) {
      right = mid;
      fRight = fMid;
    } else {
      left = mid;
      fLeft = fMid;
    }
  }

  return (left + right) / 2;
};

const tvmEquation = ({ n, iy, pv, pmt, fv }) => {
  const r = iy / 100;

  if (Math.abs(r) < 1e-10) {
    return pv + pmt * n + fv;
  }

  const growth = (1 + r) ** n;
  return pv * growth + pmt * ((growth - 1) / r) + fv;
};

const computeTVM = (target) => {
  const values = {
    n: numericValue("n"),
    iy: numericValue("iy"),
    pv: numericValue("pv"),
    pmt: numericValue("pmt"),
    fv: numericValue("fv")
  };

  const missing = Object.entries(values)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  if (missing.length > 1 || (missing.length === 1 && missing[0] !== target)) {
    setStatus("Fill all fields except one computed target", true);
    return;
  }

  try {
    if (target === "fv") {
      const { n, iy, pv, pmt } = values;
      const r = iy / 100;
      const result = Math.abs(r) < 1e-10 ? -(pv + pmt * n) : -(pv * (1 + r) ** n + pmt * (((1 + r) ** n - 1) / r));
      tvmInputs.fv.value = formatNumber(result);
      updateScreen(`FV = ${formatNumber(result)}`);
      setStatus("Computed FV");
      return;
    }

    if (target === "pv") {
      const { n, iy, pmt, fv } = values;
      const r = iy / 100;
      const result = Math.abs(r) < 1e-10 ? -(pmt * n + fv) : -((pmt * (((1 + r) ** n - 1) / r) + fv) / (1 + r) ** n);
      tvmInputs.pv.value = formatNumber(result);
      updateScreen(`PV = ${formatNumber(result)}`);
      setStatus("Computed PV");
      return;
    }

    if (target === "pmt") {
      const { n, iy, pv, fv } = values;
      const r = iy / 100;
      const result = Math.abs(r) < 1e-10 ? -(pv + fv) / n : -((pv * (1 + r) ** n + fv) * r) / ((1 + r) ** n - 1);
      tvmInputs.pmt.value = formatNumber(result);
      updateScreen(`PMT = ${formatNumber(result)}`);
      setStatus("Computed PMT");
      return;
    }

    if (target === "n") {
      const { iy, pv, pmt, fv } = values;
      const fn = (periods) => tvmEquation({ n: periods, iy, pv, pmt, fv });
      const result = solveByBisection(fn, 1e-6, 600);

      if (result === null || !Number.isFinite(result)) {
        throw new Error("Cannot solve N");
      }

      tvmInputs.n.value = formatNumber(result);
      updateScreen(`N = ${formatNumber(result)}`);
      setStatus("Computed N");
      return;
    }

    if (target === "iy") {
      const { n, pv, pmt, fv } = values;
      const fn = (rate) => tvmEquation({ n, iy: rate * 100, pv, pmt, fv });
      const result = solveByBisection(fn, -0.95, 2);

      if (result === null || !Number.isFinite(result)) {
        throw new Error("Cannot solve I/Y");
      }

      tvmInputs.iy.value = formatNumber(result * 100);
      updateScreen(`I/Y = ${formatNumber(result * 100)}%`);
      setStatus("Computed I/Y");
    }
  } catch {
    setStatus("TVM solve failed. Check your numbers/signs", true);
  }
};

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (value) {
    appendValue(value);
    return;
  }

  if (!action) return;

  switch (action) {
    case "equals":
      safeEvaluate();
      break;
    case "backspace":
      expression = expression.length > 1 ? expression.slice(0, -1) : "0";
      updateScreen();
      break;
    case "clearEntry":
      expression = "0";
      updateScreen();
      setStatus(`Mode: ${activeMode === "basic" ? "Basic" : "TVM"}`);
      break;
    case "openParen":
      appendValue("(");
      break;
    case "closeParen":
      appendValue(")");
      break;
    case "plusMinus":
      toggleSign();
      break;
    case "percent":
      percent();
      break;
    case "toggleMode":
      activeMode = activeMode === "basic" ? "tvm" : "basic";
      tvmPanel.style.display = activeMode === "tvm" ? "block" : "none";
      setStatus(`Mode: ${activeMode === "basic" ? "Basic" : "TVM"}`);
      break;
    case "clearAll":
      clearAll();
      break;
    default:
      break;
  }
});

document.querySelector(".tvm-actions").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='compute']");
  if (!button) return;
  computeTVM(button.dataset.target);
});

window.addEventListener("keydown", (event) => {
  if (/^[0-9]$/.test(event.key) || ["+", "-", "*", "/", ".", "(", ")"].includes(event.key)) {
    appendValue(event.key);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    safeEvaluate();
  }

  if (event.key === "Backspace") {
    expression = expression.length > 1 ? expression.slice(0, -1) : "0";
    updateScreen();
  }

  if (event.key.toLowerCase() === "c") {
    expression = "0";
    updateScreen();
  }
});

// Start in TVM-ready layout for easier discoverability.
activeMode = "tvm";
tvmPanel.style.display = "block";
setStatus("Mode: TVM");
updateScreen();
