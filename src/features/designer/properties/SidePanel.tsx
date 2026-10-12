import {
  assetBytes,
  assetDataUrl,
  assetLimits,
  totalAssetBytes,
} from "@src/features/designer/assets/assets";
import { useDesignerAssets } from "@src/features/designer/hooks/useDesignerAssets";
import { useDesignerCss } from "@src/features/designer/hooks/useDesignerCss";
import { useDesignerElements } from "@src/features/designer/hooks/useDesignerElements";
import { useDesignerPaper } from "@src/features/designer/hooks/useDesignerPaper";
import { useDesignerTab } from "@src/features/designer/hooks/useDesignerTab";
import { useSelectedElement } from "@src/features/designer/hooks/useSelectedElement";
import { AssetsPanel } from "@src/features/designer/properties/AssetsPanel";
import { CssPanel } from "@src/features/designer/properties/CssPanel";
import { ElementList } from "@src/features/designer/properties/ElementList";
import { ElementProperties } from "@src/features/designer/properties/ElementProperties";
import { PaperProperties } from "@src/features/designer/properties/PaperProperties";
import { useDesignerConfig } from "@src/features/designer/state/DesignerContext";
import type { SidePanelTab } from "@src/features/designer/state/designerStore";
import { PaneResizer } from "@src/shared/ui/PaneResizer";
import { useMemo, useRef, useState } from "react";

const tabs: Array<{ id: SidePanelTab; label: string }> = [
  { id: "properties", label: "設定" },
  { id: "list", label: "一覧" },
  { id: "assets", label: "画像" },
  { id: "css", label: "CSS" },
];

/** 欄の幅（px）。reserved は、指定がない場合にほかの領域へ残す幅。 */
const panelWidth = { default: 320, min: 256, reserved: 240 };

export interface Props {
  /**
   * 欄を広げても、同じ行のほかの領域（パレットやキャンバス）に残す幅（px）。
   * 欄の最大幅は、行の幅からこの幅を引いたものになる。
   */
  reservedWidth?: number;
}

/** デザイナーの右の欄。タブで中身を切り替え、左端のドラッグで幅を変える。 */
export function SidePanel(props: Props) {
  const { tab, setTab, cssWarning } = useDesignerTab();
  const [width, setWidth] = useState(panelWidth.default);
  const asideRef = useRef<HTMLElement>(null);

  function maxWidth() {
    const parent = asideRef.current?.parentElement;
    if (!parent) return panelWidth.default;
    return parent.clientWidth - (props.reservedWidth ?? panelWidth.reserved);
  }

  return (
    <aside
      ref={asideRef}
      aria-label="設定"
      className="relative shrink-0 flex flex-col min-h-0 border-l border-surface-border bg-surface"
      style={{ width }}
    >
      <PaneResizer
        label="設定の幅"
        width={width}
        min={panelWidth.min}
        max={maxWidth}
        defaultWidth={panelWidth.default}
        onResize={setWidth}
      />
      <div role="tablist" className="tabs tabs-border shrink-0 px-2">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tab ${tab === item.id ? "tab-active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.id === "css" && cssWarning && (
              <span
                className="i-lucide-triangle-alert size-4 ml-1 text-status-warning"
                aria-label="警告あり"
              />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === "properties" && <PropertiesTab />}
        {tab === "list" && <ListTab />}
        {tab === "assets" && <AssetsTab />}
        {tab === "css" && <CssTab />}
      </div>
    </aside>
  );
}

/** 設定タブ。部品を選択していれば部品の設定、していなければ用紙の設定。 */
function PropertiesTab() {
  const element = useSelectedElement();
  const { fields } = useDesignerConfig();
  const { assets } = useDesignerAssets();
  const assetNames = useMemo(() => Object.keys(assets), [assets]);
  if (!element) return <PaperTab />;

  return (
    <ElementProperties
      // 名前ではなく ID で作り直す（名前で作り直すと、名前を1文字打つたびにフォーカスが外れる）。
      key={element.id}
      rule={element.rule}
      otherNames={element.otherNames}
      fields={fields}
      assetNames={assetNames}
      onDeclaration={element.setDeclaration}
      onRename={element.rename}
      onRemove={element.remove}
      onDuplicate={element.duplicate}
      onReorder={element.reorder}
      onShowCss={element.showCss}
    />
  );
}

function PaperTab() {
  const paper = useDesignerPaper();
  return <PaperProperties paper={paper.size} onChange={paper.setSize} />;
}

function ListTab() {
  const list = useDesignerElements();
  return (
    <ElementList
      elements={list.elements}
      selected={list.selected}
      onSelect={list.select}
      onRemove={list.remove}
    />
  );
}

function AssetsTab() {
  const assets = useDesignerAssets();
  // 使っている部品は今の文書から引くため、部品が変わったときも作り直す。
  const { elements } = useDesignerElements();
  const items = useMemo(
    () =>
      Object.entries(assets.assets).map(([name, asset]) => ({
        name,
        url: assetDataUrl(asset),
        type: asset.type,
        bytes: assetBytes(asset),
        usage: assets.usage(name),
      })),
    // usage は assets から作った関数で、今の文書を読むため、elements を目印にする。
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assets は描画のたびに作り直されるため。
    [assets.assets, elements],
  );
  return (
    <AssetsPanel
      items={items}
      totalBytes={totalAssetBytes(assets.assets)}
      limits={assetLimits}
      onAdd={assets.add}
      onReplace={assets.replace}
      onRename={assets.rename}
      onRemove={assets.remove}
    />
  );
}

function CssTab() {
  const css = useDesignerCss();
  const { cssEditor } = useDesignerConfig();
  return (
    <CssPanel
      css={css.css}
      warnings={css.warnings}
      editor={cssEditor}
      reveal={css.reveal}
      onChange={css.setCss}
    />
  );
}
