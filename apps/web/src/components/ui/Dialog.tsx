"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  title: string;
  onClose: () => void;
  // "drawer" slides over the right side; "modal" sits in the center.
  variant: "drawer" | "modal";
  children: ReactNode;
};

// Native dialog: traps focus, closes on Escape, the × button or a click outside.
export function Dialog({ title, onClose, variant, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // The browser's Back button closes the dialog instead of leaving the page.
  useEffect(() => {
    let added = false;
    const onPop = () => {
      if (added && window.history.state?.dialog !== titleId) {
        added = false;
        closeRef.current();
      }
    };
    const timer = setTimeout(() => {
      window.history.pushState({ dialog: titleId }, "");
      added = true;
    });
    window.addEventListener("popstate", onPop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", onPop);
      if (added && window.history.state?.dialog === titleId) window.history.back();
    };
  }, [titleId]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`bg-white p-0 text-ink shadow-card backdrop:bg-forest-950/20 ${
        variant === "drawer"
          ? "screen-enter m-0 ml-auto h-dvh max-h-none w-full max-w-[520px] overflow-y-auto"
          : "screen-enter m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-[760px] overflow-y-auto rounded-2xl sm:[@media(min-height:660px)]:overflow-visible"
      }`}
    >
      <div className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-sage-300 bg-white px-5 py-4 [dialog.rounded-2xl_&]:rounded-t-2xl">
        <h2 id={titleId} className="text-[18px] font-bold text-forest-950">{title}</h2>
        <button type="button" aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-lg bg-mint-50 text-[18px] text-forest-950 hover:bg-mint-100">
          ×
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
