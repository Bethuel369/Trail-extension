# 🏔️ Trail — Prompt Optimizer

<p align="center">
  <img src="assets/trail-logo.svg" alt="Trail Logo" width="280">
</p>

<p align="center">
  <b>A clearer path to better prompts.</b><br>
  Transforms messy, informal user inputs into structured, token-efficient, high-precision AI prompts right inside ChatGPT & Gemini.
</p>

<p align="center">
  <a href="https://bethuel369.github.io/Trail-extension/"><img src="https://img.shields.io/badge/🌐_Live_Website-GitHub_Pages-F0654B?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo on GitHub Pages"></a>
  <a href="https://github.com/Bethuel369/Trail-extension"><img src="https://img.shields.io/badge/Version-v0.4.1-241A33?style=for-the-badge&logo=git&logoColor=white" alt="Version 0.4.1"></a>
  <a href="trail-extension.zip"><img src="https://img.shields.io/badge/Download-Extension.zip-FFC9A0?style=for-the-badge&logo=googlechrome&logoColor=241A33" alt="Download Zip"></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="License MIT"></a>
</p>

---

## 🌟 Try the Live Showcase Website!

> [!TIP]
> 👉 **Explore the interactive demo and landing page online here:**  
> ### 🔗 **[https://bethuel369.github.io/Trail-extension/](https://bethuel369.github.io/Trail-extension/)** 🚀
> 
> *Test drive domain transformations in real-time, inspect token estimations, and download the latest release directly from your browser!*

---

## 🎨 What is Trail?

Most people prompt AI the way they talk — casually, incompletely, and ambiguously. This causes Large Language Models to make assumptions, produce generic answers, or hallucinate.

**Trail** bridges the gap between human thought and LLM comprehension. With a single click or keyboard shortcut, it reframes your raw ideas into structured prompts consisting of:
- 🎭 **ROLE** — Defines a hyper-specific, senior-level persona with the right technical pedigree.
- 🎯 **TASK** — Unambiguous, imperative directive articulating the exact deliverable.
- 📐 **CONSTRAINTS & CONTEXT** — Format rules, libraries to prefer, and anti-patterns to avoid.

```
       [ Messy Draft ]  ──►  make a script to clean missing values in pandas
                                      │
                                      ▼
                        🏔️ TRAIL PROMPT OPTIMIZER
                                      │
                                      ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │  ### ROLE                                                              │
   │  Senior data scientist and Python engineer, expert in pandas.          │
   │                                                                        │
   │  ### TASK                                                              │
   │  Write a function that finds and handles missing values in a DataFrame.│
   │  Return the cleaned DataFrame and a summary of what changed.           │
   │                                                                        │
   │  ### CONSTRAINTS & CONTEXT                                             │
   │  - Support drop, median, and forward-fill per column.                  │
   │  - PEP 8 compliant, type hints, vectorized operations.                 │
   │  - Handle dtype mismatches and memory footprint efficiently.           │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description | Highlight |
| :--- | :--- | :---: |
| ⚡ **Inline Page Button** | Directly injects beneath prompt boxes on `chatgpt.com` and `gemini.google.com` | No copy-pasting |
| 🏔️ **Yosemite Toolbar UI** | Retro sunset panorama popup for use with Claude, Cursor, Copilot, etc. | Works anywhere |
| 🎯 **11 Domain Rubrics** | Presets crafted for Data Science, Software Eng, Quant Finance, SecOps & more | Expert tuning |
| 📊 **Token Counter** | Live delta badge calculates token changes so you know prompt density | Cost aware |
| 🚀 **Dual Engine** | Free Groq LLaMA-3 / GPT-OSS acceleration OR zero-network local templates | Instant & flexible |
| 🔒 **100% Private** | Zero tracking, zero telemetry, no third-party analytics | Private by design |

---

## 🧭 How It Works Under The Hood

```mermaid
flowchart LR
    A["Raw User Input<br/><i>(e.g., 'rate limiter api')</i>"] --> B["Trail Extension"]
    B --> C{"Domain Selected?"}
    C -->|Preset Selection| D["Domain Calibration Rules"]
    D --> E{"Groq API Key Provided?"}
    E -->|Yes: Blazing Fast| F["Groq AI Engine<br/><i>(openai/gpt-oss-20b)</i>"]
    E -->|No: Offline Ready| G["Local Template Engine<br/><i>(Instant Fallback)</i>"]
    F --> H["Structured Prompt<br/><b>ROLE · TASK · CONSTRAINTS</b>"]
    G --> H
    H --> I["Token Delta Computed"]
    I --> J["ChatGPT / Gemini / Clipboard"]
```

---

## 🎯 Supported Domain Presets

Trail includes 11 carefully calibrated domains out of the box:

- 🐍 **Data Science & Python** — Vectorized pandas/numpy logic, PEP 8, reproducible metrics.
- 💻 **Software Engineering** — Clean architecture, design patterns, testing, error handling.
- 📈 **Quantitative Finance** — Monte Carlo simulations, VaR, Greeks, Sharpe ratio.
- 🤖 **Machine Learning & MLOps** — Loss formulations, validation splits, drift mitigation.
- 📝 **Technical Writing & Docs** — Diátaxis framework, API specifications, code blocks.
- 🛡️ **Cybersecurity** — OWASP Top 10, CWE mitigation, threat modeling, least privilege.
- 🚀 **Product Management** — JTBD, user stories, discovery briefs, success KPIs.
- 💼 **Business & Strategy** — MECE frameworks, unit economics, risk matrices.
- 🎓 **Education & Research** — Scaffolded pedagogy, primary literature citations.
- 🎨 **Creative Writing** — Vivid sensory anchors, emotional stakes, voice preservation.
- 🌐 **General / Default** — All-purpose prompt structuring for daily tasks.

---

## 📦 Quick Installation (Chromium Browsers)

Trail is an open-source unpacked extension compatible with **Chrome**, **Brave**, **Edge**, **Arc**, and **Opera**.

### 1️⃣ Download
- Download [`trail-extension.zip`](trail-extension.zip) or clone this repo:
  ```bash
  git clone https://github.com/Bethuel369/Trail-extension.git
  ```

### 2️⃣ Extract
- Unzip the archive to a permanent folder on your machine.

### 3️⃣ Load into Browser
1. In your Chromium browser, go to `chrome://extensions` (or `edge://extensions`).
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `trail` directory containing `manifest.json`.

### 4️⃣ Pin & Start Prompting!
- Pin **Trail** to your browser toolbar.
- Visit [ChatGPT](https://chatgpt.com) or [Gemini](https://gemini.google.com) to see the Trail button appear directly beneath the chat box!

---

## 🔑 Groq API Setup (Optional)

Trail functions completely offline using its local template engine. To enable AI-powered continuous rewrites:

1. Grab a free API key from [Groq Console](https://console.groq.com/keys).
2. Open the Trail popup from your browser toolbar.
3. Expand **Groq API key** at the bottom.
4. Paste your key and click outside. Your key is securely stored in `chrome.storage.local`.

---

## 📁 Repository Structure

```
Trail - Extension/
├── assets/                     # Brand marks & vector illustrations
│   ├── trail-mark.svg          # Favicon & badge icon
│   ├── trail-logo.svg          # Brand lockup (dark)
│   └── trail-logo-light.svg    # Brand lockup (light)
├── trail/                      # Chrome Extension source code (Manifest V3)
│   ├── icons/                  # High-res extension icons (16, 32, 48, 128px)
│   ├── background.js           # Service worker
│   ├── content.js              # DOM injection script for ChatGPT & Gemini
│   ├── inject.css              # Styling for inline page button
│   ├── manifest.json           # Manifest V3 configuration
│   ├── popup.html              # Yosemite vintage popup markup
│   ├── popup.js                # Popup event handling & clipboard writing
│   ├── shared.js               # Domain presets & token calculation logic
│   └── styles.css              # Popup styling & responsive layout
├── index.html                  # GitHub Pages interactive showcase website
├── trail-extension.zip         # Pre-packaged ready-to-load extension archive
└── README.md                   # Project documentation
```

---

## 🛡️ Privacy Guarantee

- 🚫 **No Tracking:** Zero telemetry, no Google Analytics, no tracking pixels.
- 🔒 **Local Storage:** API keys and preferences are kept exclusively on your machine.
- 📡 **Direct Network Calls:** When using an API key, calls go directly to `api.groq.com` with no intermediary servers.

---

## 👤 Author

Developed by **[Bethuel Ngetich](https://github.com/Bethuel369)**  
Feel free to open an issue or submit a pull request if you have ideas for new domain presets or features!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
