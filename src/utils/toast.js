// Simple toast notification utility
let toastContainer = null;

const getToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const createToastElement = (message, type = "info") => {
  const toast = document.createElement("div");
  const bgColor = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }[type] || "#3b82f6";

  const textColor = "#ffffff";
  toast.style.cssText = `
    background-color: ${bgColor};
    color: ${textColor};
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    word-wrap: break-word;
    pointer-events: auto;
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
  `;

  toast.textContent = message;
  toast.onclick = () => {
    toast.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => toast.remove(), 300);
  };

  return toast;
};

export const showToast = (message, type = "info", duration = 3000) => {
  const container = getToastContainer();
  const toast = createToastElement(message, type);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
};

export const toast = {
  success: (message, duration = 3000) => showToast(message, "success", duration),
  error: (message, duration = 4000) => showToast(message, "error", duration),
  warning: (message, duration = 3500) => showToast(message, "warning", duration),
  info: (message, duration = 3000) => showToast(message, "info", duration),
};

export default toast;
