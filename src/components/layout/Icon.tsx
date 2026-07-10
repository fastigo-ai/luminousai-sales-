import type { CSSProperties } from "react";

export function Icon({
  name,
  className = "",
  filled = false,
  style,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}) {
  const fillStyle: CSSProperties = filled
    ? { fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' }
    : {};
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ ...fillStyle, ...style }}>
      {name}
    </span>
  );
}
