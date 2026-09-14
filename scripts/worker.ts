import { tick } from "../src/lib/worker";
console.log(
  "Local worker running. Paid research disabled; email captured locally.",
);
while (true) {
  try {
    await tick();
  } catch {
    console.error(
      "Worker cycle failed; check local database and provider configuration.",
    );
  }
  await new Promise((r) => setTimeout(r, 15000));
}
