"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

export default function VNDInput({
  value = 0,
  onChange,
  placeholder = "0₫",
  className = "", // <-- pass custom Tailwind classes here
}) {
  const [rawValue, setRawValue] = useState(value); // store integer
  const inputRef = useRef(null);

  // Format number as VND
  const formatVND = (number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(number);

  const handleChange = (e) => {
    const cursorPos = e.target.selectionStart;
    const originalLength = e.target.value.length;

    // Remove non-digit characters
    const numericValue = e.target.value.replace(/\D/g, "");
    const intValue = parseInt(numericValue || "0", 10);

    setRawValue(intValue);
    if (onChange) onChange(intValue);

    // Update input value manually
    const formatted = numericValue ? formatVND(intValue) : "";
    e.target.value = formatted;

    // Adjust cursor to approximate correct position
    const newLength = formatted.length;
    const diff = newLength - originalLength;
    e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      defaultValue={rawValue ? formatVND(rawValue) : ""}
      onChange={handleChange}
      placeholder={placeholder}
      className={`text-right ${className}`} // <-- apply custom className
    />
  );
}
