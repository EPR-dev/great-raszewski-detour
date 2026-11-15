import { useState } from "react";
import type { FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { messageOf } from "../lib/search";

export function AuthScreen({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "up") {
        const { error } = await client.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage("Account created. If email confirmation is on, check the inbox, then sign in.");
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="gate">
      <div className="motel-sign" aria-hidden="true">
        <span>The Great</span>
        <span>Raszewski Detour</span>
      </div>
      <p className="tagline">Australia, one wildly optimistic detour at a time.</p>
      <form className="gate-card" onSubmit={submit}>
        <h1>{mode === "in" ? "Sign in" : "Create an account"}</h1>
        <p>Each family member has their own sign-in. The map is only for people on it.</p>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {message ? <p className="hint">{message}</p> : null}
        <button type="submit" className="made-it" disabled={busy}>
          {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMessage(null);
          }}
        >
          {mode === "in" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

export function JoinScreen({
  email,
  busy,
  message,
  onCreate,
  onRefresh,
  onSignOut,
}: {
  email: string;
  busy: boolean;
  message: string | null;
  onCreate: (name: string) => void;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState("The Great Raszewski Detour");
  return (
    <main className="gate">
      <div className="motel-sign" aria-hidden="true">
        <span>The Great</span>
        <span>Raszewski Detour</span>
      </div>
      <form
        className="gate-card"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(name.trim());
        }}
      >
        <h1>You are not on a map yet</h1>
        <p>
          Signed in as {email}. If someone already made the family map, ask them to add this email,
          then check again. Or start the map yourself.
        </p>
        <label className="field">
          <span>Map name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
        </label>
        {message ? <p className="hint">{message}</p> : null}
        <button type="submit" className="made-it" disabled={busy || !name.trim()}>
          Create the family map
        </button>
        <div className="button-row">
          <button type="button" className="secondary" onClick={onRefresh} disabled={busy}>
            Check again
          </button>
          <button type="button" className="text-button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </form>
    </main>
  );
}
