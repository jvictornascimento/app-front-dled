"use client";

import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { pdfPlugins } from "@/lib/pdfme";
import { AppShell } from "@/components/admin/app-shell";
import { PdfmeDesigner, type PdfmeDesignerHandle } from "@/components/admin/pdfme-designer";
import type { PrintTemplateDto, PrintTemplateListDto, PrintTemplatePayload, PrintTemplateUsageContext } from "@/types/api";

const usageContextOptions: Array<{ value: PrintTemplateUsageContext; label: string }> = [
  { value: "PRINTS_MENU", label: "Menu de impressoes" },
  { value: "PRODUCT", label: "Produto" },
  { value: "ORDER", label: "Pedido" },
  { value: "MONTH_LABEL", label: "Etiqueta de mes" },
  { value: "REPORT", label: "Relatorio" },
];

const templateVariableGroups = [
  {
    title: "Mes",
    variables: [
      { name: "mes", description: "Nome do mes atual" },
      { name: "mesMaiusculo", description: "Mes atual em maiusculo" },
      { name: "mesMinusculo", description: "Mes atual em minusculo" },
      { name: "ano", description: "Ano atual" },
      { name: "mesAno", description: "Mes e ano" },
      { name: "mesAnoMaiusculo", description: "Mes e ano em maiusculo" },
      { name: "mesAnoMinusculo", description: "Mes e ano em minusculo" },
    ],
  },
  {
    title: "Data e hora",
    variables: [
      { name: "dataAtual", description: "Data atual" },
      { name: "horaAtual", description: "Hora atual" },
      { name: "dataHoraAtual", description: "Data e hora atual" },
    ],
  },
  {
    title: "Pedido",
    variables: [
      { name: "pedido.id", description: "Identificador do pedido" },
      { name: "pedido.codigo", description: "Codigo do pedido" },
      { name: "pedido.numero", description: "Numero do pedido" },
      { name: "pedido.data", description: "Data do pedido" },
      { name: "pedido.valorTotal", description: "Valor total" },
      { name: "pedido.status", description: "Status do pedido" },
      { name: "pedido.lote", description: "Lote informado" },
    ],
  },
  {
    title: "Itens",
    variables: [
      { name: "item.id", description: "Identificador do item" },
      { name: "item.productId", description: "Produto informado" },
      { name: "item.nome", description: "Nome do produto" },
      { name: "item.descricao", description: "Descricao do produto" },
      { name: "item.codigo", description: "Codigo do produto" },
      { name: "item.sku", description: "SKU" },
      { name: "item.ean", description: "EAN" },
      { name: "item.quantidade", description: "Quantidade" },
      { name: "item.valor", description: "Valor unitario" },
    ],
  },
  {
    title: "Empresa propria",
    variables: [
      { name: "empresa.id", description: "Identificador da empresa" },
      { name: "empresa.nome", description: "Nome fantasia" },
      { name: "empresa.razaoSocial", description: "Razao social" },
      { name: "empresa.documento", description: "CNPJ ou CPF" },
      { name: "empresa.telefone", description: "Telefone" },
      { name: "empresa.email", description: "E-mail" },
      { name: "empresa.endereco", description: "Endereco completo" },
    ],
  },
];

const sampleVariables: Record<string, string> = {
  mes: "julho",
  mesMaiusculo: "JULHO",
  mesMinusculo: "julho",
  ano: "2026",
  mesAno: "julho/2026",
  mesAnoMaiusculo: "JULHO/2026",
  mesAnoMinusculo: "julho/2026",
  dataAtual: "13/07/2026",
  horaAtual: "14:30",
  dataHoraAtual: "13/07/2026 14:30",
  "pedido.id": "1024",
  "pedido.codigo": "PED-1024",
  "pedido.numero": "1024",
  "pedido.data": "13/07/2026",
  "pedido.valorTotal": "R$ 189,90",
  "pedido.status": "Em producao",
  "pedido.lote": "Lote A-07",
  "item.id": "88",
  "item.productId": "345",
  "item.nome": "Produto exemplo",
  "item.descricao": "Descricao do produto",
  "item.codigo": "PRD-345",
  "item.sku": "SKU-345",
  "item.ean": "7890000000000",
  "item.quantidade": "2",
  "item.valor": "R$ 94,95",
  "empresa.id": "1",
  "empresa.nome": "DLED",
  "empresa.razaoSocial": "DLED Comercio Ltda",
  "empresa.documento": "00.000.000/0001-00",
  "empresa.telefone": "(00) 0000-0000",
  "empresa.email": "contato@empresa.com",
  "empresa.endereco": "Rua Exemplo, 100",
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

type PrintLayoutConfig = {
  columns: number;
  pageWidthMm: number;
  pageHeightMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
};

type TemplateWithPrintLayout = Template & {
  meta?: {
    printLayout?: Partial<PrintLayoutConfig>;
    [key: string]: unknown;
  };
};

const defaultPrintLayout: PrintLayoutConfig = {
  columns: 1,
  pageWidthMm: 25,
  pageHeightMm: 33,
  labelWidthMm: 25,
  labelHeightMm: 33,
};

function clampColumns(value: unknown) {
  const columns = Number(value) || defaultPrintLayout.columns;
  return Math.min(4, Math.max(1, columns));
}

function createPrintLayoutConfig({
  columns,
  pageWidthMm,
  pageHeightMm,
}: {
  columns: number;
  pageWidthMm: number;
  pageHeightMm: number;
}): PrintLayoutConfig {
  const normalizedColumns = clampColumns(columns);
  const normalizedPageWidth = Number(pageWidthMm) > 0 ? Number(pageWidthMm) : defaultPrintLayout.pageWidthMm;
  const normalizedPageHeight = Number(pageHeightMm) > 0 ? Number(pageHeightMm) : defaultPrintLayout.pageHeightMm;

  return {
    columns: normalizedColumns,
    pageWidthMm: normalizedPageWidth,
    pageHeightMm: normalizedPageHeight,
    labelWidthMm: normalizedPageWidth / normalizedColumns,
    labelHeightMm: normalizedPageHeight,
  };
}

function createDefaultTemplate() {
  return structuredClone(defaultTemplate);
}

function getPrintLayoutConfig(template: Template): PrintLayoutConfig {
  const printLayout = (template as TemplateWithPrintLayout).meta?.printLayout;
  const size = getTemplateSize(template);
  const columns = clampColumns(printLayout?.columns);
  const pageWidthMm =
    Number(printLayout?.pageWidthMm) ||
    (Number(printLayout?.labelWidthMm) ? Number(printLayout?.labelWidthMm) * columns : 0) ||
    (Number(size.widthMm) ? Number(size.widthMm) * columns : 0) ||
    defaultPrintLayout.pageWidthMm;
  const pageHeightMm =
    Number(printLayout?.pageHeightMm) ||
    Number(printLayout?.labelHeightMm) ||
    Number(size.heightMm) ||
    defaultPrintLayout.pageHeightMm;

  return createPrintLayoutConfig({ columns, pageWidthMm, pageHeightMm });
}

function withPrintLayoutConfig(template: Template, printLayout: PrintLayoutConfig): Template {
  const currentMeta = (template as TemplateWithPrintLayout).meta ?? {};
  const currentBasePdf =
    typeof template.basePdf === "object" && "width" in template.basePdf && "height" in template.basePdf
      ? template.basePdf
      : { width: defaultPrintLayout.labelWidthMm, height: defaultPrintLayout.labelHeightMm, padding: [0, 0, 0, 0] };

  return {
    ...template,
    basePdf: {
      ...currentBasePdf,
      width: printLayout.labelWidthMm,
      height: printLayout.labelHeightMm,
    },
    meta: {
      ...currentMeta,
      printLayout,
    },
  } as Template;
}

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
    input[schema.name] = sampleVariables[schema.name] ?? (schema.content ? String(schema.content) : schema.name);
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
  const printLayout = getPrintLayoutConfig(form.template);

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    usageContext: form.usageContext,
    active: form.active,
    templateJson: stringifyTemplate(form.template),
    widthMm: printLayout.pageWidthMm,
    heightMm: printLayout.pageHeightMm,
  };
}

export function PrintTemplateSettingsScreen() {
  const designerRef = useRef<PdfmeDesignerHandle | null>(null);
  const [templates, setTemplates] = useState<PrintTemplateListDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("Etiqueta de mes");
  const [description, setDescription] = useState("Etiqueta mensal 25x33mm");
  const [usageContext, setUsageContext] = useState<PrintTemplateUsageContext>("PRINTS_MENU");
  const [active, setActive] = useState(true);
  const [template, setTemplate] = useState<Template>(() => createDefaultTemplate());
  const [printLayout, setPrintLayout] = useState<PrintLayoutConfig>(() => getPrintLayoutConfig(createDefaultTemplate()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const size = useMemo(() => getTemplateSize(template), [template]);

  function getCurrentTemplate() {
    const currentTemplate = withPrintLayoutConfig(designerRef.current?.getTemplate() ?? template, printLayout);
    setTemplate(currentTemplate);
    return currentTemplate;
  }

  function updatePrintLayout(nextPrintLayout: Partial<PrintLayoutConfig>) {
    const mergedPrintLayout = createPrintLayoutConfig({
      columns: nextPrintLayout.columns ?? printLayout.columns,
      pageWidthMm: nextPrintLayout.pageWidthMm ?? printLayout.pageWidthMm,
      pageHeightMm: nextPrintLayout.pageHeightMm ?? printLayout.pageHeightMm,
    });

    setPrintLayout(mergedPrintLayout);
    setTemplate(withPrintLayoutConfig(designerRef.current?.getTemplate() ?? template, mergedPrintLayout));
  }

  function updatePageSize(field: "pageWidthMm" | "pageHeightMm", rawValue: string) {
    const value = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;

    updatePrintLayout({ [field]: value });
  }

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
    const nextTemplate = createDefaultTemplate();
    const nextPrintLayout = getPrintLayoutConfig(nextTemplate);

    setSelectedId(null);
    setName("Etiqueta de mes");
    setDescription("Etiqueta mensal 25x33mm");
    setUsageContext("PRINTS_MENU");
    setActive(true);
    setPrintLayout(nextPrintLayout);
    setTemplate(withPrintLayoutConfig(nextTemplate, nextPrintLayout));
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
    const nextTemplate = parseTemplate(detail.templateJson);
    const nextPrintLayout = getPrintLayoutConfig(nextTemplate);
    setPrintLayout(nextPrintLayout);
    setTemplate(withPrintLayoutConfig(nextTemplate, nextPrintLayout));
  }

  async function saveTemplate() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const currentTemplate = getCurrentTemplate();
      const payload = buildPayload({ name, description, usageContext, active, template: currentTemplate });
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
      const currentTemplate = getCurrentTemplate();
      const pdf = await generate({
        template: currentTemplate,
        inputs: [buildSampleInput(currentTemplate)],
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
        <aside className="panel print-template-sidebar">
          <section className="print-template-card">
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
          </section>

          <section className="print-template-card">
            <div className="section-heading">
              <div>
                <div className="kpi-label">configuracoes</div>
                <h2>{selectedId ? "Editar modelo" : "Novo modelo"}</h2>
                <p>
                  Etiqueta no editor: {size.widthMm ? size.widthMm.toFixed(1) : "-"} x{" "}
                  {size.heightMm ? size.heightMm.toFixed(1) : "-"} mm
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

              <div className="field">
                <label htmlFor="template-width">Largura da pagina (mm)</label>
                <input
                  id="template-width"
                  min="1"
                  step="0.1"
                  type="number"
                  value={printLayout.pageWidthMm}
                  onChange={(event) => updatePageSize("pageWidthMm", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="template-height">Altura da pagina (mm)</label>
                <input
                  id="template-height"
                  min="1"
                  step="0.1"
                  type="number"
                  value={printLayout.pageHeightMm}
                  onChange={(event) => updatePageSize("pageHeightMm", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="template-columns">Colunas</label>
                <select
                  id="template-columns"
                  value={printLayout.columns}
                  onChange={(event) => updatePrintLayout({ columns: Number(event.target.value) })}
                >
                  {[1, 2, 3, 4].map((columns) => (
                    <option key={columns} value={columns}>
                      {columns}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </section>

          <section className="print-template-card">
            <div className="section-heading">
              <div>
                <div className="kpi-label">variaveis</div>
                <h2>Campos disponiveis</h2>
                <p>Use o valor no nome do campo dentro do editor.</p>
              </div>
            </div>

            <div className="variable-groups">
              {templateVariableGroups.map((group) => (
                <details key={group.title} className="variable-group" open={group.title === "Mes"}>
                  <summary>{group.title}</summary>
                  <div className="variable-list">
                    {group.variables.map((variable) => (
                      <button
                        key={variable.name}
                        className="variable-item"
                        type="button"
                        title="Copiar variavel"
                        onClick={() => void navigator.clipboard?.writeText(variable.name)}
                      >
                        <code>{variable.name}</code>
                        <span>{variable.description}</span>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </aside>

        <div className="print-template-workspace">
          <section className="panel work-panel print-template-editor-panel">
            <div className="section-heading">
              <div>
                <div className="kpi-label">editor visual</div>
                <h2>Modelo de impressao</h2>
                <p>Edite campos, posicoes e tamanho da etiqueta. Use Preview PDF para validar o resultado real.</p>
              </div>
            </div>
            <PdfmeDesigner ref={designerRef} template={template} onChange={setTemplate} />
          </section>
        </div>
      </section>
    </AppShell>
  );
}
