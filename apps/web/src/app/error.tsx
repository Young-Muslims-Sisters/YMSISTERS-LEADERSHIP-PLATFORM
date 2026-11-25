"use client";

import { useEffect } from "react";
import { MessagePage } from "@/components/ui/MessagePage";
import { primaryButton } from "@/components/ui/buttons";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MessagePage title="Something went wrong" text="Please try again in a moment.">
      <button type="button" onClick={() => retry()} className={primaryButton}>Try again</button>
    </MessagePage>
  );
}
