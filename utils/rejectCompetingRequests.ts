import { supabase } from "./supabase";

const PENDING_STATUSES = ["match_pending", "pending", "request_pending"];
const POSTING_PREFIX = "facility_posting_";

export async function rejectCompetingRequests(acceptedConversation: any) {
  try {
    const acceptedId = String(acceptedConversation?.id || "");
    const itemId = String(acceptedConversation?.item_id || "");

    if (!acceptedId || !itemId) return;

    const isPosting = acceptedId.startsWith(POSTING_PREFIX);

    let query = supabase
      .from("conversations")
      .select("id, user_id, facility_id, status, request_status")
      .eq("item_id", itemId)
      .neq("id", acceptedId);

    if (isPosting) {
      query = query
        .eq("facility_id", String(acceptedConversation.facility_id || ""))
        .like("id", `${POSTING_PREFIX}%`);
    } else {
      query = query
        .eq("user_id", String(acceptedConversation.user_id || ""))
        .not("id", "like", `${POSTING_PREFIX}%`);
    }

    const { data: candidates, error: findError } = await query;

    if (findError) {
      console.log("FIND COMPETING REQUESTS ERROR:", findError);
      return;
    }

    const competing = (candidates || []).filter(
      (conversation: any) =>
        PENDING_STATUSES.includes(String(conversation.status || "")) ||
        String(conversation.request_status || "") === "pending",
    );

    if (competing.length === 0) return;

    const competingIds = competing.map((conversation: any) =>
      String(conversation.id),
    );
    const now = new Date().toISOString();
    const reason = isPosting
      ? "Match rejected. This posting has been matched with another user."
      : "Match rejected. This item has been matched with another facility.";

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        status: "rejected",
        request_status: "rejected",
        last_message: reason,
        is_read: false,
        updated_at: now,
      })
      .in("id", competingIds);

    if (updateError) {
      console.log("REJECT COMPETING REQUESTS ERROR:", updateError);
      return;
    }

    const { error: messageError } = await supabase.from("messages").insert(
      competingIds.map((conversationId: string) => ({
        conversation_id: conversationId,
        sender_id: null,
        sender_name: "System",
        sender_role: "system",
        sender_type: "system",
        receiver_id: null,
        type: "system",
        message: reason,
        created_at: now,
      })),
    );

    if (messageError) {
      console.log("COMPETING REQUEST MESSAGE ERROR:", messageError);
    }

    const notifications = competing
      .map((conversation: any) => {
        const profileId = Number(
          isPosting ? conversation.user_id : conversation.facility_id,
        );

        if (!Number.isFinite(profileId)) return null;

        return {
          profile_id: profileId,
          type: "match_update",
          title: "Match Update",
          message: reason,
          is_read: false,
          data: {
            conversation_id: String(conversation.id),
            facility_id: Number(conversation.facility_id) || null,
          },
          created_at: now,
        };
      })
      .filter((notification) => notification !== null);

    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.log("COMPETING REQUEST NOTIFICATION ERROR:", notificationError);
      }
    }
  } catch (error) {
    console.log("REJECT COMPETING REQUESTS ERROR:", error);
  }
}
