"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getEntityDefinition,
  getUserFieldsForMode,
  type EntityKey,
  type FormField,
  type FormValues,
} from "@/lib/admin-config";
import { ApiError } from "@/lib/api";
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const loadedOptions = entity.loadOptions ? await entity.loadOptions() : {};
        const nextValues =
          mode === "edit" && id
            ? entity.mapToValues(await entity.getOne(id), loadedOptions)
            : entity.getDefaultValues(loadedOptions);

        setOptions(loadedOptions);
        setValues(nextValues);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "Nao foi possivel carregar o formulario.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [entity, id, mode]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = entity.buildPayload(values);
      if (mode === "edit" && id) {
        await entity.update(id, payload);
        setSuccess(`${entity.singularLabel} atualizado com sucesso.`);
      } else {
        await entity.create(payload);
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
          </form>
        )}
      </section>
    </AppShell>
  );
}
