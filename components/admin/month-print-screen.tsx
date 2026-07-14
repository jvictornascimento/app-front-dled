"use client";

import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { pdfPlugins } from "@/lib/pdfme";
import { expandTemplateColumns, getPrintFieldSourceName } from "@/lib/print-layout";
import { AppShell } from "@/components/admin/app-shell";
import type { PrintTemplateDto, PrintTemplateListDto } from "@/types/api";

const months = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function currentMonthIndex() {
  return new Date().getMonth();
}

function currentYear() {
  return new Date().getFullYear();
}

function getCurrentMonthPrintData() {
  const month = months[currentMonthIndex()];
  const year = String(currentYear());

  return {
    month,
    year,
    labelText: `${month}/${year}`,
  };
}

function parseTemplate(templateJson: string) {
  return JSON.parse(templateJson) as Template;
}

function buildMonthInput(template: Template, data: ReturnType<typeof getCurrentMonthPrintData>) {
  const input: Record<string, string> = {};
  const valuesByName: Record<string, string> = {
    mes: data.month,
    mesMaiusculo: data.month.toUpperCase(),
    mesMinusculo: data.month.toLowerCase(),
    ano: data.year,
    mesAno: data.labelText,
    mesAnoMaiusculo: data.labelText.toUpperCase(),
    mesAnoMinusculo: data.labelText.toLowerCase(),
  };

  template.schemas.flat().forEach((schema) => {
    if (!schema.name) return;
    const sourceName = getPrintFieldSourceName(schema.name);
    input[schema.name] = valuesByName[sourceName] ?? (schema.content ? String(schema.content) : data.labelText);
  });

  return input;
}

async function generateMonthPdf(detail: PrintTemplateDto, data: ReturnType<typeof getCurrentMonthPrintData>) {
  const template = parseTemplate(detail.templateJson);
  const printTemplate = expandTemplateColumns(template);
  const pdf = await generate({
    template: printTemplate,
    inputs: [buildMonthInput(printTemplate, data)],
    plugins: pdfPlugins,
  });

  return new Blob([pdf.buffer], { type: "application/pdf" });
}

async function listActiveMonthTemplates() {
  try {
    return await api.listPrintTemplatesByContext("MONTH_LABEL");
  } catch (cause) {
    if (!(cause instanceof ApiError)) throw cause;

    const templates = await api.listPrintTemplates();
    return templates.filter((template) => template.active && template.usageContext === "MONTH_LABEL");
  }
}

function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");

  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    window.setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  document.body.appendChild(iframe);
}

export function MonthPrintScreen() {
  const [templates, setTemplates] = useState<PrintTemplateListDto[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplateDto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrintData = useMemo(() => getCurrentMonthPrintData(), []);

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      setError(null);

      try {
        const activeTemplates = await listActiveMonthTemplates();
        setTemplates(activeTemplates);

        if (activeTemplates[0]) {
          const detail = await api.getPrintTemplate(String(activeTemplates[0].id));
          setSelectedTemplate(detail);
        }
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar os templates de mes.");
      } finally {
        setLoading(false);
      }
    }

    void loadTemplates();
  }, []);

  useEffect(() => {
    let revoked = false;

    async function updatePreview() {
      if (!selectedTemplate) {
        setPreviewUrl(null);
        return;
      }

      setLoadingPreview(true);
      setError(null);

      try {
        const blob = await generateMonthPdf(selectedTemplate, currentPrintData);
        const nextUrl = URL.createObjectURL(blob);

        if (revoked) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        setPreviewUrl((currentUrl) => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          return nextUrl;
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Nao foi possivel gerar o preview.");
      } finally {
        if (!revoked) setLoadingPreview(false);
      }
    }

    void updatePreview();

    return () => {
      revoked = true;
    };
  }, [currentPrintData, selectedTemplate]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function selectTemplate(item: PrintTemplateListDto) {
    setError(null);
    setLoadingPreview(true);

    try {
      const detail = await api.getPrintTemplate(String(item.id));
      setSelectedTemplate(detail);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel abrir o template.");
      setLoadingPreview(false);
    }
  }

  async function handlePrint() {
    if (!selectedTemplate) return;

    setPrinting(true);
    setError(null);

    try {
      const blob = await generateMonthPdf(selectedTemplate, currentPrintData);
      printPdfBlob(blob);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel imprimir a etiqueta.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <AppShell
      title="Impressao de mes"
      subtitle="Escolha um template ativo, confira o preview e envie somente a etiqueta para impressao."
      actions={
        <button className="btn btn--primary" type="button" disabled={!selectedTemplate || printing} onClick={handlePrint}>
          {printing ? "Gerando..." : "Imprimir"}
        </button>
      }
    >
      {error ? <div className="notice notice--error">{error}</div> : null}

      <section className="print-template-layout">
        <aside className="print-template-sidebar">
          <section className="panel print-template-card">
            <div className="section-heading">
              <div>
                <div className="kpi-label">templates</div>
                <h2>Etiquetas ativas</h2>
                <p>Templates liberados para impressao de mes.</p>
              </div>
            </div>

            {loading ? <div className="empty-state">Carregando templates...</div> : null}

            {!loading && templates.length === 0 ? (
              <div className="empty-state">Nenhum template ativo encontrado para etiqueta de mes.</div>
            ) : null}

            <div className="template-list">
              {templates.map((item) => (
                <button
                  key={item.id}
                  className="template-list__item"
                  data-active={selectedTemplate?.id === item.id}
                  type="button"
                  onClick={() => selectTemplate(item)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.description || `${item.widthMm ?? "-"} x ${item.heightMm ?? "-"} mm`}</span>
                  <span>{item.active ? "Ativo" : "Inativo"}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel print-template-card">
            <div className="section-heading">
              <div>
                <div className="kpi-label">dados</div>
                <h2>Mes impresso</h2>
                <p>{currentPrintData.labelText}</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="label-month">Mes</label>
                <input id="label-month" readOnly value={currentPrintData.month} />
              </div>

              <div className="field">
                <label htmlFor="label-year">Ano</label>
                <input id="label-year" readOnly value={currentPrintData.year} />
              </div>

              <div className="field field--span-2">
                <div className="notice">
                  Campos disponiveis: <strong>mes</strong>, <strong>mesMaiusculo</strong>, <strong>mesMinusculo</strong>,
                  <strong> ano</strong>, <strong>mesAno</strong>, <strong>mesAnoMaiusculo</strong> e
                  <strong> mesAnoMinusculo</strong>. Para negrito, use o componente <strong>BoldText</strong> no template.
                </div>
              </div>
            </div>
          </section>
        </aside>

        <section className="panel work-panel print-template-editor-panel">
          <div className="section-heading">
            <div>
              <div className="kpi-label">preview</div>
              <h2>{selectedTemplate?.name ?? "Nenhum template selecionado"}</h2>
              <p>A visualizacao abaixo usa os mesmos dados enviados para impressao.</p>
            </div>
          </div>

          <div className="month-print-preview">
            {loadingPreview ? <div className="empty-state">Gerando preview...</div> : null}
            {!loadingPreview && previewUrl ? <iframe title="Preview da etiqueta de mes" src={previewUrl} /> : null}
            {!loadingPreview && !previewUrl ? <div className="empty-state">Selecione um template para visualizar.</div> : null}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
