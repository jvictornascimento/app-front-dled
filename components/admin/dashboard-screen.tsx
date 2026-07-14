"use client";

import Link from "next/link";
import { AppShell } from "@/components/admin/app-shell";

export function DashboardScreen() {
  return (
    <AppShell
      title="Painel operacional"
      subtitle="Resumo dos cadastros, compras e acessos para acompanhamento diario."
      actions={
        <>
          <Link className="btn btn--primary" href="/products/new">
            Novo produto
          </Link>
          <Link className="btn btn--ghost" href="/orders/new">
            Novo pedido
          </Link>
        </>
      }
    >
      <section className="dashboard-grid">
        <article className="panel work-panel">
          <div className="section-heading">
            <div>
              <div className="kpi-label">rotina</div>
              <h2>Atalhos de trabalho</h2>
            </div>
          </div>
          <div className="quick-actions">
            {[
              { label: "Produtos", href: "/products" },
              { label: "Categorias", href: "/categories" },
              { label: "Pedidos", href: "/orders" },
            ].map((item) => (
              <Link key={item.href} className="quick-action" href={item.href}>
                <span>{item.label}</span>
                <strong>Abrir</strong>
              </Link>
            ))}
          </div>
        </article>

        <article className="panel work-panel">
          <div className="section-heading">
            <div>
              <div className="kpi-label">cadastro</div>
              <h2>Sequencia recomendada</h2>
            </div>
          </div>
          <ol className="task-list">
            <li className="task-list__item">
              <span className="task-list__index">1</span>
              <span>
                <strong className="task-list__title">Categorias</strong>
                <span className="task-list__text">Organizam o catalogo para busca e cadastro.</span>
              </span>
            </li>
            <li className="task-list__item">
              <span className="task-list__index">2</span>
              <span>
                <strong className="task-list__title">Produtos vinculados</strong>
                <span className="task-list__text">Base usada por pedidos, lotes e etiquetas.</span>
              </span>
            </li>
            <li className="task-list__item">
              <span className="task-list__index">3</span>
              <span>
                <strong className="task-list__title">Empresas para pedidos</strong>
                <span className="task-list__text">Clientes e fornecedores envolvidos na operacao.</span>
              </span>
            </li>
            <li className="task-list__item">
              <span className="task-list__index">4</span>
              <span>
                <strong className="task-list__title">Pedidos registrados</strong>
                <span className="task-list__text">Acompanhamento de compras e lotes gerados.</span>
              </span>
            </li>
          </ol>
        </article>

        <article className="panel work-panel">
          <div className="section-heading">
            <div>
              <div className="kpi-label">impressoes</div>
              <h2>Etiquetas e documentos</h2>
              <p>Area reservada para os fluxos de impressao que serao ligados depois.</p>
            </div>
          </div>
          <div className="quick-actions">
            <Link className="quick-action" href="/prints/month">
              <span>Mes</span>
              <strong>Abrir</strong>
            </Link>
            <Link className="quick-action" href="/prints/wood">
              <span>Wood</span>
              <strong>Abrir</strong>
            </Link>
            <button className="quick-action quick-action--disabled" type="button" disabled>
              <span>Etiquetas de produto</span>
              <strong>Em breve</strong>
            </button>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
