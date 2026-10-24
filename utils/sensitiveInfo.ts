// Detects personal or payment details in a chat message so the app can warn
// the sender before the message goes out.

const PHONE_PATTERNS = [
  // PH mobile: 09171234567, 0917 123 4567, +63 917-123-4567, 639171234567
  /(\+?63|0)\s*-?\s*9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/,
  // PH landline with area code: (034) 123-4567, 034-123-4567
  /\(?0\d{1,3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
];

// Number-like runs (digits with spaces, dots or dashes between them)
const NUMBER_RUN_PATTERN = /\+?\d[\d\s.-]*\d/g;

// Other phone numbers, e.g. international ones: any run with 10-15 digits.
// Counting digits keeps dates (2026-10-24) and prices (1500.00) from matching.
const hasLongDigitRun = (text: string) =>
  (text.match(NUMBER_RUN_PATTERN) || []).some((run) => {
    const digitCount = run.replace(/\D/g, "").length;
    return digitCount >= 10 && digitCount <= 15;
  });

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

// 13-19 digits, optionally grouped with spaces or dashes
const CARD_CANDIDATE_PATTERN = /\b(?:\d[ -]?){12,18}\d\b/g;

const PAYMENT_KEYWORDS =
  /\b(gcash|paymaya|maya\s*(number|no\.?|account)|bank\s*account|account\s*(number|no\.?|#)|acct\.?\s*(no\.?|#)|card\s*(number|no\.?)|credit\s*card|debit\s*card|cvv|cvc|expiry\s*date|expiration\s*date|otp|pin\s*(code|number|no\.?)|password|passcode)\b/i;

const ID_KEYWORDS =
  /\b(tin|sss|gsis|philhealth|pag-?ibig|passport|driver'?s?\s*licen[cs]e|national\s*id|philsys|umid|voter'?s?\s*id)\b/i;

const ADDRESS_KEYWORDS =
  /\b(street|st\.|avenue|ave\.|road|rd\.|brgy\.?|barangay|purok|sitio|subdivision|subd\.?|village|(blk\.?|block|lot|phase|zone|unit)\s*\d+|house\s*(no\.?|number))/i;

// Luhn checksum, used to tell real card numbers apart from other long numbers
const passesLuhn = (digits: string) => {
  let sum = 0;
  let double = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);

    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
};

const hasCardNumber = (text: string) => {
  const candidates = text.match(CARD_CANDIDATE_PATTERN) || [];

  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
  });
};

// Returns a readable label for each kind of sensitive detail found, e.g.
// ["a phone number", "payment details"]. Empty when nothing was found.
export const detectSensitiveInfo = (message: string): string[] => {
  const text = String(message || "");
  const found: string[] = [];

  if (!text.trim()) return found;

  const cardFound = hasCardNumber(text);

  if (cardFound) {
    found.push("a card number");
  }

  // Skip the phone check when the only long number is the card number
  const textWithoutCards = cardFound
    ? text.replace(CARD_CANDIDATE_PATTERN, " ")
    : text;

  if (
    PHONE_PATTERNS.some((pattern) => pattern.test(textWithoutCards)) ||
    hasLongDigitRun(textWithoutCards)
  ) {
    found.push("a phone number");
  }

  if (EMAIL_PATTERN.test(text)) {
    found.push("an email address");
  }

  if (PAYMENT_KEYWORDS.test(text)) {
    found.push("payment or account details");
  }

  if (ID_KEYWORDS.test(text)) {
    found.push("ID details");
  }

  // Address words alone are common ("pick it up at the village"), so only
  // flag them together with a number such as a house or lot number.
  if (ADDRESS_KEYWORDS.test(text) && /\d/.test(text)) {
    found.push("a home address");
  }

  return found;
};

export const formatSensitiveInfoList = (items: string[]) => {
  if (items.length <= 1) return items[0] || "";

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};
