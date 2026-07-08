require("dotenv").config();

const sendEmail = require("./sendEmail");

const DAY = 1000 * 60 * 60 * 24;

function getInactiveDays(lastActiveAt) {
  return Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / DAY);
}

function getDeletionDeadline(lastActiveAt) {
  const deadline = new Date(lastActiveAt);
  deadline.setDate(deadline.getDate() + 30);

  return deadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

const { createClient } = require("@supabase/supabase-js");
const sendPushNotification = require("./sendPushNotification");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInactiveUsers() {
  console.log("Checking inactive users...");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      email,
      role,
      status,
      last_active_at,
      last_inactivity_notification,
      expo_push_token
    `)
    .eq("status", "approved");

  if (error) {
    console.error(error);
    return;
  }

  for (const profile of profiles) {
  if (!profile.last_active_at) {
  console.log(`${profile.name} has no last_active_at. Skipping.`);
  continue;
}

const inactiveDays = getInactiveDays(profile.last_active_at);

console.log(
  `${profile.name} has been inactive for ${inactiveDays} day(s).`
);

console.log(
  `${profile.name}: inactiveDays=${inactiveDays}, lastNotification=${profile.last_inactivity_notification}`
);

if (
  [10, 20, 30].includes(inactiveDays) &&
  profile.last_inactivity_notification !== inactiveDays
) {
   const deadline = getDeletionDeadline(profile.last_active_at);

const title = "Account Inactivity Reminder";

const message = `We noticed that you haven't opened your ERecycloMatch account for ${inactiveDays} days.

Please open your account before ${deadline} to avoid automatic deletion.`;

const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    profile_id: profile.id,
    title,
    message,
    type: "inactivity",
  });

if (notificationError) {
  console.error(notificationError);
  continue;
}

console.log(`Notification created for ${profile.name}`);
await sendPushNotification(
  profile.expo_push_token,
  title,
  message
);

console.log("Recipient:", profile.email);

console.log("Before sendEmail");

await sendEmail(
  profile.email,
  title,
  `
    <h2>Account Inactivity Reminder</h2>

    <p>Hello <strong>${profile.name}</strong>,</p>

    <p>We noticed that your ERecycloMatch account has been inactive for <strong>${inactiveDays} days</strong>.</p>

    <p>Please open your account before <strong>${deadline}</strong> to avoid automatic deletion.</p>

    <hr>

    <p><strong>ERecycloMatch</strong></p>
  `
);

console.log("After sendEmail");

const { error: updateError } = await supabase
  .from("profiles")
  .update({
    last_inactivity_notification: inactiveDays,
  })
  .eq("id", profile.id);

if (updateError) {
  console.error(updateError);
}

  } // End reminder if

  if (inactiveDays > 30 && profile.status === "approved") {
  const deleteTitle = "Account Deleted";

  const deleteMessage =
    "Your ERecycloMatch account has been automatically deleted because it has been inactive for more than 30 days.";

  // Update profile
  const { error: deleteError } = await supabase
    .from("profiles")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (deleteError) {
    console.error(deleteError);
    continue;
  }

  console.log(`${profile.name} has been deleted.`);

  // Save notification
  await supabase.from("notifications").insert({
    profile_id: profile.id,
    title: deleteTitle,
    message: deleteMessage,
    type: "account_deleted",
  });

  // Push notification
  await sendPushNotification(
    profile.expo_push_token,
    deleteTitle,
    deleteMessage
  );

  // Email
  await sendEmail(
    profile.email,
    deleteTitle,
    `
      <p>Hello <strong>${profile.name}</strong>,</p>

      <p>Your account has been automatically deleted because it remained inactive for more than <strong>30 days</strong>.</p>

      <p>If you would like to continue using ERecycloMatch, you may create a new account.</p>
    `
  );
}

} // End for loop

} // End function

checkInactiveUsers();

console.log(
  "Using service role:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log(
  "First 20 chars:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)
);
