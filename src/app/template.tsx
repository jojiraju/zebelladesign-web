/** Subtle CSS-only route transition. Never delays navigation or focus, and is disabled for reduced motion. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
