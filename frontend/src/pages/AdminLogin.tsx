import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "../components/Logo";

interface AdminLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <header className="participant-header">
        <Logo />
        <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Back to experiment</button>
      </header>
      <main className="login-layout">
        <section className="login-story">
          <span className="login-shield"><ShieldCheck size={21} /></span>
          <p className="eyebrow">CHOICELAB ADMIN</p>
          <h1>Behavioral insights stay behind the experiment.</h1>
          <p>Sign in to review participant responses, preference significance, decision latency, device segments, and qualitative feedback.</p>
          <div className="login-feature-list">
            <span><i>01</i> Review live experiment analytics</span>
            <span><i>02</i> Export the behavioral dataset</span>
            <span><i>03</i> Keep participant and admin views separate</span>
          </div>
        </section>
        <section className="login-card">
          <div className="login-icon"><LockKeyhole size={22} /></div>
          <h2>Admin sign in</h2>
          <p>Enter the demo workspace credentials.</p>
          <form onSubmit={submit}>
            <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" autoComplete="username" required /></label>
            <label>Password<span className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {error && <p className="login-error">{error}</p>}
            <button className="button primary login-submit" disabled={submitting}>{submitting ? "Signing in…" : "Open admin dashboard"} <ArrowRight size={17} /></button>
          </form>
          <div className="demo-credentials"><span>Demo access</span><code>admin</code><code>admin123</code></div>
          <small>These credentials are intentionally public for this portfolio demo. Production deployments should use managed identity.</small>
        </section>
      </main>
    </div>
  );
}

