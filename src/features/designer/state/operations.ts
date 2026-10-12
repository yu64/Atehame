import {
  type ElementRule,
  type LayoutDocument,
  type PageSize,
} from "@src/features/designer/layoutCss";
import type { ElementPreset, PresetContext } from "@src/features/designer/types";
import { formatMm, lengthToMm } from "@src/shared/lib/units";

// #############################################################################
// MARK: 型定義

/** 部品の表示上の位置と大きさ（mm）。プレビューから測った値。 */
export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// #############################################################################
// MARK: 関数

/** 既存と重ならない名前を付ける。 */
export function uniqueName(names: Iterable<string>, base: string): string {
  const used = new Set(names);
  const trimmed = base.trim() || "部品";
  if (!used.has(trimmed)) return trimmed;
  for (let index = 2; ; index++) {
    const name = `${trimmed} ${index}`;
    if (!used.has(name)) return name;
  }
}

/** 雛形から部品を追加する。 */
export function addFromPreset(
  layout: LayoutDocument,
  preset: ElementPreset,
  context: Omit<PresetContext, "name" | "count">,
): { layout: LayoutDocument; name: string } {
  const name = uniqueName(
    layout.elements.map(element => element.name),
    context.key ?? preset.defaultName,
  );
  const result = preset.create({
    ...context,
    name,
    count: layout.elements.length,
  });
  return {
    layout: layout.addElement(name, result.declarations, result.nestedCss),
    name,
  };
}

/** 位置と大きさを設定する（mm）。指定しない項目は変えない。 */
export function placeElement(
  layout: LayoutDocument,
  name: string,
  rect: Partial<ElementRect>,
): LayoutDocument {
  const keys = ["left", "top", "width", "height"] as const;
  const entries = keys.flatMap((key): Array<[string, string]> => {
    const value = rect[key];
    return (value === undefined ? [] : [[key, formatMm(value)]]);
  });
  return layout.setDeclarations({ element: name }, entries);
}

/** 用紙の大きさ（mm）を @page の size に書く。 */
export function setPaperSize(layout: LayoutDocument, size: PageSize): LayoutDocument {
  return layout.setDeclaration(
    { page: true },
    "size",
    `${formatMm(size.width)} ${formatMm(size.height)}`,
  );
}

/** 位置をずらす（mm）。 */
export function moveElementBy(
  layout: LayoutDocument,
  name: string,
  dx: number,
  dy: number,
  shown: ElementRect | undefined,
): LayoutDocument {
  const rule = layout.element(name);
  if (!rule) return layout;
  const { left, top } = positionOf(rule, shown);
  return placeElement(layout, name, {
    left: left + dx,
    top: top + dy,
  });
}

/** 部品を直後に複製し、少しずらす。 */
export function duplicateElement(
  layout: LayoutDocument,
  name: string,
  shown: ElementRect | undefined,
): { layout: LayoutDocument; name?: string } {
  const rule = layout.element(name);
  if (!rule) return { layout };
  const newName = uniqueName(
    layout.elements.map(element => element.name),
    `${name} のコピー`,
  );
  const { left, top } = positionOf(rule, shown);
  return {
    layout: layout.duplicateElement(name, newName, {
      left: left + 3,
      top: top + 3,
    }),
    name: newName,
  };
}

// #############################################################################
// MARK: 内部関数

/** CSS の left / top（mm）。mm で読めない場合は表示上の位置を使う。 */
function positionOf(rule: ElementRule, shown: ElementRect | undefined) {
  /** left / top を mm で読む。読めなければ表示上の位置、それもなければ 0。 */
  function read(property: "left" | "top") {
    const value = rule.declarations.get(property)?.value;
    return (value !== undefined ? lengthToMm(value) : undefined) ?? shown?.[property] ?? 0;
  }
  return {
    left: read("left"),
    top: read("top"),
  };
}
