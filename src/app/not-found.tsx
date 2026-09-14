import Link from "next/link";
export default function Missing() {
  return (
    <div className="narrow page-heading">
      <h1>This page isn’t available.</h1>
      <p>The story may not be published yet, or the link may have changed.</p>
      <Link href="/">Back to the latest updates →</Link>
    </div>
  );
}
