"use client";

import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  type?: "success" | "error";
  action?: ToastAction;
  onClose: () => void;
}

function ToastItem({ message, type = "success", action, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, action ? 4000 : 3000);
    return () => clearTimeout(t);
  }, [onClose, action]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium max-w-sm animate-slide-in ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
      <span className="flex-1">{message}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(); }}
          className="underline font-bold opacity-90 hover:opacity-100 shrink-0"
        >
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  return (
    <div id="toast-container" className="fixed top-4 right-4 z-9999 flex flex-col gap-2" />
  );
}

export function toast(message: string, type: "success" | "error" = "success", action?: ToastAction) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const wrapper = document.createElement("div");
  container.appendChild(wrapper);

  const root = createRoot(wrapper);
  const remove = () => {
    root.unmount();
    wrapper.remove();
  };

  root.render(<ToastItem message={message} type={type} action={action} onClose={remove} />);
}
