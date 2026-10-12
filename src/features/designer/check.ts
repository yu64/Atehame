import { toLayoutDocument, type Layout } from "@src/features/designer/model";
import { layoutDocumentWarnings } from "@src/features/designer/render/document";

/**
 * レイアウトの問題。CSS の中身を知らない側（保存画面など）に見せる。
 * 部品がない・安全化で取り除く記述がある・登録されていない画像を参照している、など。
 */
export function layoutWarnings(layout: Layout): string[] {
  const layoutDocument = toLayoutDocument(layout);
  return [
    ...(layoutDocument.elements.length === 0 ? ["レイアウトに部品がありません。"] : []),
    ...layoutDocumentWarnings(layoutDocument),
  ];
}
