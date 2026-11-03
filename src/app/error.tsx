"use client";
import { useEffect } from "react";
import Link from "next/link";

/** Route-level error boundary. Shows a friendly message — never the stack trace or error text. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Production error-reporting hook: forward to Sentry/Logging here (error.digest correlates with server logs).
    console.error("[route error]", error.digest ?? "", error);
  }, [error]);
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 font-serif text-5xl">We hit a snag</h1>
        <p className="mx-auto mt-4 max-w-md text-taupe-deep">This page couldn&apos;t load. Please try again — if it keeps happening, contact us and quote reference <b>{error.digest ?? "n/a"}</b>.</p>
        <div className="mt-10 flex justify-center gap-3"><button onClick={reset} className="btn btn-solid">Try again</button><Link href="/" className="btn btn-ghost">Home</Link></div>
      </div>
    </div>
  );
}
