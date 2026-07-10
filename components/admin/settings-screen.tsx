"use client";

import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";
import { useThemeSettings } from "@/components/admin/theme-provider";

export function SettingsScreen() {
  const { settings, setSettings } = useThemeSettings();

  return (
    <AppShell
      title="Configuracoes de interface"
      subtitle="Ajuste cores, densidade e largura do layout para deixar o sistema com a leitura operacional mais proxima do seu uso real."
    >
      <section className="settings-grid">
        <article className="panel" style={{ padding: "1.2rem" }}>
          <div className="kpi-label">tema</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: "0.5rem 0 1rem" }}>
            Paleta principal
          </h2>
          <div className="swatch-grid">
            {[
              { key: "brand", label: "Marca DLED", color: "linear-gradient(135deg,#c61616,#161616)" },
              { key: "ruby", label: "Ruby", color: "linear-gradient(135deg,#9f1239,#881337)" },
              { key: "graphite", label: "Graphite", color: "linear-gradient(135deg,#161616,#2c2c2c)" },
              { key: "oxide", label: "Oxide", color: "linear-gradient(135deg,#b91c1c,#7f1d1d)" },
            ].map((theme) => (
              <div className="swatch" key={theme.key}>
                <button
                  style={{ background: theme.color }}
                  data-active={settings.accent === theme.key}
                  onClick={() => setSettings({ ...settings, accent: theme.key as typeof settings.accent })}
                />
                <strong>{theme.label}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel" style={{ padding: "1.2rem" }}>
          <div className="kpi-label">layout</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: "0.5rem 0 1rem" }}>
            Densidade visual
          </h2>
          <div className="checkbox-grid">
            {[
              { key: "compact", label: "Compacto", note: "Mais dados por tela" },
              { key: "comfortable", label: "Confortavel", note: "Equilibrio entre leitura e densidade" },
              { key: "spacious", label: "Amplo", note: "Mais respiro e destaque visual" },
            ].map((density) => (
              <label className="checkbox-card" key={density.key}>
                <input
                  type="radio"
                  checked={settings.density === density.key}
                  onChange={() => setSettings({ ...settings, density: density.key as typeof settings.density })}
                />
                <span>
                  <strong>{density.label}</strong>
                  <span className="field__hint" style={{ display: "block", marginTop: "0.2rem" }}>
                    {density.note}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <div className="kpi-label">largura</div>
            <div className="checkbox-grid" style={{ marginTop: "0.75rem" }}>
              {[
                { key: "normal", label: "Conteudo concentrado" },
                { key: "wide", label: "Painel expandido" },
              ].map((layout) => (
                <label className="checkbox-card" key={layout.key}>
                  <input
                    type="radio"
                    checked={settings.contentWidth === layout.key}
                    onChange={() => setSettings({ ...settings, contentWidth: layout.key as typeof settings.contentWidth })}
                  />
                  <span>
                    <strong>{layout.label}</strong>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="panel" style={{ padding: "1.2rem" }}>
        <div className="section-heading">
          <div>
            <div className="kpi-label">impressoes</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: "0.5rem 0 0.25rem" }}>
              Templates de impressao
            </h2>
            <p className="page-subtitle">
              Cadastre os modelos PDF usados em etiquetas e relatorios, com contexto de uso para aparecer no local certo.
            </p>
          </div>
          <Link className="btn btn--primary" href="/settings/print-templates">
            Gerenciar templates
          </Link>
        </div>
      </section>

      <section className="panel" style={{ padding: "1.2rem" }}>
        <div className="kpi-label">preview</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: "0.5rem 0 1rem" }}>
          Como o sistema responde
        </h2>
        <div className="card-grid">
          <div className="panel panel--soft" style={{ padding: "1rem" }}>
            <div className="kpi-label">cartao</div>
            <p className="kpi-value" style={{ fontSize: "1.6rem" }}>
              128
            </p>
            <span className="badge badge--accent">Accent ativo</span>
          </div>
          <div className="panel panel--soft" style={{ padding: "1rem" }}>
            <div className="kpi-label">tabela</div>
            <div className="notice">A densidade altera o respiro visual dos formularios e blocos de dados.</div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
