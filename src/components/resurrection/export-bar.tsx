"use client";

import { copyText, downloadBlob, useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Toast } from "../ui/toast";

export function ExportBar({ markdown, fileName }: { markdown: string; fileName: string }) {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="ghost" onClick={async () => toast.show((await copyText(markdown)) ? "Plan copied as Markdown" : "Couldn't copy. Try the download.")}>
        Copy as Markdown
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `${fileName}-resurrection.md`);
          toast.show("Downloaded");
        }}
      >
        Download .md
      </Button>
      <Toast message={toast.message} />
    </div>
  );
}
