/* ── State ────────────────────────────────────────────── */
const MEM = Array(10).fill(0);          // STO/RCL registers 0-9
let expression   = "0";                  // current arithmetic expression string
let lastResult   = 0;                    // ANS
let pendingOp    = null;                 // 'sto' | 'rcl' | null
let is2nd        = false;                // 2ND key toggle
let cfEntries    = [{ cf: 0, freq: 1 }]; // CF worksheet entries

/* ── DOM Refs ─────────────────────────────────────────── */
const screenEl    = document.getElementById("screen");
const exprEl      = document.getElementById("displayExpr");
const statusLeft  = document.getElementById("statusLeft");
const statusRight = document.getElementById("statusRight");
const btn2nd      = document.getElementById("btn2nd");

const tvmPanel    = document.getElementById("tvmPanel");
const cfPanel     = document.getElementById("cfPanel");
const regOverlay  = document.getElementById("registerOverlay");
const regGrid     = document.getElementById("regGrid");
const regTitle    = document.getElementById("regTitle");

const tvmInputs = {
  n:   document.getElementById("tvmN"),
  iy:  document.getElementById("tvmIY"),
  pv:  document.getElementById("tvmPV"),
  pmt: document.getElementById("tvmPMT"),
  fv:  document.getElementById("tvmFV"),
};

/* ── Display helpers ─────────────────────────────────── */
const fmt = (v) => {
  if (!Number.isFinite(v)) return "Error";
  if (Math.abs(v) >= 1e12 || (v !== 0 && Math.abs(v) < 1e-7))
    return v.toExponential(6);
  const s = v.toFixed(9).replace(/\.?0+$/, "");
  return s === "-0" ? "0" : s;
};

const setScreen = (val) => { screenEl.textContent = val; };
const setExpr   = (val) => { exprEl.textContent = val; };
const setStatus = (left = "", right = "") => {
  statusLeft.textContent  = left;
  statusRight.textContent = right;
};

const showError = (msg) => {
  setScreen("Error");
  setExpr(msg);
  setStatus("ERR");
  expression = "0";
};

/* ── 2ND key ────────────────────────────────────────── */
const toggle2nd = () => {
  is2nd = !is2nd;
  btn2nd.classList.toggle("active", is2nd);
  setStatus(is2nd ? "2ND" : "", statusRight.textContent);
};

const consume2nd = () => {
  if (!is2nd) return false;
  is2nd = false;
  btn2nd.classList.remove("active");
  setStatus("", statusRight.textContent);
  return true;
};

/* ── Basic expression builder ───────────────────────── */
const appendValue = (v) => {
  pendingOp = null;
  if (expression === "0" && v !== ".") expression = v;
  else expression += v;
  setScreen(expression);
  setExpr("");
};

const safeEval = () => {
  try {
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + expression + ")")();
    lastResult = result;
    expression = String(result);
    setScreen(fmt(result));
    setExpr("");
    setStatus("");
  } catch {
    showError("Bad expression");
  }
};

/* ── STO / RCL ───────────────────────────────────────── */
const buildRegGrid = (mode) => {
  regGrid.innerHTML = "";
  MEM.forEach((val, i) => {
    const btn = document.createElement("button");
    btn.className = "reg-btn";
    btn.innerHTML = `<span class="reg-btn-num">${i}</span><span class="reg-btn-val">${fmt(val)}</span>`;
    btn.addEventListener("click", () => {
      if (mode === "sto") {
        const num = parseFloat(expression);
        MEM[i] = Number.isFinite(num) ? num : 0;
        setStatus(``, `STO ${i} ✓`);
        setExpr(`Stored to register ${i}`);
      } else {
        expression = String(MEM[i]);
        setScreen(fmt(MEM[i]));
        setExpr(`Recalled register ${i}`);
        setStatus("", `RCL ${i}`);
      }
      regOverlay.hidden = true;
      pendingOp = null;
    });
    regGrid.appendChild(btn);
  });
};

const openRegOverlay = (mode) => {
  pendingOp = mode;
  regTitle.textContent = mode === "sto"
    ? "STO — select register (0–9)"
    : "RCL — select register (0–9)";
  buildRegGrid(mode);
  regOverlay.hidden = false;
};

document.getElementById("regCancel").addEventListener("click", () => {
  regOverlay.hidden = true;
  pendingOp = null;
});

/* ── TVM solver ──────────────────────────────────────── */
const tvmVal = (id) => {
  const raw = tvmInputs[id].value.trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const bisect = (fn, lo, hi, itr = 150, tol = 1e-9) => {
  let fLo = fn(lo), fHi = fn(hi);
  if (fLo === 0) return lo;
  if (fHi === 0) return hi;
  for (let e = 0; e < 15 && fLo * fHi > 0; e++) {
    lo -= 1; hi += 1;
    fLo = fn(lo); fHi = fn(hi);
  }
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < itr; i++) {
    const mid = (lo + hi) / 2;
    const fMid = fn(mid);
    if (Math.abs(fMid) < tol) return mid;
    fLo * fMid < 0 ? (hi = mid, fHi = fMid) : (lo = mid, fLo = fMid);
  }
  return (lo + hi) / 2;
};

const tvmEq = (n, r, pv, pmt, fv) => {
  if (Math.abs(r) < 1e-12) return pv + pmt * n + fv;
  const g = Math.pow(1 + r, n);
  return pv * g + pmt * ((g - 1) / r) + fv;
};

const solveTVM = (target) => {
  const vals = {
    n:   tvmVal("n"),
    iy:  tvmVal("iy"),
    pv:  tvmVal("pv"),
    pmt: tvmVal("pmt"),
    fv:  tvmVal("fv"),
  };
  const missing = Object.keys(vals).filter((k) => vals[k] === null);
  if (missing.length > 1 || (missing.length === 1 && missing[0] !== target)) {
    showError("Fill 4 TVM fields first");
    return;
  }

  try {
    let result;
    const { n, iy, pv, pmt, fv } = vals;
    const r = (iy ?? 0) / 100;

    if (target === "fv") {
      result = Math.abs(r) < 1e-12
        ? -(pv + pmt * n)
        : -(pv * Math.pow(1 + r, n) + pmt * ((Math.pow(1 + r, n) - 1) / r));
      tvmInputs.fv.value = fmt(result);
    } else if (target === "pv") {
      result = Math.abs(r) < 1e-12
        ? -(pmt * n + fv)
        : -((pmt * ((Math.pow(1 + r, n) - 1) / r) + fv) / Math.pow(1 + r, n));
      tvmInputs.pv.value = fmt(result);
    } else if (target === "pmt") {
      result = Math.abs(r) < 1e-12
        ? -(pv + fv) / n
        : -((pv * Math.pow(1 + r, n) + fv) * r) / (Math.pow(1 + r, n) - 1);
      tvmInputs.pmt.value = fmt(result);
    } else if (target === "n") {
      result = bisect((periods) => tvmEq(periods, r, pv, pmt, fv), 1e-9, 1000);
      if (result === null || !Number.isFinite(result)) throw new Error("no solution");
      tvmInputs.n.value = fmt(result);
    } else if (target === "iy") {
      result = bisect((rate) => tvmEq(n, rate, pv, pmt, fv), -0.9999, 100);
      if (result === null || !Number.isFinite(result)) throw new Error("no solution");
      result = result * 100;
      tvmInputs.iy.value = fmt(result);
    }

    setScreen(fmt(result));
    setExpr(target.toUpperCase() + " =");
    setStatus("TVM", `CPT ${target.toUpperCase()} ✓`);
  } catch {
    showError("TVM: no solution — check signs");
  }
};

/* ── TVM worksheet buttons ───────────────────────────── */
document.querySelectorAll("[data-tvm]").forEach((btn) => {
  btn.addEventListener("click", () => solveTVM(btn.dataset.tvm));
});

document.getElementById("tvmClose").addEventListener("click", () => {
  tvmPanel.hidden = true;
  setStatus("", "");
});

/* ── CF worksheet ────────────────────────────────────── */
const renderCFList = () => {
  const list = document.getElementById("cfList");
  list.innerHTML = "";
  cfEntries.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "cf-row";

    const label = document.createElement("span");
    label.className = "cf-row-label";
    label.textContent = i === 0 ? "CF0" : `CF${i}`;

    const cfInput = document.createElement("input");
    cfInput.type = "number";
    cfInput.inputMode = "decimal";
    cfInput.placeholder = i === 0 ? "e.g. -1000" : "0";
    cfInput.value = entry.cf || "";
    cfInput.setAttribute("aria-label", `Cash flow ${i}`);
    cfInput.addEventListener("input", () => { cfEntries[i].cf = Number(cfInput.value) || 0; });

    const freqWrap = document.createElement("div");
    freqWrap.className = "cf-row-freq";
    if (i > 0) {
      const freqLabel = document.createElement("label");
      freqLabel.textContent = "×";
      freqLabel.style.color = "#607080";
      const freqInput = document.createElement("input");
      freqInput.type = "number";
      freqInput.inputMode = "decimal";
      freqInput.placeholder = "1";
      freqInput.min = "1";
      freqInput.value = entry.freq || 1;
      freqInput.setAttribute("aria-label", `Frequency for CF ${i}`);
      freqInput.addEventListener("input", () => { cfEntries[i].freq = Math.max(1, parseInt(freqInput.value) || 1); });
      freqWrap.appendChild(freqLabel);
      freqWrap.appendChild(freqInput);
    }

    if (i > 0) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "cf-remove";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", `Remove CF ${i}`);
      removeBtn.addEventListener("click", () => {
        cfEntries.splice(i, 1);
        renderCFList();
      });
      row.append(label, cfInput, freqWrap, removeBtn);
    } else {
      row.append(label, cfInput, freqWrap);
    }
    list.appendChild(row);
  });
};

document.getElementById("btnAddCF").addEventListener("click", () => {
  cfEntries.push({ cf: 0, freq: 1 });
  renderCFList();
});

document.getElementById("cfClose").addEventListener("click", () => {
  cfPanel.hidden = true;
  setStatus("", "");
});

/* ── NPV calculation ─────────────────────────────────── */
const calcNPV = (rate, entries) => {
  let npv = entries[0].cf;
  let t = 0;
  for (let i = 1; i < entries.length; i++) {
    const freq = entries[i].freq || 1;
    for (let j = 0; j < freq; j++) {
      t++;
      npv += entries[i].cf / Math.pow(1 + rate, t);
    }
  }
  return npv;
};

document.getElementById("btnCptNPV").addEventListener("click", () => {
  const rateRaw = document.getElementById("cfRate").value.trim();
  if (!rateRaw) { showError("Enter I/Y % first"); return; }
  const rate = Number(rateRaw) / 100;
  if (!Number.isFinite(rate)) { showError("Invalid I/Y"); return; }
  try {
    const npv = calcNPV(rate, cfEntries);
    lastResult = npv;
    expression = String(npv);
    setScreen(fmt(npv));
    setExpr("NPV =");
    setStatus("CF", "NPV ✓");
  } catch { showError("NPV calculation failed"); }
});

document.getElementById("btnCptIRR").addEventListener("click", () => {
  try {
    const fn = (r) => calcNPV(r, cfEntries);
    const irr = bisect(fn, -0.9999, 10);
    if (irr === null || !Number.isFinite(irr)) throw new Error("no IRR");
    const irrPct = irr * 100;
    lastResult = irrPct;
    expression = String(irrPct);
    setScreen(fmt(irrPct));
    setExpr("IRR (%) =");
    setStatus("CF", "IRR ✓");
  } catch { showError("No IRR found — check CF signs"); }
});

/* ── Panel toggling helpers ─────────────────────────── */
const openTVM = () => {
  cfPanel.hidden = true;
  regOverlay.hidden = true;
  tvmPanel.hidden = false;
  setStatus("TVM", "");
};

const openCF = () => {
  tvmPanel.hidden = true;
  regOverlay.hidden = true;
  cfPanel.hidden = false;
  renderCFList();
  setStatus("CF", "");
};

/* ── Math helpers ────────────────────────────────────── */
const currentNum = () => {
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + expression + ")")();
  } catch { return parseFloat(expression) || 0; }
};

const applyMath = (fn) => {
  try {
    const x = currentNum();
    const result = fn(x);
    if (!Number.isFinite(result)) throw new Error("domain error");
    lastResult = result;
    expression = String(result);
    setScreen(fmt(result));
    setExpr("");
  } catch (e) { showError(e.message || "Math error"); }
};

/* ── Keypad click handler ────────────────────────────── */
document.getElementById("keypad").addEventListener("click", (e) => {
  const btn = e.target.closest("button.key");
  if (!btn) return;

  const val    = btn.dataset.value;
  const action = btn.dataset.action;

  // ── Digit / operator tap ─────────────────────────
  if (val !== undefined) {
    consume2nd();
    appendValue(val);
    return;
  }

  if (!action) return;

  // ── 2ND ─────────────────────────────────────────
  if (action === "2nd") { toggle2nd(); return; }

  // ── Memory: STO ─────────────────────────────────
  if (action === "sto") {
    consume2nd();
    openRegOverlay("sto");
    return;
  }

  // ── Memory: RCL ─────────────────────────────────
  if (action === "rcl") {
    consume2nd();
    openRegOverlay("rcl");
    return;
  }

  // ── TVM panel open ───────────────────────────────
  if (action === "tvm") {
    consume2nd();
    openTVM();
    const target = btn.dataset.target;
    if (target && tvmInputs[target]) tvmInputs[target].focus();
    return;
  }

  // ── CLR TVM ─────────────────────────────────────
  if (action === "clrTVM") {
    consume2nd();
    Object.values(tvmInputs).forEach((inp) => { inp.value = ""; });
    openTVM();
    setStatus("TVM", "Cleared");
    return;
  }

  // ── CF Worksheet ─────────────────────────────────
  if (action === "cf") {
    consume2nd();
    openCF();
    return;
  }

  // ── NPV/IRR quick CPT ───────────────────────────
  if (action === "npv") {
    consume2nd();
    openCF();
    document.getElementById("cfRate").focus();
    return;
  }

  if (action === "irr") {
    consume2nd();
    openCF();
    document.getElementById("btnCptIRR").click();
    return;
  }

  // ── Equals / evaluate ────────────────────────────
  if (action === "equals") {
    if (consume2nd()) {
      // ANS
      expression = String(lastResult);
      setScreen(fmt(lastResult));
      setExpr("ANS");
    } else {
      safeEval();
    }
    return;
  }

  // ── CPT / 2ND+CPT (QUIT = reset display to 0) ────
  if (action === "cpt") {
    if (consume2nd()) {
      // 2ND + CPT → QUIT: close panels, reset display to 0
      expression = "0";
      lastResult  = 0;
      tvmPanel.hidden   = true;
      cfPanel.hidden    = true;
      regOverlay.hidden = true;
      setScreen("0");
      setExpr("");
      setStatus("", "QUIT");
    } else {
      if (!tvmPanel.hidden) setStatus("TVM", "Use CPT buttons above");
      else if (!cfPanel.hidden) setStatus("CF", "Use CPT buttons above");
      else setStatus("", "Open TVM or CF first");
    }
    return;
  }

  // ── Backspace / DEL ──────────────────────────────
  if (action === "backspace") {
    consume2nd();
    expression = expression.length > 1 ? expression.slice(0, -1) : "0";
    setScreen(expression);
    return;
  }

  // ── Clear all ────────────────────────────────────
  if (action === "clearAll") {
    is2nd = false;
    btn2nd.classList.remove("active");
    expression = "0";
    pendingOp  = null;
    regOverlay.hidden = true;
    setScreen("0");
    setExpr("");
    setStatus("", "Cleared");
    return;
  }

  // ── Plus/Minus sign flip ─────────────────────────
  if (action === "plusMinus") {
    consume2nd();
    expression = expression.startsWith("-") ? expression.slice(1) : "-" + expression;
    setScreen(expression);
    return;
  }

  // ── Parens ───────────────────────────────────────
  if (action === "openParen")  { consume2nd(); appendValue("("); return; }
  if (action === "closeParen") { consume2nd(); appendValue(")"); return; }

  // ── ENTER / assign ───────────────────────────────
  if (action === "enter" || action === "assign") {
    consume2nd();
    safeEval();
    return;
  }

  // ── Math functions ───────────────────────────────
  if (action === "percent") {
    consume2nd();
    applyMath((x) => x / 100);
    setExpr("÷ 100");
    return;
  }

  if (action === "sqrt") {
    consume2nd();
    applyMath((x) => {
      if (x < 0) throw new Error("√ of negative");
      return Math.sqrt(x);
    });
    setExpr("√x");
    return;
  }

  if (action === "square") {
    consume2nd();
    applyMath((x) => x * x);
    setExpr("x²");
    return;
  }

  if (action === "reciprocal") {
    consume2nd();
    applyMath((x) => {
      if (x === 0) throw new Error("Divide by 0");
      return 1 / x;
    });
    setExpr("1/x");
    return;
  }

  if (action === "ln") {
    if (consume2nd()) {
      // eˣ
      applyMath((x) => Math.exp(x));
      setExpr("eˣ");
    } else {
      applyMath((x) => {
        if (x <= 0) throw new Error("LN domain error");
        return Math.log(x);
      });
      setExpr("LN");
    }
    return;
  }

  if (action === "inv") {
    consume2nd();
    applyMath((x) => 1 / x);
    setExpr("INV");
    return;
  }

  if (action === "power") {
    // Enters y^x mode: append ** operator so user types exponent
    consume2nd();
    if (!expression.endsWith("**")) {
      expression += "**";
    }
    setScreen(expression);
    return;
  }

  // ── Unimplemented keys – show label ─────────────
  consume2nd();
});

/* ── Keyboard support ────────────────────────────────── */
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return; // don't intercept worksheet inputs

  if (/^[0-9]$/.test(e.key) || ["+", "-", "/", ".", "(", ")"].includes(e.key)) {
    appendValue(e.key);
    return;
  }
  if (e.key === "*") { appendValue("*"); return; }
  if (e.key === "Enter" || e.key === "=") { e.preventDefault(); safeEval(); return; }
  if (e.key === "Backspace") {
    expression = expression.length > 1 ? expression.slice(0, -1) : "0";
    setScreen(expression);
    return;
  }
  if (e.key === "Escape" || e.key.toLowerCase() === "c") {
    expression = "0"; setScreen("0"); setExpr(""); setStatus("");
  }
});

/* ── Boot ────────────────────────────────────────────── */
setScreen("0");
setExpr("");
setStatus("", "BA II PLUS");
