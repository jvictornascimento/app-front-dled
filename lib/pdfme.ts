import { image, multiVariableText, text, barcodes, table, line, rectangle, ellipse } from "@pdfme/schemas";

type TextPdfArgs = Parameters<typeof text.pdf>[0];
type TextUiArgs = Parameters<typeof text.ui>[0];

function asBoldMarkdown(value: unknown) {
  const stringValue = String(value ?? "");

  if (stringValue.startsWith("**") && stringValue.endsWith("**")) return stringValue;
  return `**${stringValue}**`;
}

const boldText = {
  ...text,
  pdf: (args: TextPdfArgs) =>
    text.pdf({
      ...args,
      value: asBoldMarkdown(args.value),
      schema: {
        ...args.schema,
        type: "text",
        readOnly: true,
        textFormat: "inline-markdown",
      },
    } as TextPdfArgs),
  ui: (args: TextUiArgs) =>
    text.ui({
      ...args,
      value: asBoldMarkdown(args.value),
      schema: {
        ...args.schema,
        type: "text",
        readOnly: true,
        textFormat: "inline-markdown",
      },
    } as TextUiArgs),
  propPanel: {
    ...text.propPanel,
    defaultSchema: {
      ...text.propPanel.defaultSchema,
      type: "boldText",
      content: "Texto em negrito",
      readOnly: true,
      textFormat: "inline-markdown",
    },
  },
};

export const pdfPlugins = {
  Text: text,
  BoldText: boldText,
  MultiVariableText: multiVariableText,
  Image: image,
  QRCode: barcodes.qrcode,
  Code128: barcodes.code128,
  Table: table,
  Line: line,
  Rectangle: rectangle,
  Ellipse: ellipse,
};
