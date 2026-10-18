import { getRecipeBundle } from "@/lib/content/load";

// Required to prerender this route in a static export.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getRecipeBundle());
}
