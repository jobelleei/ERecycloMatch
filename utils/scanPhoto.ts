// Holds the last scanned photo so it isn't altered by route param encoding.
// The base64 copy is used for display, since Expo Go's cache paths contain
// encoded characters that can break loading from the file URI.
let lastScanPhotoUri = "";
let lastScanPhotoBase64 = "";

export const setScanPhoto = (uri: string, base64?: string) => {
  lastScanPhotoUri = uri;
  lastScanPhotoBase64 = base64 || "";
};

export const getScanPhotoUri = () => lastScanPhotoUri;

export const getScanPhotoDisplayUri = () =>
  lastScanPhotoBase64
    ? `data:image/jpeg;base64,${lastScanPhotoBase64}`
    : lastScanPhotoUri;
