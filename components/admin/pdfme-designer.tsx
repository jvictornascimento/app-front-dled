"use client";

import type { Template } from "@pdfme/common";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { pdfPlugins } from "@/lib/pdfme";

type DesignerInstance = {
  destroy: () => void;
  updateTemplate: (template: Template) => void;
  onChangeTemplate: (callback: (template: Template) => void) => void;
  getTemplate: () => Template;
};

export type PdfmeDesignerHandle = {
  getTemplate: () => Template;
};

type PdfmeDesignerProps = {
  template: Template;
  onChange: (template: Template) => void;
};

export const PdfmeDesigner = forwardRef<PdfmeDesignerHandle, PdfmeDesignerProps>(function PdfmeDesigner(
  { template, onChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const designerRef = useRef<DesignerInstance | null>(null);
  const initialTemplateRef = useRef(template);
  const onChangeRef = useRef(onChange);
  const latestTemplateRef = useRef(template);
  const skipNextTemplateUpdateRef = useRef(false);
  const [mountError, setMountError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(
    ref,
    () => ({
      getTemplate: () => designerRef.current?.getTemplate() ?? latestTemplateRef.current,
    }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function mountDesigner() {
      try {
        const { Designer } = await import("@pdfme/ui");
        if (!isMounted || !containerRef.current) return;

        const designer = new Designer({
          domContainer: containerRef.current,
          template: initialTemplateRef.current,
          plugins: pdfPlugins,
          options: {
            zoomLevel: 2.5,
            sidebarOpen: true,
          },
        }) as DesignerInstance;

        designer.onChangeTemplate((nextTemplate) => {
          latestTemplateRef.current = nextTemplate;
          skipNextTemplateUpdateRef.current = true;
          onChangeRef.current(nextTemplate);
        });
        designerRef.current = designer;
        setMountError(null);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Nao foi possivel abrir o editor visual.";
        console.error("[print-template-designer] Failed to mount designer:", cause);
        if (isMounted) {
          setMountError(message);
        }
      }
    }

    void mountDesigner();

    return () => {
      isMounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (skipNextTemplateUpdateRef.current && template === latestTemplateRef.current) {
      skipNextTemplateUpdateRef.current = false;
      return;
    }

    skipNextTemplateUpdateRef.current = false;
    latestTemplateRef.current = template;

    try {
      designerRef.current?.updateTemplate(template);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Nao foi possivel atualizar o editor visual.";
      console.error("[print-template-designer] Failed to update designer:", cause);
      setMountError(message);
    }
  }, [template]);

  return (
    <div className="pdfme-designer-shell">
      {mountError ? (
        <div className="notice notice--error">
          Nao foi possivel carregar o editor visual. Detalhe tecnico: {mountError}
        </div>
      ) : null}
      <div className="pdfme-designer" ref={containerRef} />
    </div>
  );
});
