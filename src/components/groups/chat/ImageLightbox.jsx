import { useEffect } from "react";
import { Download, X } from "lucide-react";

export default function ImageLightbox({ image, onClose }) {
  useEffect(() => {
    if (!image) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={image.name}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm truncate">{image.name}</p>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <a
            href={image.url}
            download={image.name}
            aria-label="Download image"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <Download className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <img
          src={image.url}
          alt={image.name}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain"
        />
      </div>
    </div>
  );
}
