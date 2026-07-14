"use client";

import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { pdfPlugins } from "@/lib/pdfme";
import { expandTemplateColumns, getPrintFieldSourceName } from "@/lib/print-layout";
import { AppShell } from "@/components/admin/app-shell";
import type { PrintTemplateDto, PrintTemplateListDto } from "@/types/api";

function parseTemplate(templateJson: string) {
  return JSON.parse(templateJson) as Template;
}

function buildSampleInput(template: Template) {
  const input: Record<string, string> = {};

  template.schemas.flat().forEach((schema) => {
    if (!schema.name) return;
    const sourceName = getPrintFieldSourceName(schema.name);
    input[schema.name] = sourceName === "mesAno" ? "julho/2026" : schema.content ? String(schema.content) : sourceName;
  });

  return input;
}

async function openPdf(detail: PrintTemplateDto) {
  const template = parseTemplate(detail.templateJson);
  const printTemplate = expandTemplateColumns(template);
  const pdf = await generate({
    template: printTemplate,
    inputs: [buildSampleInput(printTemplate)],
    plugins: pdfPlugins,
  });
  const blob = new Blob([pdf.buffer], { type: "application/pdf" });
  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
}

export function PrintTemplatesScreen() {
  const [templates, setTemplates] = useState<PrintTemplateListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        setTemplates(await api.listPrintTemplatesByContext("PRINTS_MENU"));
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar os templates de impressao.");
      } finally {
        setLoading(false);
      }
    }

    void loadTemplates();
  }, []);

  async function handlePrint(item: PrintTemplateListDto) {
    setPrintingId(item.id);
    setError(null);

    try {
      const detail = await api.getPrintTemplate(String(item.id));
      await openPdf(detail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel gerar o PDF.");
    } finally {
      setPrintingId(null);
    }
  }

  return (
    <AppShell
      title="Impressoes"
      subtitle="Escolha um template ativo para gerar preview em PDF e imprimir."
    >
      {error ? <div className="notice notice--error">{error}</div> : null}

      <section className="panel work-panel">
        <div className="section-heading">
          <div>
            <div className="kpi-label">templates</div>
            <h2>Disponiveis para impressao</h2>
            <p>Esta lista mostra os templates ativos configurados para aparecer no menu de impressoes.</p>
          </div>
        </div>

        {loading ? <div className="empty-state">Carregando templates...</div> : null}

        {!loading && templates.length === 0 ? (
          <div className="empty-state">Nenhum template ativo encontrado para o menu de impressoes.</div>
        ) : null}

        <div className="quick-actions">
          {templates.map((item) => (
            <button key={item.id} className="quick-action" type="button" onClick={() => handlePrint(item)}>
              <span>{item.description || `${item.widthMm ?? "-"} x ${item.heightMm ?? "-"} mm`}</span>
              <strong>{printingId === item.id ? "Gerando..." : item.name}</strong>
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
