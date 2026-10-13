import type { LayoutDocument, PageSize } from "@src/features/designer/layoutCss";
import {
  applyLayoutStyles,
  createDocumentHtml,
  renderPages,
  type Values,
} from "@src/features/designer/render";
import type { ElementRect } from "@src/features/designer/state/operations";
import { useFrameDocument } from "@src/shared/hooks/useFrameDocument";
import { scriptlessFrameSandbox } from "@src/shared/lib/frame/isolatedFrame";
import { measureRelative } from "@src/shared/lib/frame/measure";
import { useEffect, useMemo, useRef } from "react";

// #############################################################################
// MARK: 型定義

export interface Props {
  layout: LayoutDocument;
  sample: Values;
  /** 値が空の部品に、値の名前を薄く出す（編集用）。 */
  placeholder: boolean;
  /** 用紙の大きさ（mm）。 */
  paper: PageSize;
  scale: number;
  pxPerMm: number;
  /** 描画した部品の位置と大きさ（mm）。名前ごと。 */
  onMeasure: (rects: Map<string, ElementRect>) => void;
}

// #############################################################################
// MARK: コンポーネント

/**
 * 用紙を印刷と同じ仕組み（外部と切り離した iframe）で描画する。操作は受け付けない。
 * 中身は親が DOM で組み立て、値は textContent でのみ入れる。
 * 部品の位置は CSS で決まるため、描画した結果を測って操作レイヤーに渡す。
 */
export function PaperFrame(props: Props) {
  const frame = useFrameDocument();
  const srcDoc = useMemo(() => createDocumentHtml(), []);
  const callbacks = useRef(props);
  callbacks.current = props;
  const doc = frame.document;

  useEffect(() => {
    if (!doc) return;

    applyLayoutStyles(doc, props.layout);
    renderPages(doc, props.layout, [props.sample], { placeholder: props.placeholder });

    /** 部品の表示上の位置と大きさを測り、知らせる。 */
    function measure(target: Document) {
      callbacks.current.onMeasure(measureElements(target, props.pxPerMm));
    }
    measure(doc);
    // 大きさを指定していない部品は文字で大きさが決まるため、フォントの読み込み後にも測る。
    let cancelled = false;
    void doc.fonts.ready.then(() => !cancelled && measure(doc));
    return () => {
      cancelled = true;
    };
  }, [doc, props.layout, props.sample, props.placeholder, props.pxPerMm]);

  const width = props.paper.width * props.pxPerMm;
  const height = props.paper.height * props.pxPerMm;

  return (
    <div
      className="absolute left-0 top-0 shadow-lg"
      style={{
        width: width * props.scale,
        height: height * props.scale,
      }}
    >
      <iframe
        ref={frame.ref}
        title="用紙のプレビュー"
        sandbox={scriptlessFrameSandbox}
        srcDoc={srcDoc}
        onLoad={frame.onLoad}
        tabIndex={-1}
        className="block border-0 bg-white pointer-events-none origin-top-left"
        style={{
          width,
          height,
          transform: `scale(${props.scale})`,
        }}
      />
    </div>
  );
}

// #############################################################################
// MARK: 内部関数

/** 用紙の中の部品を、用紙の左上からの位置（mm）で測る。同じ名前の部品は最初のものだけ。 */
function measureElements(doc: Document, pxPerMm: number): Map<string, ElementRect> {
  const rects = new Map<string, ElementRect>();
  const page = doc.querySelector<HTMLElement>(".atehame-page");
  if (!page) return rects;

  for (const element of page.querySelectorAll<HTMLElement>(":scope > .atehame-element")) {
    const name = element.dataset.name;
    if (name === undefined || rects.has(name)) continue;
    const box = measureRelative(page, element);
    rects.set(name, {
      left: box.left / pxPerMm,
      top: box.top / pxPerMm,
      width: box.width / pxPerMm,
      height: box.height / pxPerMm,
    });
  }
  return rects;
}
