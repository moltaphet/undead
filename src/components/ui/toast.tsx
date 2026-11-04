export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {message && (
        <p className="rounded-full border border-primary/40 bg-surface px-4 py-2 text-sm text-foreground shadow-ecto">{message}</p>
      )}
    </div>
  );
}
