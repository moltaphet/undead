import { connection } from "next/server";
import { CERTIFICATE_FIXTURES as FIXTURES } from "@/test/certificate-fixtures";
import { certificateResponse, fallbackResponse } from "@/lib/certificate/render";


/** Dev-only visual fixtures: /dev/certificate?fixture=short|long|zero|fallback&format=landscape|square */
export async function GET(request: Request) {
  await connection();
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const params = new URL(request.url).searchParams;
  const format = params.get("format") === "square" ? "square" : "landscape";
  const fixture = params.get("fixture") ?? "short";
  if (fixture === "fallback") return fallbackResponse(format);
  return certificateResponse(FIXTURES[fixture] ?? FIXTURES.short, format);
}
