"use client";

import React, { useRef, useState, useEffect } from "react"; // 1. Import useEffect
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

// 2. Accept 'thumbnailIdx' as a prop (renamed to 'initialThumbnailIdx' to avoid confusion)
export default function ImageUploader({
  images = [],
  onImagesChange,
  thumbnailIdx: initialThumbnailIdx = 0, // <-- ADD THIS PROP
}) {
  // 3. Use the prop to set the initial state
  const [thumbnailIndex, setThumbnailIndex] = useState(initialThumbnailIdx); // <-- CHANGE THIS LINE
  const fileInputRef = useRef(null);

  // 4. [OPTIONAL, BUT RECOMMENDED] Sync state if the prop changes
  useEffect(() => {
    setThumbnailIndex(initialThumbnailIdx);
  }, [initialThumbnailIdx]);

  // Handle upload
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updatedImages = [...images, ...newImages];

    // This logic is now correct, as thumbnailIndex will be pre-filled
    const newThumbIdx =
      thumbnailIndex === null && updatedImages.length > 0 ? 0 : thumbnailIndex;

    setThumbnailIndex(newThumbIdx);
    onImagesChange?.(updatedImages, newThumbIdx ?? 0);
  };

  // Handle thumbnail select
  const handleThumbnailSelect = (index) => {
    setThumbnailIndex(index);
    onImagesChange?.(images, index);
  };

  // Handle remove image
  const handleRemove = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    let newThumbIdx = thumbnailIndex;

    // Adjust thumbnail index if necessary
    if (updatedImages.length === 0) newThumbIdx = null;
    else if (index === thumbnailIndex) newThumbIdx = 0;
    else if (index < thumbnailIndex) newThumbIdx = thumbnailIndex - 1;

    setThumbnailIndex(newThumbIdx);
    onImagesChange?.(updatedImages, newThumbIdx ?? 0);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ... rest of your component (no changes needed below) ... */}
      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 bg-[#23C491] hover:bg-white  hover:border-black hover:text-black hover:border-1  text-white "
      >
        <Upload className="w-4 h-4" />
        Upload Images
      </Button>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition group ${
                thumbnailIndex === idx
                  ? "border-[#23C491] border-3"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ width: 85, height: 85 }}
              onClick={() => handleThumbnailSelect(idx)}
            >
              <img
                src={img.url}
                alt={`upload-${idx}`}
                className="w-full h-full object-cover"
              />

              {/* Thumbnail Label */}
              {thumbnailIndex === idx && (
                <div className="absolute top-0 left-0 bg-[#23C491] text-white text-xs px-1 rounded-br-md">
                  Thumbnail
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}