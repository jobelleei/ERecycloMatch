import { supabase } from "./supabase";

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

export const isActivePosting = (posting: any) => {
  if (!posting || posting.deleted_at) return false;

  const status = String(posting.status || "").trim().toLowerCase();
  const postingStatus = String(posting.posting_status || "").trim().toLowerCase();

  if (["finished", "completed", "recycled"].includes(status)) return false;
  if (postingStatus === "deleted") return false;

  return true;
};

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
