import type { ElementRect } from "@src/components/designer/state/operations";
import type { LayoutDocument, PageSize } from "@src/logic/layoutCss";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderFrameSandbox,
  renderPages,
  type Values,
} from "@src/logic/render";
import { useEffect, useMemo, useRef, useState } from "react";

export interface Props {
  layout: LayoutDocument;
  sample: Values;
  /** 用紙の大きさ（mm）。 */
  paper: PageSize;
  scale: number;
  pxPerMm: number;
  onCssWarnings: (warnings: string[]) => void;
  /** 描画した部品の位置と大きさ（mm）。名前ごと。 */
  onMeasure: (rects: Map<string, ElementRect>) => void;
}

/**
 * 用紙を印刷と同じ仕組み（sandbox 付きの iframe）で描画する。操作は受け付けない。
 * 中身は親が DOM で組み立て、値は textContent でのみ入れる。
 * 部品の位置は CSS で決まるため、描画した結果を測って操作レイヤーに渡す。
 */
export default function PaperFrame(props: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const srcDoc = useMemo(() => createDocumentHtml(), []);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!ready || !doc) return;

    callbacks.current.onCssWarnings(applyLayoutStyles(doc, props.layout));
    renderPages(doc, props.layout, [props.sample], { placeholder: true });

    const measure = () => callbacks.current.onMeasure(measureElements(doc, props.pxPerMm));
    measure();
    // 大きさを指定していない部品は文字で大きさが決まるため、フォントの読み込み後にも測る。
    let cancelled = false;
    void doc.fonts.ready.then(() => !cancelled && measure());
    return () => {
      cancelled = true;
    };
  }, [ready, props.layout, props.sample, props.pxPerMm]);

  const width = props.paper.width * props.pxPerMm;
  const height = props.paper.height * props.pxPerMm;

  return (
    <div
      className="absolute left-0 top-0 shadow-lg"
      style={{ width: width * props.scale, height: height * props.scale }}
    >
      <iframe
        ref={frameRef}
        title="用紙のプレビュー"
        sandbox={renderFrameSandbox}
        srcDoc={srcDoc}
        onLoad={() => setReady(true)}
        tabIndex={-1}
        className="block border-0 bg-white pointer-events-none origin-top-left"
        style={{ width, height, transform: `scale(${props.scale})` }}
      />
    </div>
  );
}

function measureElements(doc: Document, pxPerMm: number): Map<string, ElementRect> {
  const rects = new Map<string, ElementRect>();
  const page = doc.querySelector<HTMLElement>(".atehame-page");
  if (!page) return rects;

  const origin = page.getBoundingClientRect();
  for (const element of page.querySelectorAll<HTMLElement>(":scope > .atehame-element")) {
    const name = element.dataset.name;
    if (name === undefined || rects.has(name)) continue;
    const rect = element.getBoundingClientRect();
    rects.set(name, {
      left: (rect.left - origin.left) / pxPerMm,
      top: (rect.top - origin.top) / pxPerMm,
      width: rect.width / pxPerMm,
      height: rect.height / pxPerMm,
    });
  }
  return rects;
}
