export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 text-sm text-muted">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
        <p>
          Built for Vibeathon 02 on{" "}
          <a href="https://app.vibestarter.xyz" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-foreground underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary">
            Vibestarter
          </a>
          .
        </p>
        <p>Built with Claude.</p>
      </div>
    </footer>
  );
}
