import QRCode from "qrcode";

/**
 * Generate a real, scannable PNG data URL for a given URL string.
 * Aditi-owned helper specified in section 9.1 and 9.5/9.6.
 */
export async function makeQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
