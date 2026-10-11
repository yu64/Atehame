import { minCanvasWidth } from "@src/features/designer/canvas/units";
import { useDesignerCss } from "@src/features/designer/hooks/useDesignerCss";
import { useDesignerElements } from "@src/features/designer/hooks/useDesignerElements";
import { useDesignerPaper } from "@src/features/designer/hooks/useDesignerPaper";
import { useDesignerTab } from "@src/features/designer/hooks/useDesignerTab";
import { useSelectedElement } from "@src/features/designer/hooks/useSelectedElement";
import CssPanel from "@src/features/designer/properties/CssPanel";
import ElementList from "@src/features/designer/properties/ElementList";
import ElementProperties from "@src/features/designer/properties/ElementProperties";
import PaperProperties from "@src/features/designer/properties/PaperProperties";
import { useDesignerConfig } from "@src/features/designer/state/DesignerContext";
import type { SidePanelTab } from "@src/features/designer/state/designerStore";
import PaneResizer from "@src/shared/ui/PaneResizer";
import { useRef, useState } from "react";

const tabs: Array<{ id: SidePanelTab; label: string }> = [
  { id: "properties", label: "設定" },
  { id: "list", label: "一覧" },
  { id: "css", label: "CSS" },
];

/** 欄の幅（px）。 */
const panelWidth = { default: 320, min: 256 };

/** デザイナーの右の欄。タブで中身を切り替え、左端のドラッグで幅を変える。 */
export default function SidePanel() {
  const { tab, setTab, cssWarning } = useDesignerTab();
  const [width, setWidth] = useState(panelWidth.default);
  const asideRef = useRef<HTMLElement>(null);

  // キャンバスに最小の幅を残す範囲まで広げられる。キャンバス以外の隣の欄（パレットなど）の幅は除く。
  const maxWidth = () => {
    const aside = asideRef.current;
    const parent = aside?.parentElement;
    if (!aside || !parent) return panelWidth.default;
    const others = [...parent.children]
      .filter(child => child !== aside && !child.hasAttribute("data-designer-canvas"))
      .reduce((sum, child) => sum + child.getBoundingClientRect().width, 0);
    return parent.clientWidth - others - minCanvasWidth;
  };

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
        {tab === "css" && <CssTab />}
      </div>
    </aside>
  );
}

/** 設定タブ。部品を選択していれば部品の設定、していなければ用紙の設定。 */
function PropertiesTab() {
  const element = useSelectedElement();
  const { fields } = useDesignerConfig();
  if (!element) return <PaperTab />;

  return (
    <ElementProperties
      // 名前ではなく ID で作り直す（名前で作り直すと、名前を1文字打つたびにフォーカスが外れる）。
      key={element.id}
      rule={element.rule}
      otherNames={element.otherNames}
      fields={fields}
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
