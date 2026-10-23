import { ImageResponse } from "next/og";
import { getRecipe, getRecipeBundle } from "@/lib/content/load";
import { SITE_NAME } from "@/lib/site";

export const alt = "Recipe card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getRecipeBundle().recipes.map(({ id }) => ({ id }));
}

// ImageResponse uses fixed Café colors because it has no page stylesheet.
export default async function OpenGraphImage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) throw new Error(`No recipe "${id}"`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#fbfbf9",
        color: "#111111",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 32,
          fontWeight: 700,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 32 32">
          <path d="M4 7h19v14a6 6 0 0 1-6 6h-7a6 6 0 0 1-6-6z" fill="#111111" />
          <path
            d="M23 11h2.5a4.5 4.5 0 0 1 0 9H23"
            fill="none"
            stroke="#111111"
            strokeWidth="3"
          />
          <rect x="6.5" y="9.5" width="14" height="3" rx="1" fill="#ee6c7e" />
        </svg>
        {SITE_NAME}
        <div style={{ marginLeft: "auto", fontSize: 24, color: "#c23f55" }}>
          {recipe.type === "coffee" ? "FROM THE CAFÉ" : "FROM THE BAR"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -4 }}>
          {recipe.name}
        </div>
        <div style={{ fontSize: 36, color: "#5c5c5a", lineHeight: 1.3 }}>
          {recipe.description}
        </div>
      </div>
    </div>,
    size,
  );
}
