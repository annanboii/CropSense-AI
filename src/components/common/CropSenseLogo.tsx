import React from "react";

export interface CropSenseLogoProps {
  /** Size in pixels or preset key */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero" | number;
  className?: string;
  imgClassName?: string;
  alt?: string;
  /** Kept for backwards compatibility; exact official logo is always rendered */
  variant?: "icon" | "full" | "horizontal";
  theme?: "dark" | "light" | "auto" | "emerald";
  showText?: boolean;
}

export const CropSenseLogo: React.FC<CropSenseLogoProps> = ({
  size = "md",
  className = "",
  imgClassName = "",
  alt = "CropSense AI",
}) => {
  // Resolve dimension in pixels
  let dimension = 48;
  if (typeof size === "number") {
    dimension = size;
  } else {
    switch (size) {
      case "xs":
        dimension = 28;
        break;
      case "sm":
        dimension = 36;
        break;
      case "md":
        dimension = 48;
        break;
      case "lg":
        dimension = 72;
        break;
      case "xl":
        dimension = 112;
        break;
      case "hero":
        dimension = 160;
        break;
    }
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none aspect-square bg-white ${className}`}
      style={{ width: `${dimension}px`, height: `${dimension}px` }}
    >
      <img
        src="/cropsense-logo.png"
        alt={alt}
        width={dimension}
        height={dimension}
        className={`w-full h-full object-contain aspect-square select-none ${imgClassName}`}
        loading="eager"
        decoding="sync"
      />
    </div>
  );
};

