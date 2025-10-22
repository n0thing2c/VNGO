import React from "react";

export default function DropList({ label, name, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        <option value="" disabled>
          -- Select an option --
        </option>
        {options.map((opt, index) => (
          <option key={index} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
