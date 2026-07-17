/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { AppShell } from "@/components/admin/app-shell";
import type { WoodProductFullDto, WoodProductListDto, WoodProductVariationDto } from "@/types/api";

type Mode = "list" | "create" | "edit";

type ProductForm = {
  name: string;
  description: string;
  imgUrl: string;
  caixa: string;
  price: string;
  widthMm: string;
  heightMm: string;
  lengthMm: string;
  weightKg: string;
  active: boolean;
};

type VariationForm = {
  id: number | null;
  color: string;
  sku: string;
  ean: string;
  active: boolean;
};

const emptyProductForm: ProductForm = {
  name: "",
  description: "",
  imgUrl: "",
  caixa: "",
  price: "",
  widthMm: "",
  heightMm: "",
  lengthMm: "",
  weightKg: "",
  active: true,
};

const emptyVariationForm: VariationForm = {
  id: null,
  color: "",
  sku: "",
  ean: "",
  active: true,
};

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function productToForm(product: WoodProductFullDto): ProductForm {
  return {
    name: product.name,
    description: product.description ?? "",
    imgUrl: product.imgUrl ?? "",
    caixa: product.caixa ?? "",
    price: product.price?.toString() ?? "",
    widthMm: product.widthMm?.toString() ?? "",
    heightMm: product.heightMm?.toString() ?? "",
    lengthMm: product.lengthMm?.toString() ?? "",
    weightKg: product.weightKg?.toString() ?? "",
    active: product.active,
  };
}

function variationToForm(variation: WoodProductVariationDto): VariationForm {
  return {
    id: variation.id,
    color: variation.color ?? "",
    sku: variation.sku?.toString() ?? "",
    ean: variation.ean?.toString() ?? "",
    active: variation.active,
  };
}

function buildProductPayload(form: ProductForm) {
  return {
    name: form.name,
    description: form.description || null,
    imgUrl: form.imgUrl || null,
    caixa: form.caixa || null,
    price: optionalNumber(form.price),
    widthMm: optionalNumber(form.widthMm),
    heightMm: optionalNumber(form.heightMm),
    lengthMm: optionalNumber(form.lengthMm),
    weightKg: optionalNumber(form.weightKg),
    categoryIds: [],
    active: form.active,
  };
}

function buildVariationPayload(form: VariationForm) {
  return {
    color: form.color || null,
    sku: optionalNumber(form.sku),
    ean: optionalNumber(form.ean),
    listImgs: [],
    active: form.active,
  };
}

export function WoodProductScreen({ mode, id }: { mode: Mode; id?: string }) {
  if (mode === "list") {
    return <WoodProductListScreen />;
  }

  return <WoodProductFormScreen mode={mode} id={id} />;
}

function WoodProductListScreen() {
  const [items, setItems] = useState<WoodProductListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setItems(await api.listWoodProducts());
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar produtos wood.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const term = query.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term));
  }, [items, query]);

  async function handleDelete(productId: number) {
    const confirmed = window.confirm("Excluir este produto wood? Esta acao nao pode ser desfeita.");
    if (!confirmed) return;

    try {
      await api.deleteWoodProduct(String(productId));
      setItems((current) => current.filter((item) => item.id !== productId));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel excluir o produto wood.");
    }
  }

  return (
    <AppShell
      title="Produtos wood"
      subtitle="Cadastre produtos da linha madeira, embalagem caixa e variacoes com etiquetas personalizadas."
      actions={
        <>
          <input
            aria-label="Buscar produtos wood"
            placeholder="Buscar em produtos wood..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ minWidth: 220 }}
          />
          <span className="record-count">
            {filteredItems.length} de {items.length}
          </span>
          <Link className="btn btn--primary" href="/wood-products/new">
            Novo produto wood
          </Link>
        </>
      }
    >
      {error ? <div className="notice notice--error">{error}</div> : null}

      <section className="panel list-panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Caixa</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Carregando produtos wood...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhum produto wood encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="entity-cell">
                        {item.imgUrl ? <img src={item.imgUrl} alt="" /> : <span className="entity-cell__placeholder" />}
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td>{item.caixa || "Sem caixa"}</td>
                    <td>
                      {item.active ? <span className="badge badge--success">Ativo</span> : <span className="badge badge--danger">Inativo</span>}
                    </td>
                    <td>
                      <div className="toolbar">
                        <Link className="btn btn--ghost" href={`/wood-products/${item.id}`}>
                          Editar
                        </Link>
                        <button className="btn btn--danger" type="button" onClick={() => handleDelete(item.id)}>
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

function WoodProductFormScreen({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(emptyProductForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variationForm, setVariationForm] = useState<VariationForm>(emptyVariationForm);
  const [variationLabelFile, setVariationLabelFile] = useState<File | null>(null);
  const [product, setProduct] = useState<WoodProductFullDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variationSaving, setVariationSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (mode === "edit" && id) {
          const loadedProduct = await api.getWoodProduct(id);
          setProduct(loadedProduct);
          setForm(productToForm(loadedProduct));
          setImageFile(null);
        } else {
          setProduct(null);
          setForm(emptyProductForm);
          setImageFile(null);
        }
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar o produto wood.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, mode]);

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateVariationForm<K extends keyof VariationForm>(key: K, value: VariationForm[K]) {
    setVariationForm((current) => ({ ...current, [key]: value }));
  }

  function clearVariationForm() {
    setVariationForm(emptyVariationForm);
    setVariationLabelFile(null);
  }

  async function reloadProduct(productId: string) {
    const loadedProduct = await api.getWoodProduct(productId);
    setProduct(loadedProduct);
    setForm(productToForm(loadedProduct));
    setImageFile(null);
  }

  async function uploadPendingImage(productId: string) {
    if (imageFile) {
      await api.uploadWoodProductImage(productId, imageFile);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "edit" && id) {
        await api.updateWoodProduct(id, buildProductPayload(form));
        await uploadPendingImage(id);
        await reloadProduct(id);
        setSuccess("Produto wood atualizado com sucesso.");
      } else {
        const created = await api.createWoodProduct(buildProductPayload(form));
        await uploadPendingImage(String(created.id));
        router.push(`/wood-products/${created.id}`);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel salvar o produto wood.");
    } finally {
      setSaving(false);
    }
  }

  async function saveVariation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setVariationSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (variationForm.id) {
        const updatedVariation = await api.updateWoodVariation(id, String(variationForm.id), buildVariationPayload(variationForm));
        if (variationLabelFile) {
          await api.uploadWoodVariationLabel(id, String(updatedVariation.id), variationLabelFile);
        }
        setSuccess("Variacao atualizada com sucesso.");
      } else {
        const createdVariation = await api.createWoodVariation(id, buildVariationPayload(variationForm));
        if (variationLabelFile) {
          await api.uploadWoodVariationLabel(id, String(createdVariation.id), variationLabelFile);
        }
        setSuccess("Variacao criada com sucesso.");
      }

      clearVariationForm();
      await reloadProduct(id);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel salvar a variacao.");
    } finally {
      setVariationSaving(false);
    }
  }

  async function deleteVariation(variationId: number) {
    if (!id) return;
    const confirmed = window.confirm("Excluir esta variacao wood?");
    if (!confirmed) return;

    try {
      await api.deleteWoodVariation(id, String(variationId));
      await reloadProduct(id);
      setSuccess("Variacao excluida com sucesso.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel excluir a variacao.");
    }
  }

  async function uploadLabel(variationId: number, fileList: FileList | null) {
    if (!id) return;
    const file = fileList?.[0];
    if (!file) return;

    try {
      await api.uploadWoodVariationLabel(id, String(variationId), file);
      await reloadProduct(id);
      setSuccess("Etiqueta enviada com sucesso.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel enviar a etiqueta.");
    }
  }

  const selectedVariation = product?.variations.find((variation) => variation.id === variationForm.id) ?? null;
  const variationLabelPreview = variationLabelFile ? URL.createObjectURL(variationLabelFile) : selectedVariation?.labelImageUrl;

  return (
    <AppShell
      title={mode === "edit" ? "Editar produto wood" : "Novo produto wood"}
      subtitle="Cadastre dados comerciais, embalagem caixa, dimensoes e variacoes da linha madeira."
      actions={
        <>
          <Link className="btn btn--ghost" href="/wood-products">
            Voltar para produtos wood
          </Link>
          <button className="btn btn--primary" form="wood-product-form" type="submit" disabled={saving || loading}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      {error ? <div className="notice notice--error">{error}</div> : null}
      {success ? <div className="notice notice--success">{success}</div> : null}
      {mode === "create" ? (
        <div className="notice">
          Primeiro salve o produto wood. Depois o sistema abre a edicao, onde fica o cadastro de variacoes e o upload de etiqueta personalizada.
        </div>
      ) : null}

      <section className="panel" style={{ padding: "1.1rem" }}>
        {loading ? (
          <div className="empty-state">Carregando formulario...</div>
        ) : (
          <form id="wood-product-form" className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="wood-name">Nome</label>
              <input id="wood-name" required value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="wood-caixa">Caixa</label>
              <input id="wood-caixa" value={form.caixa} onChange={(event) => updateForm("caixa", event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="wood-price">Preco</label>
              <input
                id="wood-price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
              />
            </div>
            <div className="field field--span-2">
              <label htmlFor="wood-description">Descricao</label>
              <textarea id="wood-description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </div>
            <div className="field field--span-2">
              <label htmlFor="wood-img">Imagem do produto</label>
              <div className="asset-card">
                <div className="asset-card__header">
                  <strong>Foto principal</strong>
                  <span className="field__hint">O arquivo sera enviado ao backend e salvo no Cloudinary.</span>
                </div>
                <input id="wood-img" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
                {imageFile || form.imgUrl ? (
                  <img
                    className="asset-card__preview"
                    src={imageFile ? URL.createObjectURL(imageFile) : form.imgUrl}
                    alt="Preview da imagem do produto wood"
                  />
                ) : null}
              </div>
            </div>
            {[
              ["widthMm", "Largura (mm)"],
              ["heightMm", "Altura (mm)"],
              ["lengthMm", "Comprimento (mm)"],
              ["weightKg", "Peso (kg)"],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={`wood-${key}`}>{label}</label>
                <input
                  id={`wood-${key}`}
                  type="number"
                  step="0.01"
                  value={String(form[key as keyof ProductForm])}
                  onChange={(event) => updateForm(key as keyof ProductForm, event.target.value as never)}
                />
              </div>
            ))}
            <div className="field">
              <label>Status</label>
              <label className="checkbox-card">
                <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} />
                <span>
                  <strong>Produto ativo</strong>
                </span>
              </label>
            </div>
          </form>
        )}
      </section>

      {mode === "create" ? (
        <section className="panel work-panel">
          <div className="section-heading">
            <div>
              <div className="kpi-label">variacoes</div>
              <h2>Variações do produto</h2>
              <p>O cadastro de variacoes aparece assim que o produto wood for salvo.</p>
            </div>
          </div>
          <div className="empty-state">Salve o produto para liberar as variacoes.</div>
        </section>
      ) : null}

      {mode === "edit" && id ? (
        <section className="wood-product-grid">
          <div className="panel work-panel">
            <div className="section-heading">
              <div>
                <div className="kpi-label">variacoes</div>
                <h2>Variacoes cadastradas</h2>
                <p>Edite os atributos e envie a etiqueta personalizada da variacao.</p>
              </div>
            </div>

            {!product || product.variations.length === 0 ? <div className="empty-state">Nenhuma variacao cadastrada.</div> : null}

            <div className="wood-variation-list">
              {product?.variations.map((variation) => (
                <article className="wood-variation-card" key={variation.id}>
                  <div>
                    <strong>{variation.color || "Variacao sem cor"}</strong>
                    <div className="toolbar">
                      <span className="badge badge--muted">SKU {variation.sku ?? "-"}</span>
                      <span className="badge badge--muted">EAN {variation.ean ?? "-"}</span>
                    </div>
                  </div>
                  {variation.labelImageUrl ? <img src={variation.labelImageUrl} alt="Etiqueta personalizada" /> : null}
                  <div className="toolbar">
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => {
                        setVariationForm(variationToForm(variation));
                        setVariationLabelFile(null);
                      }}
                    >
                      Editar
                    </button>
                    <label className="btn btn--ghost">
                      Trocar etiqueta
                      <input hidden type="file" accept="image/*" onChange={(event) => uploadLabel(variation.id, event.target.files)} />
                    </label>
                    <button className="btn btn--danger" type="button" onClick={() => deleteVariation(variation.id)}>
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel work-panel">
            <div className="section-heading">
              <div>
                <div className="kpi-label">cadastro</div>
                <h2>{variationForm.id ? "Editar variacao" : "Nova variacao"}</h2>
              </div>
              {variationForm.id ? (
                <button className="btn btn--ghost" type="button" onClick={clearVariationForm}>
                  Limpar
                </button>
              ) : null}
            </div>

            <form className="form-grid form-grid--single" onSubmit={saveVariation}>
              <div className="field">
                <label htmlFor="variation-color">Cor</label>
                <input id="variation-color" value={variationForm.color} onChange={(event) => updateVariationForm("color", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="variation-sku">SKU</label>
                <input id="variation-sku" type="number" value={variationForm.sku} onChange={(event) => updateVariationForm("sku", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="variation-ean">EAN</label>
                <input id="variation-ean" type="number" value={variationForm.ean} onChange={(event) => updateVariationForm("ean", event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="variation-label">Etiqueta</label>
                <div className="asset-card">
                  <div className="asset-card__header">
                    <strong>Imagem da etiqueta</strong>
                    <span className="field__hint">O arquivo sera enviado ao backend e salvo no Cloudinary.</span>
                  </div>
                  <input id="variation-label" type="file" accept="image/*" onChange={(event) => setVariationLabelFile(event.target.files?.[0] ?? null)} />
                  {variationLabelPreview ? <img className="asset-card__preview" src={variationLabelPreview} alt="Preview da etiqueta" /> : null}
                </div>
              </div>
              <label className="checkbox-card">
                <input type="checkbox" checked={variationForm.active} onChange={(event) => updateVariationForm("active", event.target.checked)} />
                <span>
                  <strong>Variacao ativa</strong>
                </span>
              </label>
              <button className="btn btn--primary" type="submit" disabled={variationSaving}>
                {variationSaving ? "Salvando..." : variationForm.id ? "Salvar variacao" : "Criar variacao"}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
