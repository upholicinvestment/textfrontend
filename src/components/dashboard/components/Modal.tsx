import React from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal: React.FC<Props> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
    <div className="absolute inset-0 bg-black/30" onClick={onClose} />
    <div className="relative w-[95vw] max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <button className="p-2 rounded-lg hover:bg-slate-100" onClick={onClose} aria-label="Close modal">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export default Modal;
