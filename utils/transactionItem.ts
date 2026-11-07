import { supabase } from "./supabase";

/*
 * The user's item that a transaction is about.
 *
 * - Listed-item chats: the conversation's item_id is the item.
 * - Facility-posting chats ("facility_posting_..."): item_id holds the
 *   POSTING's id, not an item, so using it would change an unrelated item.
 *   The real item is the one the user offered, found by the photo saved on
 *   the conversation (item_photo = that item's item_image). If the user took
 *   a new photo instead of picking a listed item, there is no item: null.
 *
 * Used when accepting, declining, cancelling or finishing, so the right item
 * is updated, and a finished item leaves the active listings.
 */
export async function getTransactionItemId(
  conversation: any,
): Promise<string | null> {
  if (!conversation) return null;

  const isPostingChat = String(conversation.id || "").startsWith(
    "facility_posting_",
  );

  if (!isPostingChat) {
    return conversation.item_id ? String(conversation.item_id) : null;
  }

  const photo = String(conversation.item_photo || "").trim();
  if (!photo || !conversation.user_id) return null;

  const { data, error } = await supabase
    .from("items")
    .select("id")
    .eq("user_id", String(conversation.user_id))
    .eq("item_image", photo)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.log("FIND OFFERED ITEM ERROR:", error);
    return null;
  }

  return data?.id ? String(data.id) : null;
}

/*
 * Facility postings ("Looking for: Keyboard") shown on a facility's profile
 * are only the active ones: not finished, completed or deleted.
 */
export const isActivePosting = (posting: any) => {
  if (!posting || posting.deleted_at) return false;

  const status = String(posting.status || "").trim().toLowerCase();
  const postingStatus = String(posting.posting_status || "").trim().toLowerCase();

  if (["finished", "completed", "recycled"].includes(status)) return false;
  if (postingStatus === "deleted") return false;

  return true;
};

/*
 * When a facility-posting transaction finishes, mark the posting Finished too,
 * so it leaves the facility's active profile view. (For posting chats the
 * conversation's item_id holds the posting's id.)
 */
export async function finishPostingForConversation(
  conversation: any,
  finishedAt: string,
) {
  if (!String(conversation?.id || "").startsWith("facility_posting_")) return;

  const postingId = String(conversation?.item_id || "").trim();
  if (!postingId) return;

  const { error } = await supabase
    .from("facility_postings")
    .update({ status: "Finished", finished_at: finishedAt, updated_at: finishedAt })
    .eq("id", postingId);

  if (error) console.log("FINISH POSTING ERROR:", error);
}
