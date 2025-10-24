"use client";

import React, { useState } from "react";

export default function ImageUploader({ images = [], onImagesChange }) {
  const [thumbnailIndex, setThumbnailIndex] = useState(null);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);

    // Convert files to local URLs for preview
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updatedImages = [...images, ...newImages];
    if (thumbnailIndex === null && updatedImages.length > 0) setThumbnailIndex(0);

    if (onImagesChange) onImagesChange(updatedImages, thumbnailIndex ?? 0);
  };

  const handleThumbnailSelect = (index) => {
    setThumbnailIndex(index);
    if (onImagesChange) onImagesChange(images, index);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="file-input"
      />

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative border rounded-lg overflow-hidden cursor-pointer ${
                thumbnailIndex === idx ? "border-blue-600" : "border-gray-300"
              }`}
              style={{ width: 100, height: 100 }}
              onClick={() => handleThumbnailSelect(idx)}
            >
              <img
                src={img.url}
                alt={`upload-${idx}`}
                className="w-full h-full object-cover"
              />
              {thumbnailIndex === idx && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs px-1">
                  Thumbnail
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
