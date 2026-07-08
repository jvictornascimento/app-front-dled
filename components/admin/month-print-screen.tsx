"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/admin/app-shell";

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

export function MonthPrintScreen() {
  const [width, setWidth] = useState(25);
  const [height, setHeight] = useState(33);
  const [month, setMonth] = useState(months[currentMonthIndex()]);
  const [year, setYear] = useState(currentYear());
  const [fontSize, setFontSize] = useState(14);

  const labelText = useMemo(() => `${month}/${year}`, [month, year]);

  function handlePrint() {
    window.print();
  }

  return (
    <AppShell
      title="Impressao de mes"
      subtitle="Configure o tamanho da etiqueta, confira o preview e envie para impressao."
      actions={
        <button className="btn btn--primary" type="button" onClick={handlePrint}>
          Imprimir
        </button>
      }
    >
      <style>{`@page { size: ${width}mm ${height}mm; margin: 0; }`}</style>

      <section className="print-builder">
        <div className="panel work-panel print-builder__controls">
          <div className="section-heading">
            <div>
              <div className="kpi-label">template</div>
              <h2>Etiqueta de mes</h2>
              <p>Este modelo imprime uma etiqueta simples no formato mes/ano.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="label-width">Largura (mm)</label>
              <input
                id="label-width"
                min={10}
                max={120}
                type="number"
                value={width}
                onChange={(event) => setWidth(Number(event.target.value) || 25)}
              />
            </div>

            <div className="field">
              <label htmlFor="label-height">Altura (mm)</label>
              <input
                id="label-height"
                min={10}
                max={120}
                type="number"
                value={height}
                onChange={(event) => setHeight(Number(event.target.value) || 33)}
              />
            </div>

            <div className="field">
              <label htmlFor="label-month">Mes</label>
              <select id="label-month" value={month} onChange={(event) => setMonth(event.target.value)}>
                {months.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="label-year">Ano</label>
              <input
                id="label-year"
                min={2000}
                max={2100}
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value) || currentYear())}
              />
            </div>

            <div className="field field--span-2">
              <label htmlFor="label-font-size">Tamanho do texto</label>
              <input
                id="label-font-size"
                min={8}
                max={28}
                type="range"
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
              />
              <div className="field__hint">{fontSize}px</div>
            </div>
          </div>
        </div>

        <div className="panel work-panel print-builder__preview">
          <div className="section-heading">
            <div>
              <div className="kpi-label">preview</div>
              <h2>{width} x {height} mm</h2>
              <p>A area branca abaixo e a etiqueta que sera enviada para impressao.</p>
            </div>
          </div>

          <div className="print-preview">
            <div
              className="print-label"
              style={{
                width: `${width}mm`,
                height: `${height}mm`,
                fontSize: `${fontSize}px`,
              }}
            >
              <span>{labelText}</span>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
