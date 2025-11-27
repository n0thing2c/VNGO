import React from "react";

const AlbumPhotoFrame = ({ images = [] }) => {
  if (!images.length) return null;

  return (
    <div className="w-full rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="overflow-hidden shadow-md aspect-[3/2]"
          >
            <img
              src={img}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumPhotoFrame;
