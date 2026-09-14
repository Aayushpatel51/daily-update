"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export async function send(data: unknown) {
  const res = await fetch("/api/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Please try again.");
  return body;
}
export function ActionForm({
  action,
  values = {},
  children,
  label = "Save",
  className = "",
}: {
  action: string;
  values?: Record<string, unknown>;
  children?: ReactNode;
  label?: string;
  className?: string;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await send({ action, ...values, ...data });
      if (r.redirect) {
        router.push(r.redirect);
        router.refresh();
      } else {
        setMessage(r.message ?? "Saved.");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={className}>
      {children}
      <button disabled={busy}>{busy ? "Working…" : label}</button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
    </form>
  );
}
