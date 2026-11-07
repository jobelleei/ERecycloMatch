import { supabase } from "./supabase";

/*
 * Shared chat helpers: editing a sent message, and deciding which bubbles
 * show their time (only the last bubble of a same-minute group does).
 */

const isSystemMessage = (m: any) =>
  !m ||
  m.type === "system" ||
  m.sender_type === "system" ||
  m.sender_id === null ||
  String(m.message_type || "").toLowerCase() === "match_request";

// Only the sender's own plain text messages can be edited
export const isEditableMessage = (m: any, myId: string | number) => {
  if (isSystemMessage(m)) return false;
  if (String(m.sender_id) !== String(myId)) return false;

  const type = String(m.message_type || m.type || "text").toLowerCase();
  if (type !== "text") return false;

  const text = String(m.message || "").trim().toLowerCase();
  if (!text || text.startsWith("http")) return false;

  return true;
};

const sameMinute = (a?: string, b?: string) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return (
    Math.floor(da.getTime() / 60000) === Math.floor(db.getTime() / 60000)
  );
};

/*
 * True when this message should show its time under the bubble: it is the
 * last message, or the next one is from someone else, a system message, or
 * sent in a different minute. Otherwise the time is hidden (swipe to see it).
 */
export const shouldShowTime = (messages: any[], index: number) => {
  const current = messages[index];
  const next = messages[index + 1];
  if (!current || !next) return true;
  if (isSystemMessage(next)) return true;
  if (String(next.sender_id) !== String(current.sender_id)) return true;
  return !sameMinute(current.created_at, next.created_at);
};

/*
 * Saves a corrected message. Also records when it was edited (edited_at) if
 * the database has that column, and updates the conversation preview when
 * the edited message is the latest one.
 */
export async function saveEditedMessage(params: {
  messageId: string | number;
  newText: string;
  conversationId?: string;
  isLatestMessage?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const { messageId, newText, conversationId, isLatestMessage } = params;
  const editedAt = new Date().toISOString();

  let { error } = await supabase
    .from("messages")
    .update({ message: newText, edited_at: editedAt })
    .eq("id", messageId);

  // Database without the edited_at column: save the text only
  if (error && String((error as any).code) === "42703") {
    ({ error } = await supabase
      .from("messages")
      .update({ message: newText })
      .eq("id", messageId));
  }

  if (error) {
    console.log("EDIT MESSAGE ERROR:", error);
    return { ok: false, error: error.message };
  }

  if (conversationId && isLatestMessage) {
    await supabase
      .from("conversations")
      .update({ last_message: newText })
      .eq("id", conversationId);
  }

  return { ok: true };
}
