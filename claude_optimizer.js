function () {
  const OPTIMIZE_SYSTEM_PROMPT = `You are an expert prompt engineer. Your task is to optimize the user's prompt to get the best possible response from Claude AI. Apply these rules:
1. Add clear role/context if missing.
2. Make the goal explicit and specific.
3. Define output format, tone, and constraints.
4. Keep the original intent 100% intact.
5. Do NOT add explanations — return ONLY the optimized prompt, nothing else.`;

  function getInputEditor() {
    return (
      document.querySelector('[data-element-id="chat-input-textbox"]') ||
      document.querySelector("textarea#chat-input-textbox") ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  function getInputText(el) {
    if (!el) return "";
    return el.tagName === "TEXTAREA" || el.tagName === "INPUT"
      ? el.value
      : el.innerText || el.textContent;
  }

  function setInputText(el, text) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(el, text);
      el.value = text;
    } else {
      el.innerText = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.focus();
  }

  function getApiKey() {
    try {
      const raw = localStorage.getItem("ANTHROPIC_API_KEY") || "";
      if (raw) return raw.replace(/^"|"$/g, "");
    } catch (_) { }
    try {
      const keys = Object.keys(localStorage).filter(
        (k) =>
          k.toLowerCase().includes("anthropic") ||
          k.toLowerCase().includes("claude") ||
          k.toLowerCase().includes("api_key")
      );
      for (const k of keys) {
        const v = localStorage.getItem(k)?.replace(/^"|"$/g, "") || "";
        if (v.startsWith("sk-ant-")) return v;
      }
    } catch (_) { }
    return null;
  }

  async function optimizePrompt(originalText) {
    const apiKey = getApiKey();
    if (!apiKey) {
      alert(
        "⚠️ Claude API Key not found. Make sure it is configured in TypingMind settings."
      );
      return null;
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-6",
        max_tokens: 1024,
        system: OPTIMIZE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: originalText }],
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data?.content?.[0]?.text || null;
  }

  function createOptimizeButton() {
    const btn = document.createElement("button");
    btn.id = "tm-optimize-btn";
    btn.title = "Optimize prompt for Claude AI";
    btn.innerHTML = "⚡ Optimize";
    Object.assign(btn.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "5px 12px",
      borderRadius: "8px",
      border: "1px solid #d97706",
      background: "linear-gradient(135deg, #f59e0b, #d97706)",
      color: "#fff",
      fontWeight: "600",
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      boxShadow: "0 1px 4px rgba(217,119,6,0.3)",
      marginLeft: "6px",
      flexShrink: "0",
    });

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "linear-gradient(135deg, #d97706, #b45309)";
      btn.style.transform = "scale(1.03)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
      btn.style.transform = "scale(1)";
    });

    btn.addEventListener("click", async () => {
      const inputEl = getInputEditor();
      const text = getInputText(inputEl).trim();
      if (!text) {
        alert("✏️ Write a prompt first before optimizing.");
        return;
      }
      btn.disabled = true;
      btn.innerHTML = "⏳ Optimizing...";
      btn.style.opacity = "0.75";
      try {
        const optimized = await optimizePrompt(text);
        if (optimized) {
          setInputText(inputEl, optimized);
          btn.innerHTML = "✅ Done!";
          setTimeout(() => {
            btn.innerHTML = "⚡ Optimize";
            btn.disabled = false;
            btn.style.opacity = "1";
          }, 1800);
        } else {
          throw new Error("Empty response from Claude.");
        }
      } catch (e) {
        console.error("[TM Optimizer]", e);
        alert(`❌ Error optimizing prompt:\n${e.message}`);
        btn.innerHTML = "⚡ Optimize";
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    });

    return btn;
  }

  function injectButton() {
    if (document.getElementById("tm-optimize-btn")) return;

    const toolbarSelectors = [
      '[data-element-id="chat-input-actions"]',
      '[data-element-id="send-button"]',
      "form.chat-input-form",
      '[data-element-id="chat-input-textbox"]',
    ];

    let anchor = null;
    for (const sel of toolbarSelectors) {
      anchor = document.querySelector(sel);
      if (anchor) break;
    }

    if (!anchor) return;

    const btn = createOptimizeButton();

    if (
      anchor.dataset.elementId === "send-button" ||
      anchor.dataset.elementId === "chat-input-actions"
    ) {
      anchor.parentElement?.insertBefore(btn, anchor);
    } else {
      anchor.parentElement?.appendChild(btn);
    }
  }

  const observer = new MutationObserver(() => {
    injectButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButton);
  } else {
    injectButton();
  }
})();
