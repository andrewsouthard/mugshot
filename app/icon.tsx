import { ImageResponse } from "next/og";
import { IconArtwork } from "./icon-artwork";

// Required to prerender this metadata route in a static export.
export const dynamic = "force-static";

const SIZES = [192, 512];

export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(<IconArtwork size={size} />, {
    width: size,
    height: size,
  });
}
