import type { ComponentProps, ReactNode } from "react";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";

export function PrimaryButton(props: ComponentProps<"button">) {
  return <button type="button" className={primaryButton} {...props} />;
}

// Fixed bar at the bottom of every screen: Back on the left, the main action on the right.
export function FormFooter({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-page/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[940px] items-center justify-between gap-4 px-4 py-4 sm:px-0">
        {onBack ? (
          <button type="button" onClick={onBack} className={secondaryButton}>
            Back
          </button>
        ) : (
          <span />
        )}
        {children}
      </div>
    </div>
  );
}
