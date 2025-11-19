"use client";

import React, { useRef } from "react";
import { Clock } from "lucide-react";

export default function TimeInput({ value, onChange }) {
  const inputRef = useRef(null);

  return (
    <div
      className="relative w-30 sm:w-45 cursor-pointer"
      onClick={() => inputRef.current?.showPicker()}
    >
      {/* Fake display */}
      <div
        className="
          w-full h-9 shadow-2xs
          bg-white border border-gray-200 rounded-3xl
          flex items-center justify-center
          text-[#23C491] font-bold text-sm sm:text-md
          select-none px-3
        "
      >
        {value ? (
          <div className="flex items-center justify-center gap-2 w-full">
            <span>{value}</span>
            <Clock className="w-4 h-4 text-[#23C491]" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <Clock className="w-4 h-4 text-[#23C491]" />
          </div>
        )}
      </div>

      {/* Hidden native time input */}
      <input
        ref={inputRef}
        type="time"
        value={value ?? ""}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      />
    </div>
  );
}
