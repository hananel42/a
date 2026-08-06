/**
 * @file FileSearchInput.tsx
 * @description Modular search and filter input component for the workspace file explorer.
 * Features custom styling, clear button, and smooth focus animations.
 */

import React, { useRef } from "react";
import { Search, X } from "lucide-react";

interface FileSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

/**
 * FileSearchInput renders a modern, responsive search and filter textbox with a clear button.
 */
export default function FileSearchInput({
  value,
  onChange,
  placeholder = "Search files...",
}: FileSearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative flex items-center bg-[#090e1a] border border-[#141d30] hover:border-sky-500/30 focus-within:border-sky-500 rounded px-2 py-1 transition-all duration-200">
      <Search size={12} className="text-slate-500 shrink-0 mr-1.5" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none text-slate-100 text-[11px] outline-none placeholder-slate-600 font-medium"
      />
      {value && (
        <button
          onClick={handleClear}
          className="p-0.5 rounded-full text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors shrink-0 ml-1 cursor-pointer"
          title="Clear search"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}
