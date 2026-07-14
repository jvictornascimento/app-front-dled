"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/admin/auth-provider";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-hero__panel">
          <div>
            <div className="sidebar-brand__eyebrow">DLED Management</div>
            <h1 className="page-title" style={{ color: "white", fontSize: "3.4rem", marginTop: "0.8rem" }}>
              Painel operacional com cara de sistema.
            </h1>
            <p className="page-subtitle" style={{ color: "rgba(255,255,255,0.78)", maxWidth: 560 }}>
              Centralize cadastro, edicao e exclusao de produtos, categorias, empresas, pedidos e usuarios usando os contratos atuais do backend.
            </p>
          </div>

          <div className="card-grid">
            {[
              { label: "Produtos", desc: "Dados tecnicos e categorias" },
              { label: "Pedidos", desc: "Lotes e empresas" },
              { label: "Usuarios", desc: "Perfis e controle operacional" },
            ].map((item) => (
              <div key={item.label} className="panel panel--soft" style={{ padding: "1rem", color: "#dff5ff", background: "rgba(255,255,255,0.08)" }}>
                <div className="kpi-label" style={{ color: "rgba(255,255,255,0.6)" }}>
                  modulo
                </div>
                <p style={{ fontWeight: 700, fontSize: "1.25rem", margin: "0.4rem 0 0.3rem" }}>{item.label}</p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="login-form-wrap">
        <div className="panel" style={{ width: "100%", padding: "1.6rem" }}>
          <div className="page-header">
            <div>
              <div className="sidebar-brand__eyebrow" style={{ color: "var(--accent-strong)" }}>
                acesso protegido
              </div>
              <h2 className="page-title" style={{ fontSize: "2.1rem" }}>
                Entrar no sistema
              </h2>
              <p className="page-subtitle">
                O backend atual usa cookie JWT. O app envia as credenciais e passa a operar as rotas autenticadas.
              </p>
            </div>
          </div>

          <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
            <div className="field field--span-2">
              <label htmlFor="username">Usuario</label>
              <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div className="field field--span-2">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <div className="field field--span-2">
                <div className="notice notice--error">{error}</div>
              </div>
            ) : null}

            <div className="field field--span-2">
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? "Autenticando..." : "Entrar"}
              </button>
            </div>

            <div className="field field--span-2">
              <div className="notice">
                Dica de ambiente local: o backend atual sobe em <strong>http://127.0.0.1:8081/v1</strong> e usa a API key
                padrão <strong>test-api-key</strong> para leituras públicas.
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
