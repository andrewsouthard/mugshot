import { ImageResponse } from "next/og";
import { getRecipe, getRecipeBundle } from "@/lib/content/load";
import { SITE_NAME } from "@/lib/site";

export const alt = "Recipe card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getRecipeBundle().recipes.map(({ id }) => ({ id }));
}

// Placeholder share card until the design pass: name and description on the
// app icon's colors.
export default async function OpenGraphImage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) throw new Error(`No recipe "${id}"`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#171717",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.6 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 96, fontWeight: 700 }}>{recipe.name}</div>
          <div style={{ fontSize: 40, opacity: 0.8, lineHeight: 1.3 }}>
            {recipe.description}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
