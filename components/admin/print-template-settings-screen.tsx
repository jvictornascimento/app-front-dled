"use client";

import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { image, multiVariableText, text, barcodes, table, line, rectangle, ellipse } from "@pdfme/schemas";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { AppShell } from "@/components/admin/app-shell";
import { PdfmeDesigner } from "@/components/admin/pdfme-designer";
import type { PrintTemplateDto, PrintTemplateListDto, PrintTemplatePayload, PrintTemplateUsageContext } from "@/types/api";

const usageContextOptions: Array<{ value: PrintTemplateUsageContext; label: string }> = [
  { value: "PRINTS_MENU", label: "Menu de impressoes" },
  { value: "PRODUCT", label: "Produto" },
  { value: "ORDER", label: "Pedido" },
  { value: "MONTH_LABEL", label: "Etiqueta de mes" },
  { value: "REPORT", label: "Relatorio" },
];

const pdfPlugins = {
  Text: text,
  MultiVariableText: multiVariableText,
  Image: image,
  QRCode: barcodes.qrcode,
  Code128: barcodes.code128,
  Table: table,
  Line: line,
  Rectangle: rectangle,
  Ellipse: ellipse,
};

const defaultTemplate: Template = {
  basePdf: { width: 25, height: 33, padding: [0, 0, 0, 0] },
  schemas: [
    [
      {
        name: "mesAno",
        type: "text",
        position: { x: 1.5, y: 13 },
        width: 22,
        height: 6,
        fontSize: 13,
        alignment: "center",
        verticalAlignment: "middle",
        required: true,
      },
    ],
  ],
};

function stringifyTemplate(template: Template) {
  return JSON.stringify(template);
}

function parseTemplate(templateJson: string) {
  return JSON.parse(templateJson) as Template;
}

function getTemplateSize(template: Template) {
  if (typeof template.basePdf === "object" && "width" in template.basePdf && "height" in template.basePdf) {
    return {
      widthMm: template.basePdf.width,
      heightMm: template.basePdf.height,
    };
  }

  return {
    widthMm: null,
    heightMm: null,
  };
}

function buildSampleInput(template: Template) {
  const input: Record<string, string> = {};

  template.schemas.flat().forEach((schema) => {
    if (!schema.name) return;
    input[schema.name] = schema.name === "mesAno" ? "julho/2026" : schema.content ? String(schema.content) : schema.name;
  });

  return input;
}

function buildPayload(form: {
  name: string;
  description: string;
  usageContext: PrintTemplateUsageContext;
  active: boolean;
  template: Template;
}): PrintTemplatePayload {
  const size = getTemplateSize(form.template);

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    usageContext: form.usageContext,
    active: form.active,
    templateJson: stringifyTemplate(form.template),
    widthMm: size.widthMm,
    heightMm: size.heightMm,
  };
}

export function PrintTemplateSettingsScreen() {
  const [templates, setTemplates] = useState<PrintTemplateListDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("Etiqueta de mes");
  const [description, setDescription] = useState("Etiqueta mensal 25x33mm");
  const [usageContext, setUsageContext] = useState<PrintTemplateUsageContext>("PRINTS_MENU");
  const [active, setActive] = useState(true);
  const [template, setTemplate] = useState<Template>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const size = useMemo(() => getTemplateSize(template), [template]);

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await api.listPrintTemplates());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar os templates.");
    } finally {
      setLoading(false);
    }
  }

  function startNewTemplate() {
    setSelectedId(null);
    setName("Etiqueta de mes");
    setDescription("Etiqueta mensal 25x33mm");
    setUsageContext("PRINTS_MENU");
    setActive(true);
    setTemplate(defaultTemplate);
    setSuccess(null);
    setError(null);
  }

  async function selectTemplate(item: PrintTemplateListDto) {
    setError(null);
    setSuccess(null);
    try {
      const detail = await api.getPrintTemplate(String(item.id));
      applyTemplate(detail);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel abrir o template.");
    }
  }

  function applyTemplate(detail: PrintTemplateDto) {
    setSelectedId(detail.id);
    setName(detail.name);
    setDescription(detail.description ?? "");
    setUsageContext(detail.usageContext);
    setActive(detail.active);
    setTemplate(parseTemplate(detail.templateJson));
  }

  async function saveTemplate() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = buildPayload({ name, description, usageContext, active, template });
      const saved = selectedId
        ? await api.updatePrintTemplate(String(selectedId), payload)
        : await api.createPrintTemplate(payload);

      applyTemplate(saved);
      await loadTemplates();
      setSuccess("Template salvo com sucesso.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel salvar o template.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate() {
    if (!selectedId) return;
    const confirmed = window.confirm("Excluir este template? Esta acao nao pode ser desfeita.");
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    try {
      await api.deletePrintTemplate(String(selectedId));
      await loadTemplates();
      startNewTemplate();
      setSuccess("Template excluido com sucesso.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel excluir o template.");
    }
  }

  async function previewPdf() {
    setError(null);
    try {
      const pdf = await generate({
        template,
        inputs: [buildSampleInput(template)],
        plugins: pdfPlugins,
      });
      const blob = new Blob([pdf.buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel gerar o PDF.");
    }
  }

  return (
    <AppShell
      title="Templates de impressao"
      subtitle="Crie e edite modelos PDF para etiquetas e relatorios. Os templates salvos ficam disponiveis nos locais definidos pelo contexto de uso."
      actions={
        <>
          <button className="btn btn--ghost" type="button" onClick={startNewTemplate}>
            Novo template
          </button>
          <button className="btn btn--ghost" type="button" onClick={previewPdf}>
            Preview PDF
          </button>
          <button className="btn btn--primary" type="button" disabled={saving} onClick={saveTemplate}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      {error ? <div className="notice notice--error">{error}</div> : null}
      {success ? <div className="notice notice--success">{success}</div> : null}

      <section className="print-template-layout">
        <aside className="panel print-template-list">
          <div className="section-heading">
            <div>
              <div className="kpi-label">templates</div>
              <h2>Modelos salvos</h2>
            </div>
          </div>

          {loading ? <div className="empty-state">Carregando templates...</div> : null}

          {!loading && templates.length === 0 ? <div className="empty-state">Nenhum template cadastrado.</div> : null}

          <div className="template-list">
            {templates.map((item) => (
              <button
                key={item.id}
                className="template-list__item"
                data-active={selectedId === item.id}
                type="button"
                onClick={() => selectTemplate(item)}
              >
                <strong>{item.name}</strong>
                <span>{usageContextOptions.find((option) => option.value === item.usageContext)?.label ?? item.usageContext}</span>
                <span>{item.active ? "Ativo" : "Inativo"}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="print-template-workspace">
          <section className="panel work-panel">
            <div className="section-heading">
              <div>
                <div className="kpi-label">configuracao</div>
                <h2>{selectedId ? "Editar template" : "Novo template"}</h2>
                <p>
                  Tamanho atual: {size.widthMm ?? "-"} x {size.heightMm ?? "-"} mm
                </p>
              </div>
              {selectedId ? (
                <button className="btn btn--danger" type="button" onClick={deleteTemplate}>
                  Excluir
                </button>
              ) : null}
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="template-name">Nome</label>
                <input id="template-name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="template-context">Contexto de uso</label>
                <select
                  id="template-context"
                  value={usageContext}
                  onChange={(event) => setUsageContext(event.target.value as PrintTemplateUsageContext)}
                >
                  {usageContextOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field--span-2">
                <label htmlFor="template-description">Descricao</label>
                <input
                  id="template-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <label className="checkbox-card field--span-2">
                <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
                <span>
                  <strong>Template ativo</strong>
                  <span className="field__hint" style={{ display: "block", marginTop: "0.2rem" }}>
                    Templates inativos ficam salvos, mas nao aparecem nos fluxos comuns de impressao.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="panel work-panel">
            <div className="section-heading">
              <div>
                <div className="kpi-label">designer</div>
                <h2>Editor visual pdfme</h2>
                <p>Edite campos, posicoes e tamanho da etiqueta no designer. Use Preview PDF para validar o resultado real.</p>
              </div>
            </div>
            <PdfmeDesigner template={template} onChange={setTemplate} />
          </section>
        </div>
      </section>
    </AppShell>
  );
}
