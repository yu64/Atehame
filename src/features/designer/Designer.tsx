import { DesignerCanvas } from "@src/features/designer/canvas/DesignerCanvas";
import { minCanvasWidth } from "@src/features/designer/canvas/units";
import { useDesignerKeyboard } from "@src/features/designer/hooks/useDesignerKeyboard";
import type { LayoutDocument } from "@src/features/designer/layoutCss";
import { fromLayoutDocument, type Layout, toLayoutDocument } from "@src/features/designer/model";
import { ElementPalette, paletteWidth } from "@src/features/designer/palette/ElementPalette";
import { defaultPresets } from "@src/features/designer/presets";
import { SidePanel } from "@src/features/designer/properties/SidePanel";
import type { Values } from "@src/features/designer/render";
import {
  type DesignerConfig,
  DesignerConfigContext,
  DesignerStoreContext,
} from "@src/features/designer/state/DesignerContext";
import { DesignerStore } from "@src/features/designer/state/designerStore";
import { DesignerToolbar } from "@src/features/designer/toolbar/DesignerToolbar";
import type { CssEditorComponent, ElementPreset } from "@src/features/designer/types";
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useState } from "react";

// #############################################################################
// MARK: 型定義

export interface DesignerProps {
  value: Layout;
  /** 確定した変更を通知する（ドラッグ中などの途中経過は通知しない）。 */
  onChange: (layout: Layout) => void;
  /** パレットに並べる値の名前（加工の出力のキー）。 */
  fields: string[];
  /** プレビューに使う値。 */
  sample: Values;
  /** パレットの部品の雛形。先頭の雛形は、値の名前から追加する部品にも使う。 */
  presets?: ElementPreset[];
  /** CSS の編集欄。省略すると普通のテキスト欄になる。 */
  cssEditor?: CssEditorComponent;
  /**
   * 中身の構成。省略すると既定の構成（操作バー、パレット、用紙、右の欄）になる。
   * Designer.Toolbar などを並べ替えたり、独自の部品を足したりできる。
   */
  children?: ReactNode;
}

// #############################################################################
// MARK: コンポーネント

/**
 * レイアウトのデザイナー。レイアウトはすべて CSS で表し、操作はすべて CSS の書き換えになる。
 * 状態を作って配り、中の領域どうしを連携させるだけで、各領域は必要な状態と操作だけを使う。
 * アプリの状態には依存せず、値は props で受け取る。
 */
export function Designer(props: DesignerProps) {
  /** 確定したレイアウトを、保存用の形にして呼び出し側へ知らせる。 */
  function notify(layout: LayoutDocument) {
    props.onChange(fromLayoutDocument(layout));
  }
  const [store] = useState(() => new DesignerStore(toLayoutDocument(props.value), notify));
  // 最新の onChange で知らせる。描画中に書き換えないよう、描画の確定後に差し替える。
  useLayoutEffect(() => {
    store.onCommit = notify;
  });

  // テンプレートの読み込みなど、外から値が差し替えられたら受け取る。
  useEffect(() => store.receive(toLayoutDocument(props.value)), [store, props.value]);

  const config = useMemo<DesignerConfig>(
    () => ({
      fields: props.fields,
      sample: props.sample,
      presets: props.presets ?? defaultPresets,
      cssEditor: props.cssEditor,
    }),
    [props.fields, props.sample, props.presets, props.cssEditor],
  );
  const onKeyDown = useDesignerKeyboard(store);

  return (
    <DesignerStoreContext.Provider value={store}>
      <DesignerConfigContext.Provider value={config}>
        <div className="flex flex-col h-full min-h-0" onKeyDown={onKeyDown}>
          {props.children ?? <DefaultLayout />}
        </div>
      </DesignerConfigContext.Provider>
    </DesignerStoreContext.Provider>
  );
}

// #############################################################################
// MARK: 内部部品

/** 既定の構成。 */
function DefaultLayout() {
  return (
    <>
      <DesignerToolbar />
      <DesignerBody>
        <ElementPalette />
        <DesignerCanvas />
        {/* 右の欄を広げても、パレットの幅とキャンバスの最小の幅は残す。 */}
        <SidePanel reservedWidth={paletteWidth + minCanvasWidth} />
      </DesignerBody>
    </>
  );
}

/** 操作バーの下に、パレット・用紙・右の欄を横に並べる領域。 */
function DesignerBody(props: { children: ReactNode }) {
  return <div className="flex flex-1 min-h-0">{props.children}</div>;
}

// #############################################################################
// MARK: 部品の登録

// Designer.Toolbar などとして、構成の部品を差し替えられるように公開する。
Designer.Toolbar = DesignerToolbar;
Designer.Body = DesignerBody;
Designer.Palette = ElementPalette;
Designer.Canvas = DesignerCanvas;
Designer.SidePanel = SidePanel;
