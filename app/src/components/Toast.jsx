import { useState } from "react";

// A small, dismissible banner for surfacing errors (and confirmations) to
// the person actually using the app, instead of console.error alone, which
// nobody but a developer with devtools open will ever see.
export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, maxWidth: "90vw", minWidth: 260,
      background: isError ? "#5c2b2b" : "var(--sage, #3d7d6b)",
      color: "#fff", padding: "12px 16px", borderRadius: 12,
      boxShadow: "0 6px 20px rgba(0,0,0,.25)",
      display: "flex", alignItems: "center", gap: 12, fontSize: 13.5,
    }}>
      <span style={{flex: 1}}>{isError ? "⚠️ " : "✓ "}{toast.message}</span>
      <button onClick={onClose} style={{
        background: "transparent", border: "none", color: "#fff",
        opacity: 0.8, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  function showToast(message, type = "error") {
    setToast({ message, type });
    setTimeout(() => setToast(t => (t && t.message === message ? null : t)), type === "error" ? 6000 : 3500);
  }
  return { toast, showToast, clearToast: () => setToast(null) };
}
