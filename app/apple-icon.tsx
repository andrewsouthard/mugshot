import { ImageResponse } from "next/og";
import { IconArtwork } from "./icon-artwork";

// Required to prerender this metadata route in a static export.
export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconArtwork size={size.width} />, size);
}
