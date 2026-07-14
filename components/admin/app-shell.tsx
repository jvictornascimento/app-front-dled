"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigationItems } from "@/lib/admin-config";
import { useAuth } from "@/components/admin/auth-provider";
import { useThemeSettings } from "@/components/admin/theme-provider";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isHydrated, logout } = useAuth();
  const { settings } = useThemeSettings();
  const [openGroups, setOpenGroups] = useState({
    estoque: true,
    impressoes: true,
    configuracao: true,
  });

  const dashboardItem = navigationItems.find((item) => item.href === "/dashboard");
  const stockItems = navigationItems.filter((item) =>
    ["/products", "/categories", "/wood-products", "/orders"].includes(item.href),
  );
  const printItems = [
    { href: "/prints/wood", title: "Wood", meta: "Etiqueta wood" },
    { href: "/prints/month", title: "Mes", meta: "Etiqueta mensal" },
  ];
  const settingsItems = [
    ...navigationItems.filter((item) => ["/companies", "/users", "/settings"].includes(item.href)),
    { href: "/settings/print-templates", title: "Template etiqueta", meta: "Modelos de etiqueta" },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isGroupActive(items: typeof navigationItems) {
    return items.some((item) => isActive(item.href));
  }

  function toggleGroup(group: keyof typeof openGroups) {
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));
  }

  function renderNavLink(item: (typeof navigationItems)[number]) {
    return (
      <Link key={item.href} href={item.href} className="nav-link" data-active={isActive(item.href)}>
        <span>{item.title}</span>
      </Link>
    );
  }

  if (!isHydrated) {
    return <div className="empty-state">Preparando o sistema...</div>;
  }

  if (!user) {
    return (
      <div className="login-form-wrap">
        <div className="panel" style={{ maxWidth: 560, width: "100%", padding: "1.6rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>
            Sessao indisponivel
          </h1>
          <p className="page-subtitle">
            Faça login novamente para acessar as rotas de gerenciamento protegidas pelo backend.
          </p>
          <div className="toolbar" style={{ marginTop: "1rem" }}>
            <Link className="btn btn--primary" href="/login">
              Ir para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="shell__nav">
        <div className="sidebar-brand">
          <div className="sidebar-brand__mark">
            {settings.appIconUrl ? (
              <span
                aria-label="Icone do sistema"
                className="sidebar-brand__image"
                role="img"
                style={{ backgroundImage: `url(${settings.appIconUrl})` }}
              />
            ) : (
              "DL"
            )}
          </div>
          <div>
            <span className="sidebar-brand__eyebrow">DLED</span>
            <h1 className="sidebar-brand__title">Operations</h1>
          </div>
        </div>

        <nav className="nav-group">
          {dashboardItem ? renderNavLink(dashboardItem) : null}

          <div className="nav-section">
            <button
              type="button"
              className="nav-section__button"
              aria-expanded={openGroups.estoque}
              data-active={isGroupActive(stockItems)}
              onClick={() => toggleGroup("estoque")}
            >
              <span>Estoque</span>
              <span aria-hidden="true">{openGroups.estoque ? "-" : "+"}</span>
            </button>
            {openGroups.estoque ? <div className="nav-section__items">{stockItems.map(renderNavLink)}</div> : null}
          </div>

          <div className="nav-section">
            <button
              type="button"
              className="nav-section__button"
              aria-expanded={openGroups.impressoes}
              data-active={isGroupActive(printItems)}
              onClick={() => toggleGroup("impressoes")}
            >
              <span>Impressoes</span>
              <span aria-hidden="true">{openGroups.impressoes ? "-" : "+"}</span>
            </button>
            {openGroups.impressoes ? <div className="nav-section__items">{printItems.map(renderNavLink)}</div> : null}
          </div>

          <div className="nav-section">
            <button
              type="button"
              className="nav-section__button"
              aria-expanded={openGroups.configuracao}
              data-active={isGroupActive(settingsItems)}
              onClick={() => toggleGroup("configuracao")}
            >
              <span>Configuracao</span>
              <span aria-hidden="true">{openGroups.configuracao ? "-" : "+"}</span>
            </button>
            {openGroups.configuracao ? <div className="nav-section__items">{settingsItems.map(renderNavLink)}</div> : null}
          </div>
        </nav>

        <div className="user-card">
          <div>
            <div className="sidebar-brand__eyebrow">Sessao ativa</div>
            <div className="user-card__name">{user.fullName}</div>
            <div className="nav-link__meta">
              {user.role} - {user.username}
            </div>
          </div>
          <div className="toolbar">
            <button
              className="btn btn--ghost"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="shell__main">
        <div className="content-frame">
          <header className="shell__topbar">
            <div className="page-header">
              <div>
                <div className="page-meta">{pathname}</div>
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle">{subtitle}</p>
              </div>
              <div className="topbar__right">
                <div className="topbar__session">
                  <span>{user.role}</span>
                  <strong>{user.username}</strong>
                </div>
                {actions ? <div className="toolbar">{actions}</div> : null}
              </div>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
