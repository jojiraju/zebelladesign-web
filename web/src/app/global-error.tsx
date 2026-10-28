"use client";

/** Last-resort boundary for errors in the root layout itself. Must render its own <html>. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FDF8F6", color: "#231A1D", fontFamily: "Georgia, serif", display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontWeight: 400, fontSize: 40 }}>Zebella Designs</h1>
          <p>Something went wrong on our side. Please try again.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 28px", background: "#231A1D", color: "#FDF8F6", border: 0, letterSpacing: ".2em", textTransform: "uppercase", cursor: "pointer" }}>Reload</button>
        </div>
      </body>
    </html>
  );
}
