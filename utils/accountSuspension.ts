import { Alert } from "react-native";
import { supabase } from "./supabase";


export const SUSPENDED_TITLE = "Account Under Review";

export const SUSPENDED_SELF_MESSAGE =
  "Your account was reported and is suspended while an admin reviews it. You can still scan items, but you cannot list items or make transactions until an admin reactivates your account.";

export const SUSPENDED_OTHER_MESSAGE =
  "This account is suspended while an admin reviews a report, so you cannot make a transaction with it right now.";

export const isProfileSuspended = async (
  profileId: string | number | null | undefined,
): Promise<boolean> => {
  if (profileId === null || profileId === undefined || profileId === "") {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("suspended")
    .eq("id", String(profileId))
    .maybeSingle();

  if (error) {
    console.log("SUSPENSION CHECK ERROR:", error);
    return false;
  }

  return Boolean(data?.suspended);
};

export const alertIfSelfSuspended = async (
  profileId: string | number | null | undefined,
): Promise<boolean> => {
  if (!(await isProfileSuspended(profileId))) return false;
  Alert.alert(SUSPENDED_TITLE, SUSPENDED_SELF_MESSAGE);
  return true;
};

export const alertIfTransactionBlocked = async (
  selfId: string | number | null | undefined,
  otherId: string | number | null | undefined,
): Promise<boolean> => {
  if (await alertIfSelfSuspended(selfId)) return true;

  if (await isProfileSuspended(otherId)) {
    Alert.alert(SUSPENDED_TITLE, SUSPENDED_OTHER_MESSAGE);
    return true;
  }

  return false;
};

export const isSuspensionError = (error: any): boolean =>
  error?.hint === "ACCOUNT_SUSPENDED" ||
  /suspended while an admin reviews/i.test(String(error?.message || ""));
