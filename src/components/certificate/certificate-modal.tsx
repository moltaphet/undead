"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { copyText, downloadBlob, useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/cn";
import { CERTIFICATE_SIZES, type CertificateFormat } from "@/lib/certificate/data";
import { Button, buttonClasses } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Toast } from "../ui/toast";

interface CertificateModalProps {
  imagePath: string;
  resultUrl: string;
  shareUrl: string;
  fileName: string;
}

const FORMATS: { id: CertificateFormat; label: string }[] = [
  { id: "landscape", label: "Landscape" },
  { id: "square", label: "Square" },
];

export function CertificateModal({ imagePath, resultUrl, shareUrl, fileName }: CertificateModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<CertificateFormat>("landscape");
  const [loaded, setLoaded] = useState<Record<CertificateFormat, boolean>>({ landscape: false, square: false });
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();
  const src = `${imagePath}?format=${format}`;

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(src);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/png")) throw new Error(`HTTP ${res.status}`);
      downloadBlob(await res.blob(), `${fileName}-death-certificate.png`);
      toast.show("Certificate downloaded");
    } catch {
      toast.show("The download didn't go through. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    toast.show((await copyText(resultUrl)) ? "Copied" : "Couldn't copy. Copy the address bar instead.");
  }

  return (
    <>
      <Button size="lg" onClick={() => dialog.current?.showModal()}>
        Get Death Certificate
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="certificate-title"
        className="m-auto w-[min(100%-2rem,56rem)] rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 id="certificate-title" className="font-display text-2xl font-semibold tracking-tight">
              Death Certificate
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="flex size-11 items-center justify-center rounded-lg text-2xl text-muted transition hover:bg-background hover:text-foreground"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div role="radiogroup" aria-label="Format" className="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={format === f.id}
                onClick={() => setFormat(f.id)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm transition",
                  format === f.id ? "border-primary text-primary" : "border-border text-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-background",
              format === "square" ? "max-w-md" : "",
            )}
            style={{ aspectRatio: `${CERTIFICATE_SIZES[format].width} / ${CERTIFICATE_SIZES[format].height}` }}
          >
            {!loaded[format] && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
                <Spinner className="size-6 text-primary" label="Rendering certificate" />
                <span className="text-sm">Embossing the seal…</span>
              </div>
            )}
            <Image
              key={format}
              src={src}
              alt="Death certificate for this repository"
              fill
              unoptimized
              sizes="(max-width: 896px) 100vw, 896px"
              className={cn("object-contain transition-opacity", loaded[format] ? "opacity-100" : "opacity-0")}
              onLoad={() => setLoaded((l) => ({ ...l, [format]: true }))}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "lg", "flex-1")}>
              Share on X
            </a>
            <Button size="lg" variant="ghost" className="flex-1" onClick={download} loading={downloading}>
              Download PNG
            </Button>
            <Button size="lg" variant="ghost" className="flex-1" onClick={copyLink}>
              Copy link
            </Button>
          </div>
        </div>
      </dialog>
      <Toast message={toast.message} />
    </>
  );
}
