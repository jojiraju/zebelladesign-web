import { revalidatePath, revalidateTag } from "next/cache";
import { HttpError, jsonError, jsonOk, preflight, requireUser } from "@/lib/server/http";
import { hasPermission } from "@/lib/auth/permissions";
import { CATALOG_TAG, CONTENT_TAG } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

/** The CMS calls this after saving so storefront caches refresh immediately instead of waiting out the 60s window. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    if (!hasPermission(user.role, "content:write") && !hasPermission(user.role, "catalog:write"))
      throw new HttpError(403, "You do not have access to this action.", "FORBIDDEN");
    revalidateTag(CATALOG_TAG, "max");
    revalidateTag(CONTENT_TAG, "max");
    revalidatePath("/", "layout");
    return jsonOk(req, { revalidated: true });
  } catch (e) {
    return jsonError(req, e);
  }
}
