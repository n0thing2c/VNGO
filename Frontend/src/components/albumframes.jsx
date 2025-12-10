import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const AlbumPhotoFrame = ({ images = [] }) => {
  if (!images.length) return null;

  return (
    <div className="w-full lg:max-w-xl md:max-w-lg sm:max-w-md max-w-xl rounded-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
        {images.map((img, idx) => (
          <Dialog key={idx}>
            <DialogTrigger asChild>
              <div className="overflow-hidden shadow-md aspect-[3/2] cursor-pointer">
                <img
                  src={img}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </DialogTrigger>

            <DialogContent
              className="sm:max-w-[600px] p-0 bg-transparent border-none shadow-none flex justify-center items-center"
            >
              <div className="sr-only">
                <DialogTitle>Photo {idx + 1}</DialogTitle>
                <DialogDescription>Full size preview photo</DialogDescription>
              </div>

              <img
                src={img}
                alt={`Photo ${idx + 1}`}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default AlbumPhotoFrame;
