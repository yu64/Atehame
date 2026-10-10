/**
 * 部品に表示する文字。{カラム名} の部分に加工の出力の値を埋め込む。
 * 波括弧そのものは {{ と }} で書く。閉じていない { はそのまま文字として扱う。
 */
export type TemplateSegment = { kind: "text"; text: string } | { kind: "field"; key: string };

export function parseTextTemplate(template: string): TemplateSegment[] {
  const segments: TemplateSegment[] = [];
  let text = "";
  let index = 0;

  const flush = () => {
    if (text !== "") segments.push({ kind: "text", text });
    text = "";
  };

  while (index < template.length) {
    const char = template[index];
    const next = template[index + 1];

    if ((char === "{" && next === "{") || (char === "}" && next === "}")) {
      text += char;
      index += 2;
      continue;
    }

    if (char === "{") {
      const end = template.indexOf("}", index + 1);
      const key = end === -1 ? "" : template.slice(index + 1, end);
      if (key !== "" && !key.includes("{")) {
        flush();
        segments.push({ kind: "field", key });
        index = end + 1;
        continue;
      }
    }

    text += char;
    index++;
  }

  flush();
  return segments;
}

/** 埋め込まれている値の名前の一覧（重複なし）。 */
export function templateFields(template: string): string[] {
  const keys = parseTextTemplate(template).flatMap(segment =>
    segment.kind === "field" ? [segment.key] : [],
  );
  return [...new Set(keys)];
}

/** 値の名前を埋め込む記法にする。名前に波括弧を含むカラムは埋め込めない。 */
export function fieldPlaceholder(key: string): string {
  return `{${key}}`;
}
