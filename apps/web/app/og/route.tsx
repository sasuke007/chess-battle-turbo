import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const typeLabels: Record<string, string> = {
  legend: "Chess Legend",
  opening: "Chess Opening",
  blog: "Blog",
  profile: "Player Profile",
};

const typeIcons: Record<string, string> = {
  legend: "♚",
  opening: "♞",
  blog: "✦",
  profile: "♟",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = (searchParams.get("title") || "ReplayChess").slice(0, 200);
  const subtitle = (searchParams.get("subtitle") || "").slice(0, 300);
  const type = searchParams.get("type") || "";

  const label = typeLabels[type] || "";
  const icon = typeIcons[type] || "♟";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "linear-gradient(90deg, white 1px, transparent 1px), linear-gradient(white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top section: label */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {label && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 16px",
                fontSize: "16px",
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontSize: "20px" }}>{icon}</span>
              {label}
            </div>
          )}
        </div>

        {/* Middle: title + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: title.length > 40 ? 48 : 64,
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.4)",
                maxWidth: "800px",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
            >
              ♟
            </div>
            <span
              style={{
                fontSize: "24px",
                color: "#ffffff",
                fontWeight: 400,
              }}
            >
              ReplayChess
            </span>
          </div>
          <span
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.1em",
            }}
          >
            playchess.tech
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
