"use client";

import { AppShell } from "@/components/admin/app-shell";
import { useAuth } from "@/components/admin/auth-provider";
import { useThemeSettings } from "@/components/admin/theme-provider";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SettingsScreen() {
  const { settings, setSettings } = useThemeSettings();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  async function updateAppIcon(fileList: FileList | null) {
    if (!isAdmin) return;

    const file = fileList?.[0];
    if (!file) return;

    const appIconUrl = await readFileAsDataUrl(file);
    setSettings({ ...settings, appIconUrl });
  }

  async function updateFavicon(fileList: FileList | null) {
    if (!isAdmin) return;

    const file = fileList?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".ico")) {
      window.alert("O favicon deve ser um arquivo .ico.");
      return;
    }

    const faviconUrl = await readFileAsDataUrl(file);
    setSettings({ ...settings, faviconUrl });
  }

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
        <div className="kpi-label">identidade</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", margin: "0.5rem 0 1rem" }}>
          Icones do sistema
        </h2>

        {!isAdmin ? (
          <div className="notice notice--error" style={{ marginBottom: "1rem" }}>
            Somente usuarios administradores podem alterar os icones do sistema.
          </div>
        ) : null}

        <div className="card-grid">
          <div className="asset-card">
            <div className="asset-card__header">
              <div>
                <div className="kpi-label">icone</div>
                <strong>Icone do painel</strong>
              </div>
              {settings.appIconUrl ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setSettings({ ...settings, appIconUrl: null })}
                >
                  Remover
                </button>
              ) : null}
            </div>
            <input type="file" accept="image/*" disabled={!isAdmin} onChange={(event) => updateAppIcon(event.target.files)} />
            {settings.appIconUrl ? (
              <div
                aria-label="Icone do painel"
                className="asset-card__preview asset-card__preview--icon"
                role="img"
                style={{ backgroundImage: `url(${settings.appIconUrl})` }}
              />
            ) : (
              <div className="empty-state">Nenhum icone cadastrado.</div>
            )}
          </div>

          <div className="asset-card">
            <div className="asset-card__header">
              <div>
                <div className="kpi-label">favicon</div>
                <strong>Favicon do navegador</strong>
              </div>
              {settings.faviconUrl ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setSettings({ ...settings, faviconUrl: null })}
                >
                  Remover
                </button>
              ) : null}
            </div>
            <input type="file" accept=".ico,image/x-icon" disabled={!isAdmin} onChange={(event) => updateFavicon(event.target.files)} />
            {settings.faviconUrl ? (
              <div
                aria-label="Favicon do sistema"
                className="asset-card__preview asset-card__preview--icon"
                role="img"
                style={{ backgroundImage: `url(${settings.faviconUrl})` }}
              />
            ) : (
              <div className="empty-state">Nenhum favicon cadastrado.</div>
            )}
            <div className="field__hint" style={{ marginTop: "0.6rem" }}>
              Aceita somente arquivo .ico.
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
