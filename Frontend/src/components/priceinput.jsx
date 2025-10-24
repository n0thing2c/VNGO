"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

export default function VNDInput({
  value = 0,
  onChange,
  placeholder = "0₫",
  max = Infinity, // <-- new max parameter
  className = "",
}) {
  const [rawValue, setRawValue] = useState(value);
  const inputRef = useRef(null);

  // Format number as VND
  const formatVND = (number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(number);

  const handleChange = (e) => {
    const cursorPos = e.target.selectionStart;
    const originalLength = e.target.value.length;

    // Remove non-digit characters
    let numericValue = e.target.value.replace(/\D/g, "");
    let intValue = parseInt(numericValue || "0", 10);

    // Enforce max
    if (intValue > max) intValue = max;

    setRawValue(intValue);
    if (onChange) onChange(intValue);

    // Update input value manually
    const formatted = intValue ? formatVND(intValue) : "";
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
      className={`text-right ${className}`}
    />
  );
}
