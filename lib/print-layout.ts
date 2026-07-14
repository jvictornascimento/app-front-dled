import type { Schema, Template } from "@pdfme/common";

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

function clampColumns(value: unknown) {
  const columns = Number(value) || 1;
  return Math.min(4, Math.max(1, columns));
}

function getTemplateSize(template: Template) {
  if (typeof template.basePdf === "object" && "width" in template.basePdf && "height" in template.basePdf) {
    return {
      widthMm: template.basePdf.width,
      heightMm: template.basePdf.height,
    };
  }

  return {
    widthMm: 25,
    heightMm: 33,
  };
}

export function getTemplatePrintLayout(template: Template): PrintLayoutConfig {
  const size = getTemplateSize(template);
  const printLayout = (template as TemplateWithPrintLayout).meta?.printLayout;
  const columns = clampColumns(printLayout?.columns);
  const labelWidthMm = Number(printLayout?.labelWidthMm) || size.widthMm;
  const labelHeightMm = Number(printLayout?.labelHeightMm) || size.heightMm;
  const pageWidthMm = Number(printLayout?.pageWidthMm) || labelWidthMm * columns;
  const pageHeightMm = Number(printLayout?.pageHeightMm) || labelHeightMm;

  return {
    columns,
    pageWidthMm,
    pageHeightMm,
    labelWidthMm,
    labelHeightMm,
  };
}

const columnNameSeparator = "__col";

export function getPrintFieldSourceName(name: string) {
  return name.replace(/__col\d+$/, "");
}

function cloneSchemaForColumn(schema: Schema, columnIndex: number, labelWidthMm: number): Schema {
  return {
    ...schema,
    name: columnIndex === 0 ? schema.name : `${schema.name}${columnNameSeparator}${columnIndex + 1}`,
    position: {
      ...schema.position,
      x: schema.position.x + labelWidthMm * columnIndex,
    },
  };
}

export function expandTemplateColumns(template: Template): Template {
  const printLayout = getTemplatePrintLayout(template);

  if (printLayout.columns <= 1) {
    return template;
  }

  return {
    ...template,
    basePdf: {
      width: printLayout.pageWidthMm,
      height: printLayout.pageHeightMm,
      padding: [0, 0, 0, 0],
    },
    schemas: template.schemas.map((pageSchemas) =>
      Array.from({ length: printLayout.columns }, (_, columnIndex) =>
        pageSchemas.map((schema) => cloneSchemaForColumn(schema, columnIndex, printLayout.labelWidthMm)),
      ).flat(),
    ),
  };
}
