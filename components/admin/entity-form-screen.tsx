/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  flattenCategoryOptions,
  getEntityDefinition,
  getUserFieldsForMode,
  type EntityKey,
  type FormField,
  type FormValues,
  type SelectOption,
} from "@/lib/admin-config";
import { api, ApiError } from "@/lib/api";
import { AppShell } from "@/components/admin/app-shell";

type Mode = "create" | "edit";

function renderCheckboxCard(
  field: FormField,
  checked: boolean,
  onChange: (value: boolean) => void,
) {
  return (
    <label className="checkbox-card">
      <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>
        <strong>{field.label}</strong>
        {field.helpText ? <span className="field__hint" style={{ display: "block", marginTop: "0.2rem" }}>{field.helpText}</span> : null}
      </span>
    </label>
  );
}

interface ProductAssetState {
  mainFile: File | null;
  iconFile: File | null;
  galleryFiles: File[];
  existingMainUrl: string | null;
  existingIconUrl: string | null;
  existingGalleryUrls: string[];
}

function ProductImageUploads({
  assets,
  onChange,
}: {
  assets: ProductAssetState;
  onChange: (nextAssets: ProductAssetState) => void;
}) {
  const mainPreview = assets.mainFile ? URL.createObjectURL(assets.mainFile) : assets.existingMainUrl;
  const iconPreview = assets.iconFile ? URL.createObjectURL(assets.iconFile) : assets.existingIconUrl;
  const galleryPreviewUrls = assets.galleryFiles.map((file) => URL.createObjectURL(file));

  function replaceMain(fileList: FileList | null) {
    onChange({
      ...assets,
      mainFile: fileList?.[0] ?? null,
    });
  }

  function replaceIcon(fileList: FileList | null) {
    onChange({
      ...assets,
      iconFile: fileList?.[0] ?? null,
    });
  }

  function addGallery(fileList: FileList | null) {
    const nextFiles = fileList ? Array.from(fileList) : [];
    onChange({
      ...assets,
      galleryFiles: [...assets.galleryFiles, ...nextFiles].slice(0, 5),
    });
  }

  function removeGallery(fileIndex: number) {
    onChange({
      ...assets,
      galleryFiles: assets.galleryFiles.filter((_, currentIndex) => currentIndex !== fileIndex),
    });
  }

  return (
    <div className="field field--span-2">
      <label>Arquivos do produto</label>
      <div className="asset-grid">
        <div className="asset-card">
          <div className="asset-card__header">
            <strong>Foto principal</strong>
            <span className="field__hint">Enviada ao backend apenas no salvar.</span>
          </div>
          <input type="file" accept="image/*" onChange={(event) => replaceMain(event.target.files)} />
          {mainPreview ? <img className="asset-card__preview" src={mainPreview} alt="Preview da foto principal" /> : null}
        </div>

        <div className="asset-card">
          <div className="asset-card__header">
            <strong>Icone do produto</strong>
            <span className="field__hint">Usado em listagens e cards.</span>
          </div>
          <input type="file" accept="image/*" onChange={(event) => replaceIcon(event.target.files)} />
          {iconPreview ? <img className="asset-card__preview" src={iconPreview} alt="Preview do icone do produto" /> : null}
        </div>
      </div>

      <div className="asset-card" style={{ marginTop: "0.8rem" }}>
        <div className="asset-card__header">
          <strong>Galeria</strong>
          <span className="field__hint">Adicione ate 5 imagens; o envio ocorre em lote quando salvar o produto.</span>
        </div>
        <input type="file" accept="image/*" multiple onChange={(event) => addGallery(event.target.files)} />
        {assets.existingGalleryUrls.length > 0 ? (
          <div className="gallery-preview-grid" style={{ marginBottom: "0.8rem" }}>
            {assets.existingGalleryUrls.map((url, index) => (
              <div className="gallery-preview-item" key={`saved-${url}-${index}`}>
                <img src={url} alt={`Imagem atual da galeria ${index + 1}`} />
                <span className="badge badge--muted">Ja salva</span>
              </div>
            ))}
          </div>
        ) : null}
        {galleryPreviewUrls.length > 0 ? (
          <div className="gallery-preview-grid">
            {galleryPreviewUrls.map((url, index) => (
              <div className="gallery-preview-item" key={`${url}-${index}`}>
                <img src={url} alt={`Preview da galeria ${index + 1}`} />
                <button type="button" onClick={() => removeGallery(index)}>
                  X
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AsyncCategorySelector({
  field,
  selected,
  baseOptions,
  onChange,
}: {
  field: FormField;
  selected: string[];
  baseOptions: SelectOption[];
  onChange: (nextValue: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMap = useMemo(() => {
    const map = new Map<string, SelectOption>();
    [...baseOptions, ...results].forEach((option) => {
      map.set(option.value, option);
    });
    return map;
  }, [baseOptions, results]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);

      try {
        const tree = await api.listCategoriesTree();
        const options = flattenCategoryOptions(tree);
        const normalizedQuery = query.trim().toLowerCase();
        const filtered = options
          .filter((option) => option.label.toLowerCase().includes(normalizedQuery))
          .filter((option) => !selected.includes(option.value))
          .slice(0, 10);

        setResults(filtered);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query, selected]);

  function handleSelect(option: SelectOption) {
    if (selected.includes(option.value)) {
      return;
    }

    onChange([...selected, option.value]);
    setQuery("");
    setResults([]);
  }

  function handleRemove(value: string) {
    onChange(selected.filter((item) => item !== value));
  }

  return (
    <div className="field field--span-2">
      <label htmlFor={field.name}>{field.label}</label>
      <div className="tag-selector">
        <div className="tag-selector__selected">
          {selected.length === 0 ? (
            <span className="tag-selector__placeholder">Nenhuma categoria adicionada.</span>
          ) : (
            selected.map((value) => {
              const option = selectedMap.get(value);
              return (
                <span key={value} className="tag-chip">
                  <span>{option?.label ?? `Categoria #${value}`}</span>
                  <button type="button" aria-label={`Remover categoria ${option?.label ?? value}`} onClick={() => handleRemove(value)}>
                    X
                  </button>
                </span>
              );
            })
          )}
        </div>

        <input
          id={field.name}
          placeholder={field.placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />

        {query.trim().length > 0 && query.trim().length < 3 ? (
          <span className="field__hint">Continue digitando para buscar categorias a partir da terceira letra.</span>
        ) : null}

        {loading ? <span className="field__hint">Buscando categorias...</span> : null}

        {results.length > 0 ? (
          <div className="tag-selector__results">
            {results.map((option) => (
              <button key={option.value} type="button" className="tag-selector__result" onClick={() => handleSelect(option)}>
                <strong>{option.label}</strong>
                <span>{option.note ?? "Selecionar categoria"}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {field.helpText ? <span className="field__hint">{field.helpText}</span> : null}
    </div>
  );
}

export function EntityFormScreen({
  entityKey,
  mode,
  id,
}: {
  entityKey: EntityKey;
  mode: Mode;
  id?: string;
}) {
  const router = useRouter();
  const entity = getEntityDefinition(entityKey);
  const [values, setValues] = useState<FormValues>({});
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productAssets, setProductAssets] = useState<ProductAssetState>({
    mainFile: null,
    iconFile: null,
    galleryFiles: [],
    existingMainUrl: null,
    existingIconUrl: null,
    existingGalleryUrls: [],
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loadedOptions = entity.loadOptions ? await entity.loadOptions() : {};
        const loadedItem = mode === "edit" && id ? await entity.getOne(id) : null;
        const nextValues = loadedItem
          ? entity.mapToValues(loadedItem, loadedOptions)
          : entity.getDefaultValues(loadedOptions);

        if (entityKey === "products" && loadedItem) {
          const product = loadedItem;
          setProductAssets({
            mainFile: null,
            iconFile: null,
            galleryFiles: [],
            existingMainUrl: (product.imgUrl as string | null) ?? null,
            existingIconUrl: (product.iconUrl as string | null) ?? null,
            existingGalleryUrls:
              ((product.galleryImages as { imageUrl?: string }[] | undefined) ?? [])
                .map((item) => item.imageUrl)
                .filter((value): value is string => Boolean(value)),
          });
        } else if (entityKey === "products") {
          setProductAssets({
            mainFile: null,
            iconFile: null,
            galleryFiles: [],
            existingMainUrl: null,
            existingIconUrl: null,
            existingGalleryUrls: [],
          });
        }

        setOptions(loadedOptions);
        setValues(nextValues);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar o formulario.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [entity, entityKey, id, mode]);

  const fields = useMemo(() => {
    if (entityKey === "users") {
      return getUserFieldsForMode(mode);
    }

    return entity.getFields(options);
  }, [entity, entityKey, mode, options]);

  function setFieldValue(name: string, nextValue: string | boolean | string[]) {
    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }));
  }

  async function uploadPendingProductAssets(productId: string) {
    if (entityKey !== "products") {
      return;
    }

    if (productAssets.mainFile) {
      await api.uploadProductMainImage(productId, productAssets.mainFile);
    }

    if (productAssets.iconFile) {
      await api.uploadProductIconImage(productId, productAssets.iconFile);
    }

    for (const file of productAssets.galleryFiles) {
      await api.uploadProductGalleryImage(productId, file);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = entity.buildPayload(values);
      if (mode === "edit" && id) {
        await entity.update(id, payload);
        await uploadPendingProductAssets(id);
        setSuccess(`${entity.singularLabel} atualizado com sucesso.`);
      } else {
        const created = (await entity.create(payload)) as { id?: number | string };
        if (entityKey === "products" && created?.id !== undefined) {
          await uploadPendingProductAssets(String(created.id));
        }
        setSuccess(`${entity.singularLabel} criado com sucesso.`);
        router.push(entity.route);
        return;
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Nao foi possivel salvar o registro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title={mode === "edit" ? `Editar ${entity.singularLabel}` : `Novo ${entity.singularLabel}`}
      subtitle={entity.formDescription}
      actions={
        <>
          <Link className="btn btn--ghost" href={entity.route}>
            Voltar para {entity.label.toLowerCase()}
          </Link>
          <button className="btn btn--primary" form="entity-form" type="submit" disabled={saving || loading}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      {entity.note ? <div className="notice">{entity.note}</div> : null}
      {error ? <div className="notice notice--error">{error}</div> : null}
      {success ? <div className="notice notice--success">{success}</div> : null}

      <section className="panel" style={{ padding: "1.1rem" }}>
        {loading ? (
          <div className="empty-state">Carregando formulario...</div>
        ) : (
          <form id="entity-form" className="form-grid" onSubmit={handleSubmit}>
            {fields.map((field) => {
              const fieldValue = values[field.name];
              const spanClass = field.span === 2 ? "field field--span-2" : "field";

              if (field.type === "checkbox") {
                return (
                  <div className={spanClass} key={field.name}>
                    {renderCheckboxCard(field, Boolean(fieldValue), (nextValue) => setFieldValue(field.name, nextValue))}
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div className={spanClass} key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    <textarea
                      id={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={String(fieldValue ?? "")}
                      onChange={(event) => setFieldValue(field.name, event.target.value)}
                    />
                    {field.helpText ? <span className="field__hint">{field.helpText}</span> : null}
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <div className={spanClass} key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    <select
                      id={field.name}
                      required={field.required}
                      value={String(fieldValue ?? "")}
                      onChange={(event) => setFieldValue(field.name, event.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {field.helpText ? <span className="field__hint">{field.helpText}</span> : null}
                  </div>
                );
              }

              if (field.type === "multiselect") {
                const selected = Array.isArray(fieldValue) ? fieldValue.map(String) : [];

                if (entityKey === "products" && field.name === "categoryIds") {
                  return (
                    <AsyncCategorySelector
                      key={field.name}
                      field={field}
                      selected={selected}
                      baseOptions={(field.options ?? []) as SelectOption[]}
                      onChange={(nextValue) => setFieldValue(field.name, nextValue)}
                    />
                  );
                }

                return (
                  <div className={spanClass} key={field.name}>
                    <label>{field.label}</label>
                    <div className="checkbox-grid">
                      {(field.options ?? []).map((option) => {
                        const checked = selected.includes(option.value);
                        return (
                          <label key={option.value} className="checkbox-card">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                const nextSelected = event.target.checked
                                  ? [...selected, option.value]
                                  : selected.filter((item) => item !== option.value);
                                setFieldValue(field.name, nextSelected);
                              }}
                            />
                            <span>
                              <strong>{option.label}</strong>
                              {option.note ? (
                                <span className="field__hint" style={{ display: "block", marginTop: "0.2rem" }}>
                                  {option.note}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {field.helpText ? <span className="field__hint">{field.helpText}</span> : null}
                  </div>
                );
              }

              const inputType =
                field.type === "email" || field.type === "password" || field.type === "number" || field.type === "date"
                  ? field.type
                  : "text";

              return (
                <div className={spanClass} key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    id={field.name}
                    type={inputType}
                    step={field.step}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={String(fieldValue ?? "")}
                    onChange={(event) => setFieldValue(field.name, event.target.value)}
                  />
                  {field.helpText ? <span className="field__hint">{field.helpText}</span> : null}
                </div>
              );
            })}

            {entityKey === "products" ? (
              <ProductImageUploads assets={productAssets} onChange={setProductAssets} />
            ) : null}
          </form>
        )}
      </section>
    </AppShell>
  );
}
