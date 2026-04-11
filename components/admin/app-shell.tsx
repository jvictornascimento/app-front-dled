"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navigationItems } from "@/lib/admin-config";
import { useAuth } from "@/components/admin/auth-provider";

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
          <span className="sidebar-brand__eyebrow">DLED Operations</span>
          <h1 className="sidebar-brand__title">Control Center</h1>
          <p className="sidebar-brand__desc">
            Sistema de gestao conectado ao backend administrativo atual.
          </p>
        </div>

        <nav className="nav-group">
          {navigationItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className="nav-link" data-active={active}>
                <span>{item.title}</span>
                <span className="nav-link__meta">{item.meta}</span>
              </Link>
            );
          })}
        </nav>

        <div className="user-card">
          <div>
            <div className="sidebar-brand__eyebrow">Sessao ativa</div>
            <div className="user-card__name">{user.fullName}</div>
            <div className="nav-link__meta">
              {user.role} • {user.username}
            </div>
          </div>
          <div className="toolbar">
            <button className="btn btn--ghost" onClick={() => router.push("/settings")}>
              Preferencias
            </button>
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
          <section className="panel" style={{ padding: "1.35rem 1.45rem" }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle">{subtitle}</p>
              </div>
              {actions ? <div className="toolbar">{actions}</div> : null}
            </div>
          </section>
          {children}
        </div>
      </main>
    </div>
  );
}
