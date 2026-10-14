import { useAddElement } from "@src/features/designer/hooks/useAddElement";
import { useDesignerConfig } from "@src/features/designer/state/DesignerContext";
import { Button } from "@src/shared/ui/Button";

// #############################################################################
// MARK: 定数

/** パレットの幅（px）。 */
export const paletteWidth = 192;

// #############################################################################
// MARK: コンポーネント

/**
 * 部品を追加するパレット（左の欄）。クリックで用紙に追加する。
 * 出力の項目からは、先頭の雛形でその値を埋め込んだ部品を追加する。
 */
export function ElementPalette() {
  const { fields, presets } = useDesignerConfig();
  const add = useAddElement();
  const fieldPreset = presets[0];

  return (
    <aside
      aria-label="パレット"
      className="shrink-0 min-h-0 overflow-auto border-r border-surface-border bg-surface"
      style={{ width: paletteWidth }}
    >
      <div className="flex flex-col gap-4 p-3">
        <section className="flex flex-col gap-1">
          <h2 className="text-xs font-bold text-text-secondary">出力の項目</h2>
          {fields.length === 0 && (
            <p className="text-xs text-text-tertiary">
              加工の出力に項目がありません。加工画面でオブジェクトを return してください。
            </p>
          )}
          {(
            fieldPreset
            && fields.map(key => (
              <PaletteButton
                key={key}
                icon={fieldPreset.icon}
                label={key}
                onClick={() => add(fieldPreset, key)}
              />
            ))
          )}
        </section>
        <section className="flex flex-col gap-1">
          <h2 className="text-xs font-bold text-text-secondary">部品</h2>
          {presets.map(preset => (
            <PaletteButton
              key={preset.id}
              icon={preset.icon}
              label={preset.label}
              onClick={() => add(preset)}
            />
          ))}
        </section>
      </div>
    </aside>
  );
}

// #############################################################################
// MARK: 内部部品

/** 部品を追加するボタン。 */
function PaletteButton(props: { icon: string; label: string; onClick: () => void }) {
  return (
    <Button
      icon={props.icon}
      label={<span className="truncate">{props.label}</span>}
      title={`${props.label} を追加`}
      className="justify-start w-full"
      onClick={props.onClick}
    />
  );
}
