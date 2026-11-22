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
