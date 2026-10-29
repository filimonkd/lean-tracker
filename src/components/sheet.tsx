"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";

/**
 * Bottom sheet built on the native <dialog>, so focus trapping, Escape and
 * the backdrop come from the browser. Children only mount while open.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a backdrop click.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      {open && (
        <div className="animate-sheet-up mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[36px] bg-bg px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-chip" aria-hidden />
          <div className="mt-1 flex justify-end">
            <Button variant="secondary" size="icon-sm" onClick={onClose} aria-label="Close">
              <X className="size-4" strokeWidth={2.4} />
            </Button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
