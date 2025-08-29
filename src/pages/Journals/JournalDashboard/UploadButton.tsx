import React, { useRef, useState } from "react";

interface UploadButtonProps {
  onUpload: () => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("orderbook", file);

      const response = await fetch("http://localhost:8000/api/upload-orderbook", {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onUpload();
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      let errorMessage = 'Failed to upload file. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <button
          className={`relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
            isLoading ? 'opacity-80 cursor-not-allowed scale-100' : 'active:scale-95'
          }`}
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          <div className="flex items-center justify-center space-x-3">
            {isLoading ? (
              <>
                <div className="relative">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <span className="text-lg">Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-lg">Upload Orderbook</span>
              </>
            )}
          </div>
          
          {/* Animated background effect */}
          {!isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
          )}
        </button>

        {/* Subtle glow effect */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-30 blur-md transition-opacity duration-200 -z-10 ${
          isLoading ? 'opacity-50' : 'group-hover:opacity-60'
        }`}></div>
      </div>
      
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      
      {/* Upload instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>CSV files only • Max 10MB</span>
        </p>
      </div>
      
      {error && (
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadButton;