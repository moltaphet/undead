import Link from "next/link";
import { CertificateModal } from "../certificate/certificate-modal";
import { buttonClasses } from "../ui/button";

interface CtaRowProps {
  owner: string;
  repo: string;
  resultUrl: string;
  shareUrl: string;
}

export function CtaRow({ owner, repo, resultUrl, shareUrl }: CtaRowProps) {
  const base = `/r/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <CertificateModal
        imagePath={`/api/certificate/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
        resultUrl={resultUrl}
        shareUrl={shareUrl}
        fileName={repo}
      />
      <Link href={`${base}/resurrect`} prefetch={false} className={buttonClasses("ghost", "lg")}>
        Resurrect it
      </Link>
      <Link href={`${base}/seance`} prefetch={false} className={buttonClasses("ghost", "lg")}>
        Hold a Séance
      </Link>
    </div>
  );
}
