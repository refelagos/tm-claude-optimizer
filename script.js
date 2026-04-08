// ============================================================
// TM CLAUDE PROMPT OPTIMIZER — v1.0.0
// Namespace: window.TMClaudeOptimizer
// Intercepta el input del usuario, lo analiza y genera
// un prompt optimizado con estructura XML para Claude API.
// ============================================================

(function () {var _window$TMClaudeOptim;
  if ((_window$TMClaudeOptim = window.TMClaudeOptimizer) !== null && _window$TMClaudeOptim !== void 0 && _window$TMClaudeOptim.initialized) return;

  // ─────────────────────────────────────────────
  // CONFIG
  // ─────────────────────────────────────────────
  const CONFIG = {
    namespace: "TMClaudeOptimizer",
    version: "1.0.0",
    temperature: 0.5,
    model: "claude-opus-4-6",
    buttonLabel: "⚗️ Optimizar para Claude",
    storageKey: "tm_claude_optimizer_enabled" };


  // ─────────────────────────────────────────────
  // PIPELINE DE ANÁLISIS
  // Cada análisis recibe el texto crudo y retorna
  // un objeto { dimension, score, finding, suggestion }
  // ─────────────────────────────────────────────
  const ANALYSIS_PIPELINE = [
  {
    id: "intent",
    dimension: "Intención y objetivo",
    analyze: text => {
      const hasVerb = /\b(crea|genera|analiza|explica|describe|lista|compara|resume|escribe|desarrolla|define)\b/i.test(
      text);

      const hasQuestion = /\?/.test(text);
      const isVague = text.trim().split(" ").length < 6;
      return {
        score: isVague ? "bajo" : hasVerb || hasQuestion ? "alto" : "medio",
        finding: isVague ?
        "Prompt demasiado corto o ambiguo. Falta verbo de acción claro." :
        hasVerb ?
        "Intención detectada con verbo de acción presente." :
        "Intención implícita, podría ser más directa.",
        suggestion: isVague ?
        "Añade un verbo de acción específico y define el resultado esperado." :
        "Refuerza el objetivo con un resultado concreto y medible." };

    } },

  {
    id: "context",
    dimension: "Contexto proporcionado",
    analyze: text => {
      const wordCount = text.trim().split(/\s+/).length;
      const hasContext = /\b(contexto|situación|proyecto|empresa|equipo|sistema|para|porque|dado que)\b/i.test(
      text);

      return {
        score: wordCount < 10 ? "bajo" : hasContext ? "alto" : "medio",
        finding: hasContext ?
        "Se detecta contexto de fondo en el prompt." :
        "Falta contexto situacional que ancle la respuesta.",
        suggestion:
        "Envuelve el contexto en <context>...</context> para aprovechar el largo context window de Claude." };

    } },

  {
    id: "specificity",
    dimension: "Especificidad y restricciones",
    analyze: text => {
      const hasNumbers = /\d/.test(text);
      const hasConstraint = /\b(solo|únicamente|máximo|mínimo|sin|no incluyas|evita|limita)\b/i.test(
      text);

      return {
        score: hasConstraint ? "alto" : hasNumbers ? "medio" : "bajo",
        finding: hasConstraint ?
        "Se detectan restricciones explícitas." :
        "Sin restricciones claras. Claude puede sobredeliverar o perderse.",
        suggestion:
        "Añade restricciones en <constraints>. Ej: longitud, formato, idioma, qué excluir." };

    } },

  {
    id: "format",
    dimension: "Formato de salida esperado",
    analyze: text => {
      const formatTerms = /\b(json|lista|tabla|markdown|bullet|código|resumen|párrafo|sección|paso a paso|numerado)\b/i.test(
      text);

      return {
        score: formatTerms ? "alto" : "bajo",
        finding: formatTerms ?
        "Se especifica formato de salida." :
        "No se indica el formato de salida deseado.",
        suggestion:
        "Especifica el formato en <output_format>. Claude respeta muy bien las instrucciones de estructura XML." };

    } },

  {
    id: "role",
    dimension: "Asignación de rol o persona",
    analyze: text => {
      const hasRole = /\b(actúa como|eres un|compórtate como|como experto|como si fueras|rol de)\b/i.test(
      text);

      return {
        score: hasRole ? "alto" : "bajo",
        finding: hasRole ?
        "Rol o persona asignada detectada." :
        "Sin asignación de rol. Claude responde mejor con una identidad clara.",
        suggestion:
        "Define el rol en el campo <role> del system prompt. Claude ancla mejor su comportamiento con rol explícito." };

    } },

  {
    id: "thinking",
    dimension: "Complejidad y necesidad de razonamiento",
    analyze: text => {
      const complexTerms = /\b(compara|analiza|evalúa|decide|pros y contras|estrategia|arquitectura|diseña|razona|argumenta)\b/i.test(
      text);

      const isLong = text.trim().split(/\s+/).length > 30;
      return {
        score: complexTerms || isLong ? "alto" : "bajo",
        finding: complexTerms ?
        "Tarea compleja detectada. Se recomienda extended thinking." :
        "Tarea directa. El razonamiento extendido es opcional.",
        suggestion: complexTerms ?
        'Activa thinking: {type: "enabled", budget_tokens: 8000} en la llamada API para esta tarea.' :
        "Temperatura 0.5 es suficiente. No es necesario extended thinking." };

    } }];



  // ─────────────────────────────────────────────
  // GENERADOR DE PROMPT OPTIMIZADO PARA CLAUDE
  // ─────────────────────────────────────────────
  function buildOptimizedPrompt(rawText, analysisResults) {
    const hasRole =
    analysisResults.find(r => r.id === "role").score === "alto";
    const hasContext =
    analysisResults.find(r => r.id === "context").score !== "bajo";
    const needsThinking =
    analysisResults.find(r => r.id === "thinking").score === "alto";
    const hasFormat =
    analysisResults.find(r => r.id === "format").score === "alto";

    const roleBlock = hasRole ?
    `<!-- ROL DETECTADO EN EL PROMPT ORIGINAL -->` :
    `<role>\n  Eres un asistente experto. Responde con precisión estructurada y cita fuentes cuando las tengas.\n</role>`;

    const thinkingNote = needsThinking ?
    `\n<!-- ⚙️ SUGERENCIA TÉCNICA: Activar extended thinking en la llamada API -->\n<!-- thinking: { type: "enabled", budget_tokens: 8000 } -->` :
    "";

    const formatBlock = hasFormat ?
    `<!-- FORMATO DETECTADO EN EL PROMPT ORIGINAL -->` :
    `<output_format>\n  Usa Markdown. Incluye headers, bullets y bloques de código cuando aplique.\n  Responde en el idioma del usuario.\n</output_format>`;

    return `<!-- ════════════════════════════════════════════ -->
<!-- PROMPT OPTIMIZADO PARA CLAUDE — by TMClaudeOptimizer v${CONFIG.version} -->
<!-- Temperatura recomendada: ${CONFIG.temperature} | Modelo: ${
    CONFIG.model
    } -->
<!-- ════════════════════════════════════════════ -->${thinkingNote}

<system>
  ${roleBlock}

  <constraints>
    <constraint>Responde únicamente con información verificable o indica expresamente cuando estés inferiendo.</constraint>
    <constraint>Si la tarea es ambigua, solicita clarificación antes de proceder.</constraint>
    <constraint>Mantén consistencia estructural XML en toda la respuesta si el output es estructurado.</constraint>
  </constraints>

  ${formatBlock}
</system>

<context>
  ${
    hasContext ?
    "<!-- Contexto extraído del prompt original ↓ -->" :
    "<!-- Añade aquí el contexto relevante de tu proyecto/situación -->"
    }
  ${rawText}
</context>

<task>
  <!-- TAREA PRINCIPAL: reescrita para mayor precisión -->
  ${rawText.trim()}
</task>

<instructions>
  Antes de responder, evalúa si necesitas razonamiento paso a paso.
  ${
    needsThinking ?
    "Esta tarea requiere análisis profundo: expón tu cadena de pensamiento antes de la respuesta final." :
    "Responde directamente con la solución o análisis solicitado."
    }
  Estructura la respuesta con secciones claras separadas por headers Markdown.
</instructions>`;
  }

  // ─────────────────────────────────────────────
  // RENDERIZADO DEL PANEL DE ANÁLISIS EN EL CHAT
  // ─────────────────────────────────────────────
  function renderAnalysisPanel(rawText, results, optimizedPrompt) {
    const scores = { alto: "🟢", medio: "🟡", bajo: "🔴" };

    const dimensionsHTML = results.
    map(
    r => `
      <div style="margin-bottom:10px; padding:8px; background:#1a1a2e; border-left:3px solid ${
    r.score === "alto" ?
    "#00b894" :
    r.score === "medio" ?
    "#fdcb6e" :
    "#d63031"
    }; border-radius:4px;">
        <div style="font-weight:700; font-size:12px; color:#a29bfe;">${
    scores[r.score]
    } ${r.dimension}</div>
        <div style="font-size:11px; color:#dfe6e9; margin-top:4px;">📋 ${
    r.finding
    }</div>
        <div style="font-size:11px; color:#74b9ff; margin-top:3px;">💡 ${
    r.suggestion
    }</div>
      </div>`).

    join("");

    const panel = document.createElement("div");
    panel.setAttribute("data-tm-claude-optimizer", "true");
    panel.style.cssText = `
      font-family: monospace;
      background: #0d0d1a;
      border: 1px solid #6c5ce7;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
      max-width: 100%;
      color: #dfe6e9;
    `;
    panel.innerHTML = `
      <div style="font-size:14px; font-weight:800; color:#a29bfe; margin-bottom:12px;">
        ⚗️ Claude Prompt Optimizer — Análisis Completo
      </div>
      ${dimensionsHTML}
      <div style="margin-top:14px;">
        <div style="font-size:13px; font-weight:700; color:#00cec9; margin-bottom:8px;">
          ✅ Prompt Optimizado para Claude (listo para copiar)
        </div>
        <pre style="
          background:#111122;
          border:1px solid #2d3436;
          border-radius:6px;
          padding:12px;
          font-size:11px;
          color:#81ecec;
          white-space:pre-wrap;
          word-break:break-word;
          max-height:400px;
          overflow-y:auto;
        ">${escapeHTML(optimizedPrompt)}</pre>
        <button id="tm-claude-copy-btn" style="
          margin-top:8px;
          background:#6c5ce7;
          color:#fff;
          border:none;
          border-radius:4px;
          padding:6px 14px;
          cursor:pointer;
          font-size:12px;
          font-weight:600;
        ">📋 Copiar Prompt Optimizado</button>
      </div>
    `;

    // Evento copiar
    setTimeout(() => {
      const btn = panel.querySelector("#tm-claude-copy-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          navigator.clipboard.writeText(optimizedPrompt).then(() => {
            btn.textContent = "✅ ¡Copiado!";
            setTimeout(() => {
              btn.textContent = "📋 Copiar Prompt Optimizado";
            }, 2000);
          });
        });
      }
    }, 100);

    return panel;
  }

  function escapeHTML(str) {
    return str.
    replace(/&/g, "&amp;").
    replace(/</g, "&lt;").
    replace(/>/g, "&gt;");
  }

  // ─────────────────────────────────────────────
  // INYECCIÓN DEL BOTÓN EN EL INPUT DE TYPINGMIND
  // ─────────────────────────────────────────────
  function injectOptimizerButton() {
    if (document.getElementById("tm-claude-optimizer-btn")) return;

    const inputArea =
    document.querySelector('[data-element-id="chat-input-textbox"]') ||
    document.querySelector("textarea[placeholder]") ||
    document.querySelector('div[contenteditable="true"]');

    if (!inputArea) return;

    const btn = document.createElement("button");
    btn.id = "tm-claude-optimizer-btn";
    btn.textContent = CONFIG.buttonLabel;
    btn.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 9999;
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
      transition: all 0.2s ease;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.05)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", () => {
      const rawText =
      inputArea.value || inputArea.textContent || inputArea.innerText || "";
      if (!rawText.trim()) {
        alert("⚗️ Claude Optimizer: Escribe tu prompt primero en el input.");
        return;
      }
      runOptimizationPipeline(rawText.trim());
    });

    document.body.appendChild(btn);
    window.TMClaudeOptimizer._btn = btn;
  }

  // ─────────────────────────────────────────────
  // PIPELINE PRINCIPAL
  // ─────────────────────────────────────────────
  function runOptimizationPipeline(rawText) {
    // 1. Ejecutar todos los análisis
    const results = ANALYSIS_PIPELINE.map(step => ({
      id: step.id,
      dimension: step.dimension,
      ...step.analyze(rawText) }));


    // 2. Construir prompt optimizado
    const optimizedPrompt = buildOptimizedPrompt(rawText, results);

    // 3. Renderizar panel en el chat
    const chatContainer =
    document.querySelector('[data-element-id="chat-space-middle-part"]') ||
    document.querySelector("main") ||
    document.body;

    // Remover panel anterior si existe
    const existing = chatContainer.querySelector("[data-tm-claude-optimizer]");
    if (existing) existing.remove();

    const panel = renderAnalysisPanel(rawText, results, optimizedPrompt);
    chatContainer.appendChild(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });

    console.log(
    `[${CONFIG.namespace}] Pipeline ejecutado. Prompt optimizado generado.`);

  }

  // ─────────────────────────────────────────────
  // INIT + OBSERVER PARA SPA
  // ─────────────────────────────────────────────
  function init() {
    injectOptimizerButton();

    // Observer para SPAs donde el DOM cambia dinámicamente
    const observer = new MutationObserver(() => {
      if (!document.getElementById("tm-claude-optimizer-btn")) {
        injectOptimizerButton();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.TMClaudeOptimizer._observer = observer;

    console.log(`[${CONFIG.namespace}] v${CONFIG.version} inicializado ✓`);
  }

  // ─────────────────────────────────────────────
  // REGISTRO GLOBAL + ARRANQUE
  // ─────────────────────────────────────────────
  window.TMClaudeOptimizer = {
    initialized: true,
    version: CONFIG.version,
    config: CONFIG,
    runPipeline: runOptimizationPipeline,
    destroy() {
      if (this._btn) this._btn.remove();
      if (this._observer) this._observer.disconnect();
      delete window.TMClaudeOptimizer;
    } };


  // Esperar a que el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 1500); // Esperar hydratación de la SPA
  }
})();