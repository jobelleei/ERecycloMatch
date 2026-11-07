import { supabase } from "./supabase";

/*
 * One chat thread per user + facility pair.
 *
 * Every transaction (Laptop, then Keyboard, ...) still has its own
 * conversation row, so reports, recycling history, feedback and notifications
 * keep working per transaction. The chat screen loads all of a pair's
 * conversations and shows their messages as one thread, with a divider where
 * each new request starts. A different facility is a different pair, so it
 * gets its own thread.
 */

export type ThreadTransaction = {
  id: string;
  // 0 = the first request between this user and facility
  index: number;
  itemName: string;
  // Storage path or URL of the item photo ("" when there is none)
  imagePath: string;
  createdAt: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "Request · Laptop · Nov 3" for the first, "New request · Keyboard · Nov 4" after
export const getThreadDividerLabel = (t: ThreadTransaction) => {
  const d = new Date(t.createdAt);
  const date = isNaN(d.getTime()) ? "" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return [t.index === 0 ? "Request" : "New request", t.itemName || "Item", date]
    .filter(Boolean)
    .join(" · ");
};

// All transactions between this user and facility, oldest first
export async function loadThread(
  userId: string,
  facilityId: string,
): Promise<ThreadTransaction[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, item_id, item_name, item_photo, created_at")
    .eq("user_id", String(userId))
    .eq("facility_id", String(facilityId))
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.log("LOAD CHAT THREAD ERROR:", error);
    return [];
  }

  // Item photos for transactions that came from a user's listed item.
  // (Facility-posting transactions store their photo in item_photo.)
  const itemIds = data
    .filter((c: any) => !String(c.id).startsWith("facility_posting_"))
    .map((c: any) => Number(c.item_id))
    .filter((id: number) => Number.isFinite(id));

  const itemImages: Record<string, string> = {};

  if (itemIds.length > 0) {
    const { data: items } = await supabase
      .from("items")
      .select("id, item_image")
      .in("id", itemIds);

    (items || []).forEach((item: any) => {
      itemImages[String(item.id)] = String(item.item_image || "");
    });
  }

  return data.map((c: any, index: number) => ({
    id: String(c.id),
    index,
    itemName: String(c.item_name || ""),
    imagePath: String(
      c.item_photo ||
        (String(c.id).startsWith("facility_posting_")
          ? ""
          : itemImages[String(c.item_id)] || ""),
    ),
    createdAt: String(c.created_at || ""),
  }));
}
