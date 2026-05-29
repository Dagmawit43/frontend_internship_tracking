// Consolidated toast utility — single implementation and exports.
const containerId = "app-toast-container";

function ensureContainer() {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement("div");
    el.id = containerId;
    el.style.position = "fixed";
    el.style.zIndex = 9999;
    el.style.right = "16px";
    el.style.top = "16px";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.gap = "8px";
    document.body.appendChild(el);
  }
  return el;
}

export function showToast({ type = "info", title = "", message = "", duration = 4000 } = {}) {
  const container = ensureContainer();
  if (!container) return null;

  const el = document.createElement("div");
  el.style.minWidth = "220px";
  el.style.maxWidth = "360px";
  el.style.padding = "10px 12px";
  el.style.borderRadius = "8px";
  el.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
  el.style.color = "#fff";
  el.style.fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
  el.style.display = "flex";
  el.style.alignItems = "flex-start";
  el.style.gap = "8px";

  if (type === "success") el.style.background = "linear-gradient(180deg,#059669,#047857)";
  else if (type === "error") el.style.background = "linear-gradient(180deg,#dc2626,#b91c1c)";
  else if (type === "warning") el.style.background = "linear-gradient(180deg,#f59e0b,#b45309)";
  else el.style.background = "linear-gradient(180deg,#374151,#111827)";

  const content = document.createElement("div");
  content.style.flex = "1";
  if (title) {
    const t = document.createElement("div");
    t.style.fontWeight = "600";
    t.style.fontSize = "13px";
    t.style.marginBottom = message ? "4px" : "0";
    t.textContent = title;
    content.appendChild(t);
  }
  if (message) {
    const m = document.createElement("div");
    m.style.fontSize = "13px";
    m.style.opacity = "0.95";
    m.textContent = message;
    content.appendChild(m);
  }

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.color = "rgba(255,255,255,0.9)";
  closeBtn.style.fontSize = "18px";
  closeBtn.style.cursor = "pointer";

  closeBtn.onclick = () => {
    if (el.parentNode) el.parentNode.removeChild(el);
  };

  el.appendChild(content);
  el.appendChild(closeBtn);
  container.appendChild(el);

  if (duration > 0) {
    setTimeout(() => {
      try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) { /* ignore */ }
    }, duration);
  }

  return el;
}

export const toast = {
  success: (message, duration = 3000) => showToast({ message, type: "success", duration }),
  error: (message, duration = 4000) => showToast({ message, type: "error", duration }),
  warning: (message, duration = 3500) => showToast({ message, type: "warning", duration }),
  info: (message, duration = 3000) => showToast({ message, type: "info", duration }),
};

export default toast;
