"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="narrow page-heading">
      <h1>We couldn’t load this page.</h1>
      <p>Check that the local database is running, then try again.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
