import { headers } from "next/headers";
import { renderRepoCertificate } from "@/lib/certificate/render";
import { CERTIFICATE_SIZES } from "@/lib/certificate/data";
import { clientIp } from "@/lib/http";

export const alt = "Undead death certificate";
export const size = CERTIFICATE_SIZES.landscape;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  return renderRepoCertificate(owner, repo, "landscape", clientIp(await headers()));
}
