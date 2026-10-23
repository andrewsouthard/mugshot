// The Mugshot mark, kept inside the maskable safe zone.
// ImageResponse has no stylesheet, so these match the Café tokens in globals.css.
export function IconArtwork({ size }: { size: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fbfbf9",
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32">
        <path d="M4 7h19v14a6 6 0 0 1-6 6h-7a6 6 0 0 1-6-6z" fill="#111111" />
        <path
          d="M23 11h2.5a4.5 4.5 0 0 1 0 9H23"
          fill="none"
          stroke="#111111"
          strokeWidth="3"
        />
        <rect x="6.5" y="9.5" width="14" height="3" rx="1" fill="#ee6c7e" />
      </svg>
    </div>
  );
}
