import { notFound } from "next/navigation";
import { IngestTester } from "./ingest-tester";

export const metadata = { title: "Dev: ingest" };

export default function DevIngestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="mb-6 font-display text-3xl">Ingest tester</h1>
      <IngestTester />
    </main>
  );
}
