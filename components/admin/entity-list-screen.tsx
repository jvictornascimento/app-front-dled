"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { getEntityDefinition, type EntityKey } from "@/lib/admin-config";
import { AppShell } from "@/components/admin/app-shell";

export function EntityListScreen({ entityKey }: { entityKey: EntityKey }) {
  const entity = getEntityDefinition(entityKey);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setItems(await entity.getList());
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar a listagem.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [entity]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;

    const term = query.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, query]);

  const columns = entity.getColumns();

  async function handleDelete(id: string) {
    const confirmed = window.confirm(`Excluir este ${entity.singularLabel}? Esta acao nao pode ser desfeita.`);
    if (!confirmed) return;

    try {
      await entity.remove(id);
      setItems((current) => current.filter((item) => String(item.id) !== id));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel excluir o registro.");
    }
  }

  return (
    <AppShell
      title={entity.label}
      subtitle={entity.listDescription}
      actions={
        <>
          <input
            aria-label={`Buscar ${entity.label}`}
            placeholder={`Buscar em ${entity.label.toLowerCase()}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ minWidth: 220 }}
          />
          <Link className="btn btn--primary" href={`${entity.route}/new`}>
            Novo {entity.singularLabel}
          </Link>
        </>
      }
    >
      {entity.note ? <div className="notice">{entity.note}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}

      <section className="panel" style={{ padding: "1rem" }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.label}>{column.label}</th>
                ))}
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-state">
                    Carregando {entity.label.toLowerCase()}...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="empty-state">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={String(item.id)}>
                    {columns.map((column) => (
                      <td key={column.label}>{column.render(item)}</td>
                    ))}
                    <td>
                      <div className="toolbar">
                        <Link className="btn btn--ghost" href={`${entity.route}/${item.id}`}>
                          Editar
                        </Link>
                        <button className="btn btn--danger" onClick={() => handleDelete(String(item.id))}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
