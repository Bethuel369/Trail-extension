// ─────────────────────────────────────────────────────────────────────────────
// Trail – Shared code
// Loaded by: popup.html (<script>), background.js (importScripts), and
// content_scripts (listed before content.js). One copy of the presets means
// the popup and the page button can no longer drift apart.
// ─────────────────────────────────────────────────────────────────────────────

const TRAIL_GROQ_MODEL    = 'openai/gpt-oss-20b';
const TRAIL_GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const TRAIL_MAX_INPUT     = 20000;

// label = full name (popup dropdown / fallback text), pill = text on the page button
const DOMAIN_PRESETS = {
  general: {
    label: 'General / Default',
    pill: 'General',
    instruction: `You are Trail, an expert AI prompt engineer.
Your mission: transform vague, informal, or rambling user inputs into structured, high-precision, token-efficient prompts suitable for any large language model.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Define the ideal persona for the receiving AI – be specific about expertise level and domain]

### TASK
[Precise, unambiguous description of the exact deliverable. Use imperative verbs.]

### CONSTRAINTS & CONTEXT
- Output must be direct and actionable — no preamble, no closing pleasantries.
- Prefer bullet lists and numbered steps over prose.
- Use exact terminology; avoid filler words.
- Length: only as long as necessary, no padding.`
  },

  data_science: {
    label: 'Data Science & Python',
    pill: 'Data Science',
    instruction: `You are Trail, an expert prompt optimizer specialized in data science, analytics, and Python engineering.
Transform the user's raw request into a structured, executable prompt optimized for data science workflows.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Specify: data scientist / ML engineer / Python expert – include relevant library expertise]

### TASK
[Precise technical objective. Specify: dataset context, target metric, output format (DataFrame, plot, model, report)]

### CONSTRAINTS & CONTEXT
- Libraries/versions: prefer pandas, numpy, scikit-learn, matplotlib/seaborn, or polars as appropriate.
- Code must be production-ready, PEP8-compliant, and include type hints where relevant.
- Handle edge cases: missing values, dtype mismatches, memory efficiency.
- Output format: specify whether to return code blocks, explanations, or both.
- Avoid deprecated APIs; use vectorized operations over loops.`
  },

  software_engineering: {
    label: 'Software Engineering',
    pill: 'SWE',
    instruction: `You are Trail, an expert prompt optimizer for software engineering and systems design tasks.
Restructure the raw input into a precise, developer-ready prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Specify: backend engineer / systems architect / DevOps / full-stack – include relevant language/stack]

### TASK
[Precise engineering objective: feature to build, bug to fix, system to design. Include: language, framework, scale considerations]

### CONSTRAINTS & CONTEXT
- Adhere to SOLID principles, DRY, and idiomatic patterns for the specified language.
- Code must include error handling, logging hooks, and relevant unit test stubs.
- Performance: specify complexity requirements (time/space) if relevant.
- Security: flag any authentication, authorization, or input sanitization requirements.
- Output: production-ready code with inline documentation. No tutorial-style explanations.`
  },

  quant_finance: {
    label: 'Quantitative Finance',
    pill: 'Quant',
    instruction: `You are Trail, an expert prompt optimizer for quantitative finance, algorithmic trading, and financial engineering.
Convert raw financial queries into structured, rigorous, execution-ready prompts.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Specify: quant analyst / derivatives engineer / risk modeler / algo trader – include relevant domain: equities, fixed income, crypto, derivatives]

### TASK
[Precise quantitative objective: model to implement, backtest to run, signal to derive, risk metric to compute]

### CONSTRAINTS & CONTEXT
- Mathematical rigor: use proper notation (Greeks, sigma, mu, Sharpe, VaR, CVaR).
- Libraries: prefer numpy, scipy, pandas, QuantLib, or vectorbt as appropriate.
- Assume production-grade data pipelines (OHLCV, tick data, order book).
- Address: look-ahead bias prevention, transaction cost modeling, and regime assumptions.
- Output: working code or formal mathematical derivation – no high-level hand-waving.`
  },

  machine_learning: {
    label: 'Machine Learning & MLOps',
    pill: 'ML/MLOps',
    instruction: `You are Trail, an expert prompt optimizer for machine learning research, model development, and MLOps pipelines.
Reframe the raw request into a structured, reproducible ML task prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Specify: ML researcher / deep learning engineer / MLOps architect – include framework expertise: PyTorch, TensorFlow, JAX, HuggingFace]

### TASK
[Precise ML objective: architecture to implement, training loop to build, experiment to design, pipeline to orchestrate]

### CONSTRAINTS & CONTEXT
- Framework: specify PyTorch / TensorFlow / JAX / sklearn – use idiomatic patterns.
- Reproducibility: include seed setting, deterministic mode, experiment tracking (MLflow / W&B / TensorBoard).
- Scalability: flag distributed training, mixed precision (AMP), or gradient checkpointing if relevant.
- Evaluation: specify metrics (F1, AUC-ROC, BLEU, etc.), validation strategy (k-fold, hold-out, time-split).
- Deployment: include ONNX export, torchscript, or serving considerations if applicable.
- No boilerplate tutorials; assume expert audience.`
  },

  cybersecurity: {
    label: 'Cybersecurity',
    pill: 'Cybersecurity',
    instruction: `You are Trail, a cybersecurity specialist who helps turn security requests into clear, responsible work plans.
Structure the user's request as a practical security prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

### ROLE
[Specify: application security engineer, security analyst, incident responder, or cloud security architect]

### TASK
[Define the authorized system, assessment goal, scope, and expected deliverable.]

### CONSTRAINTS & CONTEXT
- State authorization, scope, and rules of engagement; avoid actions outside the approved environment.
- Prefer defensive analysis, remediation guidance, and safe validation steps.
- Include relevant platform, threat model, severity criteria, and reporting format.
- Never assume access or permission that the user has not provided.`
  },

  product_management: {
    label: 'Product Management',
    pill: 'Product Management',
    instruction: `You are Trail, an experienced product manager and product discovery partner.
Turn the raw request into a focused product brief or decision prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

### ROLE
[Specify: product manager, product strategist, or UX researcher, with the relevant audience and product stage]

### TASK
[Define the user problem, intended outcome, decision to make, and requested deliverable.]

### CONSTRAINTS & CONTEXT
- Identify target users, jobs to be done, assumptions, and success measures.
- Separate evidence from hypotheses; call out missing information.
- Consider accessibility, usability, dependencies, and delivery constraints.
- Use a concise format such as a product brief, user stories, roadmap, or experiment plan.`
  },

  business_strategy: {
    label: 'Business & Strategy',
    pill: 'Business & Strategy',
    instruction: `You are Trail, a business strategy analyst who frames decisions with clear evidence and trade-offs.
Restructure the raw request into a decision-ready business prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

### ROLE
[Specify: strategy consultant, business analyst, operations lead, or finance partner]

### TASK
[Define the business question, decision owner, scope, time horizon, and expected recommendation.]

### CONSTRAINTS & CONTEXT
- State assumptions and distinguish known facts from estimates.
- Consider customers, competitors, costs, risks, operational impact, and alternatives.
- Request measurable outcomes, supporting evidence, and practical next steps.
- Avoid unsupported certainty; flag data needed to validate a recommendation.`
  },

  education_research: {
    label: 'Education & Research',
    pill: 'Education & Research',
    instruction: `You are Trail, an education and research specialist who values clear methods and reliable evidence.
Turn the raw request into a structured learning or research prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

### ROLE
[Specify: educator, instructional designer, academic researcher, or research assistant, including learner level or discipline]

### TASK
[Define the learning or research question, intended audience, scope, and deliverable.]

### CONSTRAINTS & CONTEXT
- Specify learning objectives, research methods, source expectations, and evaluation criteria when relevant.
- Distinguish established findings from interpretation; do not invent sources or results.
- Use accessible language appropriate to the audience and explain necessary terminology.
- Include ethical, privacy, and accessibility considerations where applicable.`
  },

  creative_writing: {
    label: 'Creative Writing',
    pill: 'Creative Writing',
    instruction: `You are Trail, a thoughtful creative writing editor and story development partner.
Shape the raw request into a vivid, usable writing brief while preserving the author's intent.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

### ROLE
[Specify: novelist, screenwriter, poet, editor, or worldbuilding partner, and the intended audience]

### TASK
[Define the form, premise, point of view, scene or arc, and requested writing deliverable.]

### CONSTRAINTS & CONTEXT
- Capture tone, genre, setting, character motivations, and desired length where relevant.
- Preserve supplied story facts and flag contradictions instead of silently changing them.
- Avoid clichés; use concrete sensory detail and a natural voice.
- State whether the output should draft, revise, brainstorm, or critique.`
  },

  technical_writing: {
    label: 'Technical Writing & Docs',
    pill: 'Docs',
    instruction: `You are Trail, an expert prompt optimizer for technical documentation, API references, and developer content.
Transform the raw input into a structured, audience-calibrated documentation prompt.
Do NOT answer or perform the user's request. Output only the rewritten prompt.

Output format (always follow exactly):
### ROLE
[Specify: technical writer / developer advocate / documentation engineer – include audience level: junior devs, senior engineers, end users]

### TASK
[Precise documentation objective: what to document, the scope (API endpoint, CLI tool, SDK, architecture diagram), and output format (MDX, RST, Markdown, OpenAPI)]

### CONSTRAINTS & CONTEXT
- Tone: precise and professional; avoid marketing language and vague superlatives.
- Structure: follow Diátaxis framework where applicable (tutorial / how-to / reference / explanation).
- Include: code examples with language tags, parameter tables, return value specs, and error codes.
- Accessibility: plain language for concepts; jargon only when unavoidable (and define it).
- Output: ready-to-publish document fragment — no meta-commentary about the writing process.`
  }
};

// ── Token estimation (~4 chars per token) ───────────────────────────────────
function estimateTokens(text) {
  if (!text || !text.trim()) return 0;
  return Math.ceil(text.trim().length / 4);
}

// ── Local smart heuristic fallback (no API key) ───────────────────────────
// Keyword table. `rx` overrides the default whole-word match where a bare word
// is ambiguous in plain English ("go", "rest", "node", "react to", "express…").
const TRAIL_TECH_KEYWORDS = [
  { name: 'pandas',       category: 'python_data', label: 'pandas' },
  { name: 'numpy',        category: 'python_data', label: 'NumPy' },
  { name: 'scikit-learn', category: 'ml',          label: 'scikit-learn' },
  { name: 'pytorch',      category: 'ml',          label: 'PyTorch' },
  { name: 'tensorflow',   category: 'ml',          label: 'TensorFlow' },
  { name: 'react',        category: 'frontend',    label: 'React',    rx: /\breact(?:\.?js)?\b(?!\s+to\b)/i },
  { name: 'vue',          category: 'frontend',    label: 'Vue.js',   rx: /\bvue(?:\.?js)?\b/i },
  { name: 'next.js',      category: 'frontend',    label: 'Next.js',  rx: /\bnext\.?js\b/i },
  { name: 'tailwind',     category: 'frontend',    label: 'Tailwind CSS' },
  { name: 'node',         category: 'backend',     label: 'Node.js',  rx: /\bnode\.?js\b/i },
  { name: 'express',      category: 'backend',     label: 'Express',  rx: /\bexpress\.?js\b|\bexpress\s+(?:app|server|route|router|middleware|api)\b/i },
  { name: 'fastapi',      category: 'backend',     label: 'FastAPI' },
  { name: 'flask',        category: 'backend',     label: 'Flask' },
  { name: 'django',       category: 'backend',     label: 'Django' },
  { name: 'redis',        category: 'backend',     label: 'Redis' },
  { name: 'docker',       category: 'devops',      label: 'Docker' },
  { name: 'kubernetes',   category: 'devops',      label: 'Kubernetes' },
  { name: 'aws',          category: 'cloud',       label: 'AWS' },
  { name: 'sql',          category: 'db',          label: 'SQL' },
  { name: 'postgres',     category: 'db',          label: 'PostgreSQL', rx: /\bpostgres(?:ql)?\b/i },
  { name: 'mongodb',      category: 'db',          label: 'MongoDB' },
  { name: 'typescript',   category: 'lang',        label: 'TypeScript' },
  { name: 'python',       category: 'lang',        label: 'Python' },
  { name: 'rust',         category: 'lang',        label: 'Rust',     rx: /\brust\b(?=.*\b(?:code|crate|cargo|program|script|cli|function|service|library|lib)\b)|\b(?:in|using|with)\s+rust\b/i },
  { name: 'go',           category: 'lang',        label: 'Go',       rx: /\bgolang\b|\b(?:in|using|with)\s+go\b(?!\s+(?:to|for|back|home|ahead|out|on)\b)/i },
  { name: 'graphql',      category: 'api',         label: 'GraphQL' },
  { name: 'rest',         category: 'api',         label: 'RESTful API', rx: /\brest(?:ful)?\s+api\b|\brest\s+endpoint/i },
  { name: 'auth',         category: 'security',    label: 'Authentication & Authorization', rx: /\bauth(?:entication|orization|n|z)?\b/i }
];

// Non-code domains get a task skeleton that fits the field instead of the
// software-flavoured one. Code-like domains use the technology-aware path below.
const TRAIL_FALLBACK_PROFILES = {
  general: {
    role: 'Senior generalist assistant',
    steps: [
      'Restate the goal in one line and list any assumptions you must make.',
      'Deliver the result in the most directly usable format.',
      'Flag missing information that would change the answer.'
    ],
    constraints: [
      'Be direct and specific; no preamble or closing filler.',
      'Prefer bullet lists and numbered steps over prose.',
      'Ask for clarification only if the task cannot be completed without it.'
    ]
  },
  cybersecurity: {
    role: 'Application security engineer and security analyst',
    steps: [
      'State the authorized system, scope and assumptions.',
      'Analyze risks or findings, with severity and rationale.',
      'Provide remediation guidance and safe validation steps.'
    ],
    constraints: [
      'Defensive focus; stay inside the stated, authorized scope.',
      'Never assume access or permission that was not provided.',
      'Reference relevant standards (e.g. OWASP, CWE) where applicable.'
    ]
  },
  product_management: {
    role: 'Product manager and product discovery partner',
    steps: [
      'Define the user problem, target users and desired outcome.',
      'Produce the requested deliverable (brief, user stories, roadmap or experiment plan).',
      'List assumptions, risks and success metrics.'
    ],
    constraints: [
      'Separate evidence from hypotheses.',
      'Call out missing information.',
      'Keep the format concise and scannable.'
    ]
  },
  business_strategy: {
    role: 'Business strategy analyst',
    steps: [
      'Frame the decision, the decision owner and the time horizon.',
      'Compare options with costs, risks and trade-offs.',
      'Recommend a course of action with concrete next steps.'
    ],
    constraints: [
      'State assumptions; separate known facts from estimates.',
      'Quantify where possible.',
      'Flag the data needed to validate the recommendation.'
    ]
  },
  education_research: {
    role: 'Educator and research assistant',
    steps: [
      'Identify the audience level and the learning or research objective.',
      'Deliver the explanation, plan or analysis in clear, structured steps.',
      'Include examples and a way to check understanding or verify claims.'
    ],
    constraints: [
      'Distinguish established findings from interpretation.',
      'Do not invent sources or results.',
      'Use language suited to the audience.'
    ]
  },
  creative_writing: {
    role: 'Creative writing editor and story partner',
    steps: [
      'Settle form, tone, point of view and audience.',
      'Draft the requested piece with concrete sensory detail and a natural voice.',
      'Preserve any story facts or characters already provided.'
    ],
    constraints: [
      'Avoid clichés.',
      'Match the requested length and genre.',
      'No preamble or commentary outside the piece itself.'
    ]
  },
  technical_writing: {
    role: 'Technical writer and developer advocate',
    steps: [
      'Identify the audience level and what needs documenting.',
      'Write the document in the right Diátaxis mode (tutorial, how-to, reference or explanation).',
      'Include code examples, parameter tables and error cases where relevant.'
    ],
    constraints: [
      'Precise, professional tone; no marketing language.',
      'Ready-to-publish output with no meta-commentary.',
      'Define jargon the first time it appears.'
    ]
  }
};

const TRAIL_CODE_DOMAINS = ['data_science', 'software_engineering', 'machine_learning', 'quant_finance'];

function detectTech(text) {
  const matched = [];
  for (const t of TRAIL_TECH_KEYWORDS) {
    const rx = t.rx || new RegExp(`\\b${t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (rx.test(text)) matched.push(t);
  }
  return matched;
}

function buildFallbackPrompt(raw, domainKey) {
  const text = (raw || '').trim();
  if (!text) return '';

  const preset  = DOMAIN_PRESETS[domainKey] || DOMAIN_PRESETS.general;
  const matched = detectTech(text);
  const techList = matched.map(m => m.label);

  // Strip only polite filler; keep the user's verb and casing intact.
  const task = text
    .replace(/^(?:hey|hi|hello)[,!\s]+/i, '')
    .replace(/^(?:can|could|would) you (?:please |kindly )?/i, '')
    .replace(/^(?:please|kindly)\s+/i, '')
    .replace(/^(?:i want you to|i need you to|i'd like you to|help me (?:to )?)\s*/i, '')
    .replace(/[?]+$/, '')
    .trim();
  const taskLine = task ? task.charAt(0).toUpperCase() + task.slice(1) : text;

  const codeLike = TRAIL_CODE_DOMAINS.includes(domainKey) ||
                   (domainKey === 'general' && matched.length > 0);

  // ── Non-code path ──
  if (!codeLike) {
    const profile = TRAIL_FALLBACK_PROFILES[domainKey] || TRAIL_FALLBACK_PROFILES.general;
    const role = techList.length ? `${profile.role}, familiar with ${techList.join(', ')}` : profile.role;
    return `### ROLE\n${role}.\n\n### TASK\n${taskLine}\n\nKey deliverables:\n${profile.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n### CONSTRAINTS & CONTEXT\n${profile.constraints.map(c => `- ${c}`).join('\n')}`;
  }

  // ── Code path ──
  let role = `Expert specialist in ${preset.label}`;
  if (techList.length) role += ` with deep specialization in ${techList.join(', ')}`;

  const target = techList.length ? techList.join('/') : 'the requested deliverable';
  const milestones = [
    `Confirm input boundaries and environment prerequisites for ${target}.`,
    'Implement the core solution with modularity, edge-case resilience and sensible efficiency.'
  ];

  const has = (cat) => matched.some(t => t.category === cat);
  if (has('backend') || has('api')) {
    milestones.push('Add defensive error handling, boundary validation and clear status/response contracts.');
  } else if (has('python_data') || has('ml')) {
    milestones.push('Handle missing values, dtype coercion and memory footprint.');
  } else if (has('frontend')) {
    milestones.push('Ensure responsive rendering, accessibility (WCAG) and clean component boundaries.');
  }
  milestones.push('Provide verification: unit tests, benchmarks or input/output examples.');

  const constraints = [
    'Provide direct, production-ready output with no conversational preamble.',
    'Skip filler to keep the response token-efficient.',
    'Use structured formatting (bullet lists, code blocks with language tags) where applicable.'
  ];
  const hasName = (n) => matched.some(t => t.name === n);
  if (hasName('pandas'))  constraints.push('Prefer vectorized operations over .iterrows(); keep memory use low (e.g. downcasting).');
  if (hasName('react'))   constraints.push('Use modern functional components, standard hooks and strict prop typing.');
  if (hasName('redis'))   constraints.push('Ensure atomic execution (Lua scripting or pipelines) to prevent race conditions.');
  if (hasName('auth'))    constraints.push('Follow least privilege; never log or expose credentials or tokens.');

  return `### ROLE\n${role}.\n\n### TASK\n${taskLine}\n\nKey deliverables:\n${milestones.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n### CONSTRAINTS & CONTEXT\n${constraints.map(c => `- ${c}`).join('\n')}`;
}

// Models sometimes wrap the whole answer in a ``` fence; unwrap it.
function cleanModelOutput(text) {
  const out = (text || '').trim();
  const fenced = out.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : out;
}

// ── Groq request ────────────────────────────────────────────────────────────
async function requestGroq(rawInput, domainKey, apiKey) {
  if (rawInput.length > TRAIL_MAX_INPUT) {
    throw new Error('Please keep drafts under 20,000 characters.');
  }
  const preset = DOMAIN_PRESETS[domainKey] || DOMAIN_PRESETS.general;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    response = await fetch(TRAIL_GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: TRAIL_GROQ_MODEL,
        messages: [
          { role: 'system', content: preset.instruction },
          { role: 'user', content: `Rewrite the following raw input as an optimized prompt. Do not answer it.\n\n<raw_input>\n${rawInput}\n</raw_input>` }
        ],
        // gpt-oss is a reasoning model: reasoning tokens count against the
        // completion budget, so keep effort low and the budget generous.
        reasoning_effort: 'low',
        max_completion_tokens: 2048
      })
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let msg = `Groq API request failed (HTTP ${response.status}).`;
    try {
      const errData = await response.json();
      msg = errData.error?.message || msg;
    } catch (_) { /* ignore parse error */ }
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      msg = retryAfter
        ? `Groq is busy or your free quota is reached. Try again in ${retryAfter} seconds.`
        : 'Groq is busy or your free quota is reached. Please try again shortly.';
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  const text = cleanModelOutput(choice?.message?.content);
  if (!text) {
    throw new Error(
      choice?.finish_reason === 'length'
        ? 'Groq ran out of tokens before finishing. Try a shorter draft.'
        : 'Groq returned an empty response.'
    );
  }
  return text;
}
