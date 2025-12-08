"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TagSelector({
  tags = [],
  selectedTags = [],
  setSelectedTags,
  tagVariants = {}, // mapping: tag -> variant
  useBadgeVariants = false, // If true, applies tagVariants values as Badge `variant` prop.
  // defaultSelectedVariant = "default", // fallback variant for selected
  // defaultUnselectedVariant = "secondary"  // fallback for unselected
}) {
  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag) // remove
        : [...prev, tag] // add
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        // const variant = tagVariants[tag] || defaultSelectedVariant;
        const activeClass = tagVariants[tag] || "bg-neutral-800 text-white hover:bg-neutral-700";

        // Logic to determine variant and className based on useBadgeVariants
        const badgeVariant = isSelected && useBadgeVariants ? (tagVariants[tag] || "default") : "secondary";

        return (
          <Badge
            key={tag}
            // // variant={isSelected ? variant : defaultUnselectedVariant}
            // // className="cursor-pointer"
            // variant="secondary"
            variant={badgeVariant}
            className={cn(
              "cursor-pointer text-sm py-1 px-3 transition-all duration-200 border select-none",
              isSelected
                // ? cn(activeClass, "border-transparent shadow-sm font-medium") // Style when selected (Pastel color)
                // : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-900 font-normal" // Style when not selected (Light gray)
                ? cn(
                  !useBadgeVariants && activeClass, // Only apply activeClass as className if NOT using badge variants
                  "border-transparent shadow-sm font-medium"
                )
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-900 font-normal"
            )}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}
