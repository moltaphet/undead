"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function IngestTester() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const started = performance.now();
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await res.text();
      const ms = Math.round(performance.now() - started);
      setResult(`HTTP ${res.status} in ${ms} ms (${body.length} chars)\n\n${JSON.stringify(JSON.parse(body), null, 2)}`);
    } catch (err) {
      setResult(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="dev-url" className="sr-only">
          Repository URL
        </label>
        <Input id="dev-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="owner/repo" />
        <Button type="submit" loading={busy} size="lg">
          Ingest
        </Button>
      </form>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs whitespace-pre-wrap">
        {result || "Results appear here."}
      </pre>
    </div>
  );
}
