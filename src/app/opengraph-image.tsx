import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Command Inbox — keyboard-first Gmail and Calendar command center";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(145deg, #f5f5f7 0%, #ffffff 55%, #e8f0ff 100%)",
          color: "#111111",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#007aff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Command Inbox</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Triage. Schedule. Ship.
          </div>
          <div style={{ fontSize: 28, color: "#555555", lineHeight: 1.4 }}>
            Keyboard-first Gmail + Calendar with AI lanes, inline meeting booking, and Corsair MCP agent workflows.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 22, color: "#666666" }}>
          <span>j/k triage</span>
          <span>·</span>
          <span>M schedule</span>
          <span>·</span>
          <span>⌘K palette</span>
          <span>·</span>
          <span>Agent approvals</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
