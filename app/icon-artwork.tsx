// Placeholder app icon shared by app/icon.tsx and app/apple-icon.tsx.
// Full-bleed background with the glyph inside the central 80% so it survives
// maskable cropping on Android and Apple's rounded-corner mask.
export function IconArtwork({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#171717",
        color: "#ffffff",
        fontSize: size * 0.5,
        fontWeight: 700,
      }}
    >
      M
    </div>
  );
}
