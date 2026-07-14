"use client";

import type { Template } from "@pdfme/common";
import { generate } from "@pdfme/generator";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { pdfPlugins } from "@/lib/pdfme";
import { expandTemplateColumns, getPrintFieldSourceName } from "@/lib/print-layout";
import { AppShell } from "@/components/admin/app-shell";
import type { PrintTemplateDto, PrintTemplateListDto, WoodProductFullDto, WoodProductVariationDto } from "@/types/api";

type WoodPrintRecord = {
  product: WoodProductFullDto;
  variation: WoodProductVariationDto;
};

function parseTemplate(templateJson: string) {
  return JSON.parse(templateJson) as Template;
}

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function buildWoodValues(record: WoodPrintRecord) {
  const { product, variation } = record;
  const price = variation.price ?? 0;
  const labelImageUrl = variation.labelImageUrl ?? "";

  return {
    "produto.id": asText(product.id),
    "produto.nome": product.name,
    "produto.descricao": product.description ?? "",
    "produto.caixa": product.caixa ?? "",
    "produto.tipoMadeira": product.woodType ?? "",
    "produto.acabamento": product.finish ?? "",
    "produto.espessuraMm": asText(product.thicknessMm),
    "produto.larguraMm": asText(product.widthMm),
    "produto.alturaMm": asText(product.heightMm),
    "produto.comprimentoMm": asText(product.lengthMm),
    "produto.pesoKg": asText(product.weightKg),
    "produto.imagem": product.imgUrl ?? "",
    "variacao.id": asText(variation.id),
    "variacao.descricao": variation.description ?? "",
    "variacao.cor": variation.color ?? "",
    "variacao.sku": asText(variation.sku),
    "variacao.ean": asText(variation.ean),
    "variacao.tamanho": variation.size ?? "",
    "variacao.preco": asText(price),
    "variacao.precoFormatado": formatCurrency(price),
    "variacao.etiqueta": labelImageUrl,
    etiqueta: labelImageUrl,
    sku: asText(variation.sku),
    ean: asText(variation.ean),
    nome: product.name,
    descricao: variation.description ?? product.description ?? "",
    caixa: product.caixa ?? "",
    cor: variation.color ?? "",
    tamanho: variation.size ?? "",
    preco: asText(price),
    precoFormatado: formatCurrency(price),
  };
}

function buildWoodInput(template: Template, record: WoodPrintRecord) {
  const input: Record<string, string> = {};
  const valuesByName: Record<string, string> = buildWoodValues(record);

  template.schemas.flat().forEach((schema) => {
    if (!schema.name) return;
    const sourceName = getPrintFieldSourceName(schema.name);
    input[schema.name] = valuesByName[sourceName] ?? (schema.content ? String(schema.content) : "");
  });

  return input;
}

async function generateWoodPdf(detail: PrintTemplateDto, record: WoodPrintRecord) {
  const template = parseTemplate(detail.templateJson);
  const printTemplate = expandTemplateColumns(template);
  const pdf = await generate({
    template: printTemplate,
    inputs: [buildWoodInput(printTemplate, record)],
    plugins: pdfPlugins,
  });

  return new Blob([pdf.buffer], { type: "application/pdf" });
}

async function listActiveWoodTemplates() {
  try {
    return await api.listPrintTemplatesByContext("WOOD");
  } catch (cause) {
    if (!(cause instanceof ApiError)) throw cause;

    const templates = await api.listPrintTemplates();
    return templates.filter((template) => template.active && template.usageContext === "WOOD");
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

function recordLabel(record: WoodPrintRecord) {
  return `${record.product.name} - SKU ${record.variation.sku ?? "-"}`;
}

export function WoodPrintScreen() {
  const [templates, setTemplates] = useState<PrintTemplateListDto[]>([]);
  const [records, setRecords] = useState<WoodPrintRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplateDto | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<WoodPrintRecord | null>(null);
  const [skuQuery, setSkuQuery] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const query = skuQuery.trim().toLowerCase();
    if (!query) return records.slice(0, 30);

    return records.filter((record) =>
      [
        record.variation.sku,
        record.variation.ean,
        record.product.name,
        record.variation.description,
        record.variation.color,
        record.variation.size,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [records, skuQuery]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);

      try {
        const [activeTemplates, productList] = await Promise.all([listActiveWoodTemplates(), api.listWoodProducts()]);
        const fullProducts = await Promise.all(productList.map((product) => api.getWoodProduct(String(product.id))));
        const nextRecords = fullProducts.flatMap((product) => product.variations.map((variation) => ({ product, variation })));

        setTemplates(activeTemplates);
        setRecords(nextRecords);
        setSelectedRecord(nextRecords[0] ?? null);

        if (activeTemplates[0]) {
          const detail = await api.getPrintTemplate(String(activeTemplates[0].id));
          setSelectedTemplate(detail);
        }
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar a impressao wood.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    let revoked = false;

    async function updatePreview() {
      if (!selectedTemplate || !selectedRecord) {
        setPreviewUrl(null);
        return;
      }

      setLoadingPreview(true);
      setError(null);

      try {
        const blob = await generateWoodPdf(selectedTemplate, selectedRecord);
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
  }, [selectedRecord, selectedTemplate]);

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
    if (!selectedTemplate || !selectedRecord) return;

    setPrinting(true);
    setError(null);

    try {
      const blob = await generateWoodPdf(selectedTemplate, selectedRecord);
      printPdfBlob(blob);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nao foi possivel imprimir a etiqueta wood.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <AppShell
      title="Impressao wood"
      subtitle="Escolha um template ativo, filtre a variacao por SKU e confira os dados enviados para a etiqueta."
      actions={
        <button className="btn btn--primary" type="button" disabled={!selectedTemplate || !selectedRecord || printing} onClick={handlePrint}>
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
                <p>Templates liberados para impressao wood.</p>
              </div>
            </div>

            {loading ? <div className="empty-state">Carregando templates...</div> : null}

            {!loading && templates.length === 0 ? (
              <div className="empty-state">Nenhum template ativo encontrado para wood.</div>
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
                <h2>Produto wood</h2>
                <p>{selectedRecord ? recordLabel(selectedRecord) : "Selecione uma variacao"}</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field field--span-2">
                <label htmlFor="wood-print-sku">Pesquisar por SKU</label>
                <input
                  id="wood-print-sku"
                  placeholder="Digite SKU, EAN, produto, cor ou tamanho"
                  value={skuQuery}
                  onChange={(event) => setSkuQuery(event.target.value)}
                />
              </div>

              <div className="field field--span-2">
                <div className="template-list">
                  {filteredRecords.map((record) => (
                    <button
                      key={`${record.product.id}-${record.variation.id}`}
                      className="template-list__item"
                      data-active={selectedRecord?.variation.id === record.variation.id}
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <strong>{record.product.name}</strong>
                      <span>
                        SKU {record.variation.sku ?? "-"} - EAN {record.variation.ean ?? "-"}
                      </span>
                      <span>{[record.variation.description, record.variation.color, record.variation.size].filter(Boolean).join(" / ") || "Sem atributos"}</span>
                    </button>
                  ))}
                </div>
                {!loading && filteredRecords.length === 0 ? <div className="empty-state">Nenhuma variacao encontrada.</div> : null}
              </div>

              <div className="field field--span-2">
                <div className="notice">
                  Campos principais: <strong>sku</strong>, <strong>ean</strong>, <strong>nome</strong>, <strong>descricao</strong>,
                  <strong> caixa</strong>, <strong>cor</strong>, <strong>tamanho</strong>, <strong>precoFormatado</strong>,
                  <strong> etiqueta</strong>, <strong>produto.nome</strong>, <strong>variacao.sku</strong> e
                  <strong> variacao.etiqueta</strong>.
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
              <p>A visualizacao abaixo usa a variacao wood selecionada.</p>
            </div>
          </div>

          <div className="month-print-preview">
            {loadingPreview ? <div className="empty-state">Gerando preview...</div> : null}
            {!loadingPreview && previewUrl ? <iframe title="Preview da etiqueta wood" src={previewUrl} /> : null}
            {!loadingPreview && !previewUrl ? <div className="empty-state">Selecione um template e uma variacao para visualizar.</div> : null}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
