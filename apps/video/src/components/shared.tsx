import type React from "react";

export const GridBackground: React.FC<{ opacity?: number }> = ({
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "80px 80px",
    }}
  />
);

export const DecorativeCorners: React.FC<{
  progress: number;
  padding?: number;
  size?: number;
}> = ({ progress, padding = 40, size: cornerSize = 60 }) => {
  const s = cornerSize * Math.min(progress, 1);
  const borderColor = `rgba(255,255,255,${0.2 * Math.min(progress, 1)})`;
  const border = `1px solid ${borderColor}`;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: padding,
          left: padding,
          width: s,
          height: s,
          borderTop: border,
          borderLeft: border,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: padding,
          right: padding,
          width: s,
          height: s,
          borderTop: border,
          borderRight: border,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: padding,
          left: padding,
          width: s,
          height: s,
          borderBottom: border,
          borderLeft: border,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: padding,
          right: padding,
          width: s,
          height: s,
          borderBottom: border,
          borderRight: border,
        }}
      />
    </>
  );
};

export const HorizontalLine: React.FC<{
  progress: number;
  y?: string;
  color?: string;
}> = ({ progress, y = "50%", color = "rgba(255,255,255,0.15)" }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: "50%",
      width: `${Math.min(progress, 1) * 80}%`,
      height: 1,
      backgroundColor: color,
      transform: "translateX(-50%)",
    }}
  />
);
