"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/admin/app-shell";

interface DashboardData {
  products: number;
  categories: number;
  companies: number;
  orders: number;
  users: number;
  totalValue: number;
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [products, categoriesTree, companies, orders, users] = await Promise.all([
          api.listProducts(),
          api.listCategoriesTree(),
          api.listCompanies(),
          api.listOrders(),
          api.listUsers(),
        ]);

        setData({
          products: products.length,
          categories: categoriesTree.reduce((count, item) => count + 1 + item.children.length, 0),
          companies: companies.length,
          orders: orders.length,
          users: users.length,
          totalValue: products.reduce((sum, item) => sum + (item.price ?? 0), 0),
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Nao foi possivel carregar o painel.");
      }
    }

    void load();
  }, []);

  return (
    <AppShell
      title="Painel central"
      subtitle="Visao executiva do backend administrativo, com atalhos para os modulos de cadastro e operacao."
      actions={
        <>
          <Link className="btn btn--ghost" href="/settings">
            Ajustar layout
          </Link>
          <Link className="btn btn--primary" href="/products/new">
            Novo produto
          </Link>
        </>
      }
    >
      {error ? <div className="notice notice--error">{error}</div> : null}

      <section className="card-grid">
        {[
          { label: "Produtos", value: data?.products ?? "-", hint: "catalogo ativo" },
          { label: "Categorias", value: data?.categories ?? "-", hint: "estrutura comercial" },
          { label: "Empresas", value: data?.companies ?? "-", hint: "origens cadastradas" },
          { label: "Pedidos", value: data?.orders ?? "-", hint: "lotes registrados" },
          { label: "Usuarios", value: data?.users ?? "-", hint: "contas operacionais" },
          { label: "Valor listado", value: data ? formatCurrency(data.totalValue) : "-", hint: "soma dos precos atuais" },
        ].map((item) => (
          <article key={item.label} className="panel kpi-card">
            <div className="kpi-label">{item.hint}</div>
            <p className="kpi-value">{item.value}</p>
            <div style={{ fontWeight: 600 }}>{item.label}</div>
          </article>
        ))}
      </section>

      <section className="card-grid">
        {[
          {
            title: "Fluxo de catalogo",
            text: "Cadastre primeiro categorias e produtos. O backend atual exige categoryIds no payload de produto.",
            href: "/products",
          },
          {
            title: "Fluxo de compras",
            text: "Pedidos dependem de empresas e produtos existentes. O lote e a data sao obrigatorios.",
            href: "/orders",
          },
          {
            title: "Governanca de acesso",
            text: "Usuarios seguem os perfis ADMIN, USER, EMPLOY, SELLER e CLIENT conforme o contrato do backend.",
            href: "/users",
          },
        ].map((item) => (
          <article key={item.title} className="panel" style={{ padding: "1.2rem" }}>
            <div className="kpi-label">rota recomendada</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", margin: "0.55rem 0" }}>{item.title}</h2>
            <p className="page-subtitle" style={{ marginTop: 0 }}>{item.text}</p>
            <div className="toolbar" style={{ marginTop: "1rem" }}>
              <Link className="btn btn--ghost" href={item.href}>
                Abrir modulo
              </Link>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
