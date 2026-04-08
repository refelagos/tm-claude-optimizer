// ============================================================
// TM CLAUDE PROMPT OPTIMIZER — v2.0.0
// Solo entrega el prompt optimizado en el chat. Sin análisis visible.
// ============================================================

(function () {
  if (window.TMClaudeOptimizer?.initialized) return;

  const CONFIG = {
    namespace:   'TMClaudeOptimizer',
    version:     '2.0.0',
    temperature: 0.5,
    model:       'claude-opus-4-6',
    buttonLabel: '⚗️ Optimizar para Claude',
  };

  // ─────────────────────────────────────────────
  // ANÁLISIS INTERNO (invisible para el usuario)
  // ─────────────────────────────────────────────
  function analyzePrompt(text) {
    const hasVerb       = /\b(crea|genera|analiza|explica|describe|lista|compara|resume|escribe|desarrolla|define)\b/i.test(text);
    const hasQuestion   = /\?/.test(text);
    const isVague       = text.trim().split(' ').length < 6;
    const hasContext    = /\b(contexto|situación|proyecto|empresa|equipo|sistema|para|porque|dado que)\b/i.test(text);
    const hasConstraint = /\b(solo|únicamente|máximo|mínimo|sin|no incluyas|evita|limita)\b/i.test(text);
    const hasFormat     = /\b(json|lista|tabla|markdown|bullet|código|resumen|párrafo|sección|paso a paso|numerado)\b/i.test(text);
    const hasRole       = /\b(actúa como|eres un|compórtate como|como experto|como si fueras|rol de)\b/i.test(text);
    const isComplex     = /\b(compara|analiza|evalúa|decide|pros y contras|estrategia|arquitectura|diseña|razona|argumenta)\b/i.test(text);
    const isLong        = text.trim().split(/\s+/).length > 30;

    return {
      hasVerb,
      hasQuestion,
      isVague,
      hasContext,
      hasConstraint,
      hasFormat,
      hasRole,
      needsThinking: isComplex || isLong,
    };
  }

  // ─────────────────────────────────────────────
  // GENERADOR DEL PROMPT OPTIMIZADO
  // ─────────────────────────────────────────────
  function buildOptimizedPrompt(rawText) {
    const a = analyzePrompt(rawText);

    const roleBlock = a.hasRole
      ? ''
      : `<role>
  Eres un asistente experto. Responde con precisión estructurada y cita fuentes cuando las tengas.
</role>`;

    const thinkingNote = a.needsThinking
      ? `\n<!-- Activar: thinking: { type: "enabled", budget_tokens: 8000 } -->`
      : '';

    const formatBlock = a.hasFormat
      ? ''
      : `<output_format>
  Usa Markdown. Incluye headers, bullets y bloques de código cuando aplique.
  Responde en el idioma del usuario.
</output_format>`;

    const constraintBlock = a.hasConstraint
      ? ''
      : `<constraints>
  <constraint>Responde únicamente con información verificable o indica cuando estés inferiendo.</constraint>
  <constraint>Si la tarea es ambigua, solicita clarificación antes de proceder.</constraint>
</constraints>`;

    return `${thinkingNote}
<system>
${roleBlock}
${constraintBlock}
${formatBlock}
</system>

<context>
${a.hasContext
  ? '<!-- Contexto detectado en tu prompt ↓ -->'
  : '<!-- Añade aquí contexto adicional si lo tienes -->'}
${rawText}
</context>

<task>
${rawText.trim()}
</task>

<instructions>
${a.needsThinking
  ? 'Esta tarea requiere análisis profundo. Expón tu razonamiento paso a paso antes de la respuesta final.'
  : 'Responde directamente con la solución o análisis solicitado.'}
Estructura la respuesta con secciones claras separadas por headers Markdown.
</instructions>`;
  }

  // ─────────────────────────────────────────────
  // INSERTAR PROMPT OPTIMIZADO DIRECTAMENTE
  // EN EL INPUT DE TYPINGMIND
  // ─────────────────────────────────────────────
  function insertOptimizedPromptIntoInput(optimizedPrompt) {
    // Buscar el textarea / input del chat
    const inputArea =
      document.querySelector('[data-element-id="chat-input-textbox"]') ||
      document.querySelector('textarea[placeholder]') ||
      document.querySelector('div[contenteditable="true"]');

    if (!inputArea) {
      alert('No se encontró el input del chat. Intenta de nuevo.');
      return;
    }

    // Si es textarea normal
    if (inputArea.tagName === 'TEXTAREA' || inputArea.tagName === 'INPUT') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(inputArea, optimizedPrompt);
      inputArea.dispatchEvent(new Event('input', { bubbles: true }));
      inputArea.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Si es div contenteditable (como usa TypingMind)
    if (inputArea.getAttribute('contenteditable') === 'true') {
      inputArea.focus();
      inputArea.innerText = optimizedPrompt;
      inputArea.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    // Enfocar para que el usuario vea el resultado
    inputArea.focus();
  }

  // ─────────────────────────────────────────────
  // PIPELINE PRINCIPAL
  // ─────────────────────────────────────────────
  function runOptimizationPipeline() {
    const inputArea =
      document.querySelector('[data-element-id="chat-input-textbox"]') ||
      document.querySelector('textarea[placeholder]') ||
      document.querySelector('div[contenteditable="true"]');

    if (!inputArea) {
      alert('⚗️ No se encontró el input de TypingMind.');
      return;
    }

    const rawText = (
      inputArea.value ||
      inputArea.textContent ||
      inputArea.innerText ||
      ''
    ).trim();

    if (!rawText) {
      alert('⚗️ Escribe tu prompt primero en el input del chat.');
      return;
    }

    // Generar prompt optimizado e insertarlo en el input
    const optimizedPrompt = buildOptimizedPrompt(rawText);
    insertOptimizedPromptIntoInput(optimizedPrompt);

    console.log(`[${CONFIG.namespace}] v${CONFIG.version} — Prompt optimizado insertado en el input.`);
  }

  // ─────────────────────────────────────────────
  // BOTÓN FLOTANTE
  // ─────────────────────────────────────────────
  function injectButton() {
    if (document.getElementById('tm-claude-optimizer-btn')) return;

    const btn = document.createElement('button');
    btn.id        = 'tm-claude-optimizer-btn';
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
      box-shadow: 0 4px 15px rgba(108,92,231,0.4);
      transition: transform 0.2s ease;
    `;

    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', runOptimizationPipeline);

    document.body.appendChild(btn);
    window.TMClaudeOptimizer._btn = btn;
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  function init() {
    injectButton();

    const observer = new MutationObserver(() => {
      if (!document.getElementById('tm-claude-optimizer-btn')) injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.TMClaudeOptimizer._observer = observer;

    console.log(`[${CONFIG.namespace}] v${CONFIG.version} inicializado ✓`);
  }

  window.TMClaudeOptimizer = {
    initialized: true,
    version:     CONFIG.version,
    runPipeline: runOptimizationPipeline,
    destroy() {
      if (this._btn) this._btn.remove();
      if (this._observer) this._observer.disconnect();
      delete window.TMClaudeOptimizer;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1500);
  }

})();
