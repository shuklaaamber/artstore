import { ImageResponse } from "next/og";

export const alt = "Canvas & Co. paintings and handmade art";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#8c3b27", color: "white" }}>
        <div style={{ fontSize: 28, opacity: 0.8, letterSpacing: 4 }}>CANVAS &amp; CO.</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 16 }}>Art made by hand, for your walls and shelves.</div>
      </div>
    ),
    size,
  );
}
