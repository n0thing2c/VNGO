import React, { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const SortSelect = ({ sort, setSort, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleValueChange = (field) => {
    if (field === "default") {
      setSort("");
      setOpen(false);
      return;
    }

    const [currentField, currentDir] = sort.split("_");
    if (currentField === field) {
      const newDir = currentDir === "asc" ? "desc" : "asc";
      setSort(`${field}_${newDir}`);
    } else {
      const opt = options.find(o => o.field === field);
      setSort(`${field}_${opt?.defaultDirection || "asc"}`);
    }
    setOpen(false);
  };

  const getLabel = () => {
    if (!sort) return "Default";

    const [field, dir] = sort.split("_");
    const opt = options.find(o => o.field === field);
    if (!opt) return "Default";

    return (
      <>
        {opt.label}{" "}
        {dir === "asc" ? (
          <ChevronUp className="w-3 h-3 inline" />
        ) : (
          <ChevronDown className="w-3 h-3 inline" />
        )}
      </>
    );
  };

  return (
    <div className="relative w-35" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2 px-3  text-md flex justify-between items-center font-medium"
      >
        {getLabel()}
      </button>

      {open && (
        <div className="absolute mt-1 w-full bg-white border rounded-sm shadow-md z-10">
          {options.map((opt) => (
            <button
              key={opt.field}
              onClick={() => handleValueChange(opt.field)}
              className="w-full text-left px-3 py-2 text-sm flex justify-between items-center hover:bg-gray-100"
            >
              {opt.label}
              {sort.startsWith(opt.field) && opt.field !== "default" && (
                sort.endsWith("asc") ? (
                  <ChevronUp className="w-3 h-3 inline ml-2" />
                ) : (
                  <ChevronDown className="w-3 h-3 inline ml-2" />
                )
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortSelect;
