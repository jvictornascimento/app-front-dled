"use client";

import type { Template } from "@pdfme/common";
import { image, multiVariableText, text, barcodes, table, line, rectangle, ellipse } from "@pdfme/schemas";
import { useEffect, useRef } from "react";

type DesignerInstance = {
  destroy: () => void;
  updateTemplate: (template: Template) => void;
  onChangeTemplate: (callback: (template: Template) => void) => void;
  getTemplate: () => Template;
};

const plugins = {
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

export function PdfmeDesigner({
  template,
  onChange,
}: {
  template: Template;
  onChange: (template: Template) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<DesignerInstance | null>(null);
  const initialTemplateRef = useRef(template);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;

    async function mountDesigner() {
      const { Designer } = await import("@pdfme/ui");
      if (!isMounted || !containerRef.current) return;

      const designer = new Designer({
        domContainer: containerRef.current,
        template: initialTemplateRef.current,
        plugins,
        options: {
          zoomLevel: 1,
          sidebarOpen: true,
        },
      }) as DesignerInstance;

      designer.onChangeTemplate((nextTemplate) => onChangeRef.current(nextTemplate));
      designerRef.current = designer;
    }

    void mountDesigner();

    return () => {
      isMounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, []);

  useEffect(() => {
    designerRef.current?.updateTemplate(template);
  }, [template]);

  return <div className="pdfme-designer" ref={containerRef} />;
}
