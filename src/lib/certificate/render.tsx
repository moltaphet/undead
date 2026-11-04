import "server-only";
import { ImageResponse } from "next/og";
import { SITE_URL } from "../config";
import { loadReport } from "../report";
import { CertificateCard, FallbackCard } from "./card";
import { CERTIFICATE_SIZES, toCertificateData, type CertificateData, type CertificateFormat } from "./data";
import { CERTIFICATE_FONTS } from "./fonts";

const CACHE_OK = "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400";
const CACHE_FALLBACK = "public, max-age=60, s-maxage=60";

export function certificateResponse(data: CertificateData, format: CertificateFormat): ImageResponse {
  return new ImageResponse(<CertificateCard data={data} format={format} />, {
    ...CERTIFICATE_SIZES[format],
    fonts: CERTIFICATE_FONTS,
    headers: { "Cache-Control": CACHE_OK },
  });
}

export function fallbackResponse(format: CertificateFormat, subtitle = "Paste an abandoned GitHub repo. Get an autopsy."): ImageResponse {
  return new ImageResponse(<FallbackCard format={format} domain={new URL(SITE_URL).host} subtitle={subtitle} />, {
    ...CERTIFICATE_SIZES[format],
    fonts: CERTIFICATE_FONTS,
    headers: { "Cache-Control": CACHE_FALLBACK },
  });
}

/** Renders a repo's certificate, generating the autopsy if needed. Any failure renders the branded fallback. */
export async function renderRepoCertificate(owner: string, repo: string, format: CertificateFormat, ip: string): Promise<ImageResponse> {
  try {
    const result = await loadReport(owner, repo, ip);
    if (!result.ok) return fallbackResponse(format);
    return certificateResponse(toCertificateData(result.report.dossier, result.report.autopsy, SITE_URL), format);
  } catch (err) {
    console.error("[certificate] render failed", err);
    return fallbackResponse(format);
  }
}
