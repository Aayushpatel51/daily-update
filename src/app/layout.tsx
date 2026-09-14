import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Daily Update · Know what changed",
    template: "%s · Daily Update",
  },
  description: "Source-backed technology briefs, with context worth your time.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <header className="header">
          <Link className="wordmark" href="/">
            daily<span>update</span>
            <span className="wordmark-dot">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/">Latest</Link>
            <Link href="/archive">Archive</Link>
            <Link href="/about">Our approach</Link>
            <Link className="nav-cta" href="/subscribe">
              Choose your topics <span aria-hidden>↗</span>
            </Link>
          </nav>
        </header>
        <main id="content">{children}</main>
        <footer>
          <div>
            <Link className="wordmark small" href="/">
              daily<span>update</span>.
            </Link>
            <p>Know what changed. Understand why it matters.</p>
          </div>
          <nav aria-label="Footer">
            <Link href="/preferences">Preferences</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/admin">Editorial desk</Link>
          </nav>
          <p className="caption">
            Local testing edition. Demonstration stories are labelled.
          </p>
        </footer>
      </body>
    </html>
  );
}
