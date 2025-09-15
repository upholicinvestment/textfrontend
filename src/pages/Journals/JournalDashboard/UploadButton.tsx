import React, { useRef, useState } from "react";
import { api, getUserId } from "../../../api";

interface UploadButtonProps {
  onUpload: () => void;
  uploadUrl?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const WRONG_CSV_MSG = "Wrong CSV. Please upload the original orderbook CSV.";

const UploadButton: React.FC<UploadButtonProps> = ({
  onUpload,
  uploadUrl = "/upload-orderbook", // baseURL is already set in api.ts
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCsv = (file: File) =>
    file.name.toLowerCase().endsWith(".csv") ||
    (file.type || "").toLowerCase().includes("csv");

  const mapStatusToMessage = (status: number, backendMsg?: string) => {
    if (status === 401)
      return "You’re not signed in (or your session expired). Please log in and try again.";
    if (status === 413) return "That file is too large. Please upload a CSV under 10MB.";
    if (status === 429) return "Too many uploads right now. Please wait a moment and try again.";
    if (status === 400 || status === 415 || status === 422) return WRONG_CSV_MSG;
    if (status >= 500) return WRONG_CSV_MSG;
    if (backendMsg && backendMsg.trim().length <= 200) return backendMsg;
    if (status >= 400) return WRONG_CSV_MSG;
    return "Something went wrong while uploading.";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    // ---- validation ----
    if (!isCsv(file)) {
      setError("Only .csv files are accepted.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("That file is too large. Please upload a CSV under 10MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("orderbook", file);

      // do NOT set Content-Type manually; the browser sets the multipart boundary
      const res = await api.post(uploadUrl, formData);

      // ⬇️ NEW: soft-fail handling (server returns 200 with { ok: false })
      if (!res?.data?.ok) {
        setError(res.data?.message || WRONG_CSV_MSG);
        return; // stop here; do not mark as success
      }

      // success
      localStorage.setItem(
        getUserId() ? `orderbook_uploaded_at:${getUserId()}` : "orderbook_uploaded_at",
        Date.now().toString()
      );

      onUpload();
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error;

      if (status) {
        setError(mapStatusToMessage(status, backendMsg));
      } else {
        // no console logs; show a quiet message
        setError("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <button
        className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg ${
          isLoading ? "opacity-80 cursor-not-allowed" : "hover:scale-105 active:scale-95"
        }`}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        type="button"
        aria-label="Upload Orderbook (CSV only)"
        title="Upload Orderbook (CSV only)"
      >
        {isLoading ? "Uploading…" : "Upload Orderbook (.csv only)"}
      </button>

      <span className="text-xs text-slate-400">Only .csv files are accepted.</span>

      <input
        type="file"
        accept=".csv,text/csv"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mt-2 w-full max-w-sm">
          <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};

export default UploadButton;
