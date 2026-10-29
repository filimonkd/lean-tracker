import { ImageResponse } from "next/og";

// Home-screen icon. iOS rounds the corners itself, so this is a full-bleed square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="16" y="12" width="16" height="74" rx="8" fill="#F4F4F7"/>
  <rect x="16" y="70" width="70" height="16" rx="8" fill="#F4F4F7"/>
  <polyline points="42,24 54,42 63,36 80,56" fill="none" stroke="#4FD992" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="80" cy="56" r="7.5" fill="#4FD992" stroke="#111114" stroke-width="3"/>
</svg>`;

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111114" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={src} width={128} height={128} alt="" />
      </div>
    ),
    size,
  );
}
