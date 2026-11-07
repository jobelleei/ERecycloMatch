
export const API_URL = "https://emcee-fence-squatted.ngrok-free.dev/admin_syde";

// YOLO scanner on AWS EC2 (Sydney)
export const YOLO_URL = "https://52-63-27-183.sslip.io"; // Elastic IP: stays the same after Stop/Start

// Backup: laptop server via ngrok (run start-server.bat first)
// export const YOLO_URL = "https://emcee-fence-squatted.ngrok-free.dev/yolo";

export const NEARBY_NOTIFICATION_RADIUS_KM = 5;

//map: MapTiler key for the SATELLITE view (newer, sharper imagery than
// Esri's 2018 photos of Bacolod). The street map stays Esri. If MapTiler
// fails, the satellite view falls back to Esri automatically.
export const MAPTILER_KEY = "Jn7QWRONTRtsSqcebMXW";

//url for the email verification page, which is a static page hosted on Netlify. This is used in the Supabase auth flow to redirect users after they verify their email.
export const EMAIL_VERIFIED_URL = "https://erecyclomatch-verified.netlify.app";


