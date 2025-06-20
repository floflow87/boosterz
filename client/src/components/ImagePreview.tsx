import { useState } from "react";
import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImagePreview({ src, alt, className = "" }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={() => setIsFullscreen(false)}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={() => setIsFullscreen(true)}
    />
  );
}