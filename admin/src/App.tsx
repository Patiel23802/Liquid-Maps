import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

type Metrics = {
  totalUsers: number;
  plansCreated24h: number;
  planJoins24h: number;
  openReports: number;
  pendingVerifications: number;
};

function App() {
  const [email, setEmail] = useState("admin@socialise.local");
  const [password, setPassword] = useState("changeme123");
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("socialise_admin_token")
  );
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [reports, setReports] = useState<unknown[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Login failed");
      const t = json.data.accessToken as string;
      sessionStorage.setItem("socialise_admin_token", t);
      setToken(t);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = useCallback(async (t: string) => {
    const headers = { Authorization: `Bearer ${t}` };
    const [mRes, rRes] = await Promise.all([
      fetch(`${API}/api/v1/admin/metrics/overview`, { headers }),
      fetch(`${API}/api/v1/admin/reports`, { headers }),
    ]);
    const mJson = await mRes.json();
    const rJson = await rRes.json();
    if (mRes.ok) setMetrics(mJson.data);
    if (rRes.ok) setReports(rJson.data ?? []);
  }, []);

  useEffect(() => {
    if (token) loadDashboard(token);
  }, [token, loadDashboard]);

  const logout = () => {
    sessionStorage.removeItem("socialise_admin_token");
    setToken(null);
    setMetrics(null);
    setReports([]);
  };

  if (!token) {
    return (
      <div className="shell">
        <div className="card">
          <h1>Socialise Admin</h1>
          <p className="muted">Moderation & launch metrics (MVP)</p>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {err ? <p className="err">{err}</p> : null}
          <button type="button" onClick={login} disabled={loading}>
            {loading ? "…" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="top">
        <h1>Socialise Admin</h1>
        <button type="button" className="ghost" onClick={logout}>
          Log out
        </button>
      </header>
      <div className="grid">
        <div className="tile">
          <span className="tileLabel">Users</span>
          <span className="tileVal">{metrics?.totalUsers ?? "—"}</span>
        </div>
        <div className="tile">
          <span className="tileLabel">Plans (24h)</span>
          <span className="tileVal">{metrics?.plansCreated24h ?? "—"}</span>
        </div>
        <div className="tile">
          <span className="tileLabel">Joins (24h)</span>
          <span className="tileVal">{metrics?.planJoins24h ?? "—"}</span>
        </div>
        <div className="tile warn">
          <span className="tileLabel">Open reports</span>
          <span className="tileVal">{metrics?.openReports ?? "—"}</span>
        </div>
        <div className="tile">
          <span className="tileLabel">Pending ID reviews</span>
          <span className="tileVal">
            {metrics?.pendingVerifications ?? "—"}
          </span>
        </div>
      </div>
      <section className="section">
        <h2>Reports queue</h2>
        <p className="muted">
          Full moderation tools: Phase 2 (assign, ban, hide plan).
        </p>
        <pre className="pre">{JSON.stringify(reports, null, 2)}</pre>
      </section>
    </div>
  );
}

export default App;
