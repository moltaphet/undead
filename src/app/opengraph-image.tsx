import { fallbackResponse } from "@/lib/certificate/render";
import { CERTIFICATE_SIZES } from "@/lib/certificate/data";

export const alt = "Undead: your dead projects rise at midnight.";
export const size = CERTIFICATE_SIZES.landscape;
export const contentType = "image/png";

export default function Image() {
  return fallbackResponse("landscape", "Autopsies, death certificates and resurrections for abandoned GitHub repos.");
}
