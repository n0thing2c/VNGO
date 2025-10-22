"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function TagSelector({ tags = [], initialSelected = [] }) {
  const [selectedTags, setSelectedTags] = useState(initialSelected);

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
        return (
          <Badge
            key={tag}
            variant={isSelected ? "default" : "secondary"}
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
