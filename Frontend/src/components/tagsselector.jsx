"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export default function TagSelector({
  tags = [],
  selectedTags = [],
  setSelectedTags,
  tagVariants = {}, // mapping: tag -> variant
  defaultSelectedVariant = "default", // fallback variant for selected
  defaultUnselectedVariant = "secondary"  // fallback for unselected
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
        const variant = tagVariants[tag] || defaultSelectedVariant;

        return (
          <Badge
            key={tag}
            variant={isSelected ? variant : defaultUnselectedVariant}
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}
