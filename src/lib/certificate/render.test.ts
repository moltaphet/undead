import { describe, expect, it, vi } from "vitest";
import { CERTIFICATE_FIXTURES } from "@/test/certificate-fixtures";
import { certificateResponse, fallbackResponse } from "./render";

vi.mock("../report", () => ({ loadReport: vi.fn() }));

const PNG = [0x89, 0x50, 0x4e, 0x47];

async function png(res: Response): Promise<Uint8Array> {
  return new Uint8Array(await res.arrayBuffer());
}

describe("certificate rendering", () => {
  for (const [name, data] of Object.entries(CERTIFICATE_FIXTURES)) {
    for (const format of ["landscape", "square"] as const) {
      it(`renders the ${name} fixture as a ${format} PNG`, async () => {
        const bytes = await png(certificateResponse(data, format));
        expect([...bytes.slice(0, 4)]).toEqual(PNG);
      }, 20_000);
    }
  }

  it("renders the fallback card", async () => {
    expect([...(await png(fallbackResponse("square"))).slice(0, 4)]).toEqual(PNG);
  }, 20_000);
});
