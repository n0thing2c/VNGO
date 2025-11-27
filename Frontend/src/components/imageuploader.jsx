"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

export default function ImageUploader({
  images = [],
  onImagesChange,
  allowThumbnail = true, // NEW PROP
  thumbnailIdx: initialThumbnailIdx = 0,
  showPreview = true,
}) {
  const [thumbnailIndex, setThumbnailIndex] = useState(
    allowThumbnail ? initialThumbnailIdx : null
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (allowThumbnail) setThumbnailIndex(initialThumbnailIdx);
  }, [initialThumbnailIdx, allowThumbnail]);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updatedImages = [...images, ...newImages];

    if (allowThumbnail) {
      const newThumbIdx =
        thumbnailIndex === null && updatedImages.length > 0 ? 0 : thumbnailIndex;
      setThumbnailIndex(newThumbIdx);
      onImagesChange?.(updatedImages, newThumbIdx ?? 0);
    } else {
      onImagesChange?.(updatedImages);
    }
  };

  const handleThumbnailSelect = (index) => {
    if (!allowThumbnail) return;
    setThumbnailIndex(index);
    onImagesChange?.(images, index);
  };

  const handleRemove = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);

    if (allowThumbnail) {
      let newThumbIdx = thumbnailIndex;

      if (updatedImages.length === 0) newThumbIdx = null;
      else if (index === thumbnailIndex) newThumbIdx = 0;
      else if (index < thumbnailIndex) newThumbIdx = thumbnailIndex - 1;

      setThumbnailIndex(newThumbIdx);
      onImagesChange?.(updatedImages, newThumbIdx ?? 0);
    } else {
      onImagesChange?.(updatedImages);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 bg-[#068F64] rounded-full hover:bg-white hover:border-black hover:text-black hover:border-1 text-white"
      >
        <Upload className="w-4 h-4" />
        Upload Image
      </Button>

      {showPreview && images.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition group ${
                allowThumbnail && thumbnailIndex === idx
                  ? "border-[#23C491] border-3"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ width: 85, height: 85 }}
              onClick={() => handleThumbnailSelect(idx)}
            >
              <img src={img.url} alt={`upload-${idx}`} className="w-full h-full object-cover" />

              {allowThumbnail && thumbnailIndex === idx && (
                <div className="absolute top-0 left-0 bg-[#23C491] text-white text-xs px-1 rounded-br-md">
                  Thumbnail
                </div>
              )}

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

export function ImageDropBox({ images = [], onImagesChange }) {
  const fileInputRef = useRef(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImgs = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    onImagesChange([...images, ...newImgs]);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );

    if (!dropped.length) return;

    const newImgs = dropped.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    onImagesChange([...images, ...newImgs]);
  };

  const preventDefaults = (e) => e.preventDefault();

  const handlePaste = useCallback(
    (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imgs = items
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile());

      if (!imgs.length) return;

      const newImgs = imgs.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      onImagesChange([...images, ...newImgs]);
    },
    [images, onImagesChange]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drop zone */}
      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={preventDefaults}
        onDragEnter={preventDefaults}
        className={`w-full border-2 border-dashed border-gray-400 hover:border-black transition rounded-xl p-4 cursor-pointer flex flex-col gap-3 ${
          images.length === 0 ? "min-h-[180px] justify-center" : ""
        }`}
      >
        {/* Message */}
        {images.length === 0 && (
          <p className="text-center text-gray-600 select-none">
            {/*<strong>Click</strong> to choose images <br />*/}
            {/*or <strong>drag & drop</strong> them here <br />*/}
            {/*or <strong>paste</strong> from clipboard (Ctrl + V)*/}
              Click to choose images <br/> or drag & drop them here <br/> or paste from clipboard
          </p>
        )}

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-lg border overflow-hidden"
              >
                <img
                  src={img.url}
                  className="w-full h-full object-cover"
                  alt="preview"
                />

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(i);
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}