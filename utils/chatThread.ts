import { supabase } from "./supabase";


export type ThreadTransaction = {
  id: string;
  index: number;
  itemName: string;
  imagePath: string;
  createdAt: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const getThreadDividerLabel = (t: ThreadTransaction) => {
  const d = new Date(t.createdAt);
  const date = isNaN(d.getTime()) ? "" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return [t.index === 0 ? "Request" : "New request", t.itemName || "Item", date]
    .filter(Boolean)
    .join(" · ");
};

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
