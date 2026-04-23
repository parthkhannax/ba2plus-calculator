<div align="center">

# 🧮 BA II Plus — Web Calculator

**A pixel-perfect, fully functional Texas Instruments BA II Plus financial calculator built with zero dependencies.**  
Works in every browser. Deploys to GitHub Pages in one click.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://parthkhannax.github.io/ba2plus-calculator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/Dependencies-None-orange?style=for-the-badge)](#)
[![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-purple?style=for-the-badge)](#)

</div>

---

## ✨ Overview

This is a complete browser-based recreation of the **Texas Instruments BA II Plus** financial calculator — the industry-standard tool used by CFA, CPA, and finance professionals worldwide.

No installs. No build step. No frameworks. Pure HTML + CSS + JS.

> **Try it live →** [parthkhannax.github.io/ba2plus-calculator](https://parthkhannax.github.io/ba2plus-calculator/)

---

## 🎯 Features

### Financial Functions
| Feature | Description |
|---|---|
| **TVM Worksheet** | Solve for any one of N, I/Y, PV, PMT, FV given the other four |
| **Cash Flow (CF)** | Enter up to unlimited cash flow periods with frequency multipliers |
| **NPV** | Net Present Value from CF worksheet at a given discount rate |
| **IRR** | Internal Rate of Return solved via bisection algorithm |
| **STO / RCL** | 10 memory registers (0–9) with persistent values and quick-access overlay |

### Calculator Functions
| Feature | Description |
|---|---|
| **2ND key** | Activates gold secondary functions (eˣ, ANS, QUIT, etc.) |
| **Basic arithmetic** | `+` `−` `×` `÷` with full parentheses support |
| **Math functions** | `√x`, `x²`, `1/x`, `LN`, `eˣ`, `yˣ`, `%` |
| **Sign toggle** | `+/−` flips positive/negative instantly |
| **Keyboard support** | Full number row + operators + Enter/Backspace/Escape |
| **Expression display** | Shows running expression above the main result |

### UX & Design
- Authentic **dark charcoal body** with **olive-green LCD** display
- **Yellow 2ND labels** on every key matching the real device
- Smooth key-press animations and active states
- **Responsive layout** — scales from 320px mobile to widescreen desktop
- Zero-jank on iOS Safari, Android Chrome, and all desktop browsers

---

## 🖥️ Screenshots

### Desktop
```
┌─────────────────────────────────────────────┐
│  ░░░░░░░░░░░ LCD (olive green) ░░░░░░░░░░░  │
│              0,3200                          │
├──────────────────────────────────────────────┤
│  [CPT]  [ENTER]  [↑]  [↓]  [=]             │
│  [2ND]  [CF]    [NPV] [IRR] [→]            │
│  [N]    [I/Y]   [PV]  [PMT] [FV]           │
│  [%]    [√x]    [x²]  [1/x] [÷]            │
│  [INV]  [(]     [)]   [yˣ]  [×]            │
│  [LN]   [7]     [8]   [9]   [−]            │
│  [STO]  [4]     [5]   [6]   [+]            │
│  [RCL]  [1]     [2]   [3]   [=]            │
│  [CE|C] [0]     [.]   [+/−]               │
└─────────────────────────────────────────────┘
```

### Mobile
Single-column layout fills the phone screen with finger-sized tap targets.

---

## 🚀 Quick Start

### Run locally (instant)
```bash
git clone https://github.com/parthkhannax/ba2plus-calculator.git
cd ba2plus-calculator
open index.html        # macOS
# or just double-click index.html in any file manager
```

### Deploy your own copy to GitHub Pages
```bash
# 1. Fork this repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ba2plus-calculator.git
cd ba2plus-calculator

# 2. In your repo: Settings → Pages → Source = GitHub Actions
# 3. Push any change to trigger deployment:
git commit --allow-empty -m "Deploy"
git push origin main

# Your site will be live at:
# https://YOUR_USERNAME.github.io/ba2plus-calculator/
```

---

## 📖 How to Use

### TVM Worksheet
1. Press any TVM key (**N**, **I/Y**, **PV**, **PMT**, **FV**) — the worksheet opens
2. Fill in the **4 known values**
3. Press the **CPT [variable]** button for the unknown
4. Result appears on the display and fills the field

**Example — Loan payment:**
```
N   = 360    (30-year mortgage = 360 monthly payments)
I/Y = 6      (6% annual rate)
PV  = 300000 (loan amount)
FV  = 0

→ CPT PMT = -1,798.65
```

### CF / NPV / IRR Worksheet
1. Press **CF** — the cash flow worksheet opens
2. Enter **CF0** (initial outflow, usually negative)
3. Press **+ Add CF Period** for each subsequent period
4. Set frequency (`×`) for repeated cash flows
5. Enter **I/Y %** discount rate, then press **CPT NPV**
6. Or press **CPT IRR** to solve for the rate where NPV = 0

**Example — Project evaluation:**
```
CF0 = -10000
CF1 = 3000 (× 1)
CF2 = 4000 (× 1)
CF3 = 5000 (× 1)
I/Y = 10%

→ NPV = 823.02
→ IRR = 14.35%
```

### STO / RCL (Memory Registers)
1. Press **STO** — a register grid (0–9) appears showing current stored values
2. Tap a register number to store the current display value
3. Press **RCL** and tap a register to recall it to the display

### 2ND Key
The **2ND** key activates the gold secondary functions shown above each key:
- `2ND` + **CPT** → QUIT (resets display to 0, closes all panels)
- `2ND` + **LN** → eˣ (e raised to current value)
- `2ND` + **=** → ANS (recall last result)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `0–9` | Digit input |
| `+` `-` `*` `/` | Arithmetic operators |
| `.` | Decimal point |
| `(` `)` | Parentheses |
| `Enter` or `=` | Evaluate expression |
| `Backspace` | Delete last character |
| `Escape` or `c` | Clear display |

---

## 📁 Project Structure

```
ba2plus-calculator/
├── index.html          # Calculator markup (semantic HTML5)
├── styles.css          # Full layout + responsive design (500 lines)
├── script.js           # Calculator engine + TVM/CF/NPV/IRR logic (600 lines)
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages auto-deploy workflow
└── README.md
```

**No build tools. No package.json. No node_modules.**  
The entire calculator is three files you can read start-to-finish in an afternoon.

---

## 🔢 Math & Algorithms

### TVM Solver
Uses closed-form solutions for FV, PV, and PMT. Solves N and I/Y via **bisection root-finding** on the standard TVM equation:

```
PV·(1+r)ⁿ + PMT·[(1+r)ⁿ − 1]/r + FV = 0
```

### NPV
Standard discounted cash flow with support for frequency-grouped cash flows:

```
NPV = CF0 + Σ [ CFt / (1+r)^t ]
```

### IRR
Solved via bisection on NPV(r) = 0 with bracket expansion for convergence across any sign pattern.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add: your feature'`
4. Push and open a PR

Ideas for contributions:
- Amortization schedule worksheet
- Bond pricing worksheet
- Depreciation worksheet (SL, SOYD, DB)
- Dark/light theme toggle
- History log panel

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">

Made with ☕ and financial nerdery.  
Star ⭐ the repo if it saved you from carrying a physical calculator.

</div>
