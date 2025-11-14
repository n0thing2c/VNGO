// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Field,
//   FieldDescription,
//   FieldGroup,
//   FieldLabel,
//   FieldSeparator,
// } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { toast } from "sonner";

// export function InfoForm({ className, ...props }) {
//   return (
//     <div
//       className={cn("flex flex-col items-center pb-4", className)}
//       {...props}
//     ></div>
//   );
// }

import { Info } from 'lucide-react';
import React from 'react';

export const InfoForm = ({ label, type = 'text', value, onChange, options = [], readOnly = false }) => {
  const inputId = 1;

  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {type === 'select' && options.length > 0 ? (
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out bg-white"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={`px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150 ease-in-out ${readOnly ? 'bg-gray-50' : 'bg-white'}`}
        />
      )}
    </div>
  );
};