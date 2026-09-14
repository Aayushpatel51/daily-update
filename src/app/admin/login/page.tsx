import { ActionForm } from "@/components/forms";
export default function Login() {
  return (
    <div className="login-panel">
      <p className="eyebrow">Editorial access</p>
      <h1>
        A place for
        <br />
        <em>careful review.</em>
      </h1>
      <p>Sign in with the editor password from your local .env file.</p>
      <ActionForm action="login" label="Open the editorial desk">
        <label>
          Editor password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
      </ActionForm>
    </div>
  );
}
