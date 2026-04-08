// ============================================================
// TM CLAUDE PROMPT OPTIMIZER — v4.0.0
// Output: solo texto natural optimizado. Sin etiquetas ni código.
// ============================================================

(function () {
  if (window.TMClaudeOptimizer?.initialized) return;

  const CONFIG = {
    namespace:   'TMClaudeOptimizer',
    version:     '4.0.0',
    buttonLabel: '⚗️ Optimizar para Claude',
  };

  // ─────────────────────────────────────────────
  // ANÁLISIS INTERNO
  // ─────────────────────────────────────────────
  function analyzePrompt(text) {
    return {
      hasRole:       /\b(actúa como|eres un|compórtate como|como experto|como si fueras|rol de)\b/i.test(text),
      hasContext:    /\b(contexto|situación|proyecto|empresa|equipo|sistema|porque|dado que)\b/i.test(text),
      hasConstraint: /\b(solo|únicamente|máximo|mínimo|sin|no incluyas|evita|limita)\b/i.test(text),
      hasFormat:     /\b(json|lista|tabla|markdown|bullet|código|resumen|párrafo|paso a paso|numerado)\b/i.test(text),
      hasGoal:       /\b(para|con el objetivo|quiero|necesito|busco|el resultado debe)\b/i.test(text),
      needsThinking: /\b(compara|analiza|evalúa|decide|estrategia|arquitectura|diseña|razona|argumenta|pros y contras)\b/i.test(text)
                     || text.trim().split(/\s+/).length > 30,
    };
  }

  // ─────────────────────────────────────────────
  // GENERADOR — solo texto natural, sin etiquetas
  // ─────────────────────────────────────────────
  function buildOptimizedPrompt(rawText) {
    const a = analyzePrompt(rawText);
    const parts = [];

    // ROL
    if (!a.hasRole) {
      parts.push('Actúa como un experto en el área relevante para esta tarea.');
    }

    // TAREA — siempre presente
    parts.push(`Tu tarea es: ${rawText.trim()}`);

    // CONTEXTO
    if (!a.hasContext) {
      parts.push('Considera el contexto necesario para dar una respuesta precisa y aplicable.');
    }

    // RESTRICCIONES
    if (!a.hasConstraint) {
      parts.push('Responde solo con información verificable. Si algo está fuera de tu conocimiento, indícalo claramente.');
    }

    // FORMATO
    if (!a.hasFormat) {
      parts.push('Organiza tu respuesta con secciones claras y usa formato Markdown cuando sea útil.');
    }

    // RAZONAMIENTO
    if (a.needsThinking) {
      parts.push('Razona paso a paso antes de dar la respuesta final.');
    }

    // OBJETIVO
    if (!a.hasGoal) {
      parts.push('El resultado debe ser accionable y listo para usar directamente.');
    }

    // Unir todo con salto de línea simple entre cada parte
    return parts.join('\n\n');
  }

  // ─────────────────────────────────────────────
  // INSERTAR EN EL INPUT DE TYPINGMIND
  // ─────────────────────────────────────────────
  function getInputArea() {
    return (
      document.querySelector('[data-element-id="chat-input-textbox"]') ||
      document.querySelector('textarea[placeholder]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  function insertIntoInput(text) {
    const el = getInputArea();
    if (!el) { alert('⚗️ No se encontró el input del chat.'); return; }

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      setter.call(el, text);
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (el.getAttribute('contenteditable') === 'true') {
      el.focus();
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    el.focus();
  }

  // ─────────────────────────────────────────────
  // PIPELINE PRINCIPAL
  // ─────────────────────────────────────────────
  function runOptimizationPipeline() {
    const el = getInputArea();
    if (!el) { alert('⚗️ No se encontró el input de TypingMind.'); return; }

    const rawText = (el.value || el.textContent || el.innerText || '').trim();
    if (!rawText) { alert('⚗️ Escribe tu prompt primero en el input del chat.'); return; }

    const optimized = buildOptimizedPrompt(rawText);
    insertIntoInput(optimized);

    console.log(`[${CONFIG.namespace}] v${CONFIG.version} — Prompt optimizado insertado ✓`);
  }

  // ─────────────────────────────────────────────
  // BOTÓN FLOTANTE
  // ─────────────────────────────────────────────
  function injectButton() {
    if (document.getElementById('tm-claude-optimizer-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'tm-claude-optimizer-btn';
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

