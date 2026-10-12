// 整形の見本。input.tsx を npm run format と同じ手順で整形すると、expected.tsx になる。
// Prettier や ESLint を更新して形が崩れたら、tools/format.test.ts が失敗する。
import { a } from "@src/a";
import { b } from "@src/b";

// 三項演算子：1行なら、かっこで囲む。
const label = (isImage ? "画像" : "文字");

// 三項演算子：枝がオブジェクトなら複数行。条件が単純でなければ、条件もかっこで囲む。
const layout = (
  (Object.keys(assets).length === 0)
  ? {
    version: 1,
    css,
  }
  : {
    version: 1,
    css,
    assets,
  }
);

// 三項演算子：入れ子。
const size = (
  (width > 100)
  ? "large"
  : (width > 50 ? "medium" : someVeryLongFunctionName(width, height, depth))
);

// 三項演算子：関数のただ1つの引数は、関数のかっこを使う。
setStatus(
  done
  ? {
    type: "saved",
    label: selected.label,
  }
  : { type: "idle" }
);

// オブジェクト：プロパティが1つなら1行、2つ以上なら1行に1つずつ。
const one = { css };
const fields = [
  {
    id: "address",
    name: "住所",
    type: "string",
    memo: "",
  },
  {
    id: "name",
    name: "氏名",
    type: "string",
    memo: "",
  },
];

// 条件：演算子は行頭。複数行なら、かっこで囲む。
const onScrollbar = (
  event.nativeEvent.offsetX >= area.clientWidth || event.nativeEvent.offsetY >= area.clientHeight
);
const merge = (
  action.mergeKey !== undefined
  && action.mergeKey === settled.lastMergeKey
  && (settled.lastTime === undefined || action.now - settled.lastTime < mergeWindowMs)
);

// 条件：アロー関数の本体。
const preset = keys.find(
  key => (
    Math.abs(presets[key].width - size.width) < 0.01
    && Math.abs(presets[key].height - size.height) < 0.01
  ),
);

export function View(props: { loading: boolean; items: string[] }) {
  return (
    <div
      title={
        props.loading
        ? "読み込み中です。しばらくお待ちください。"
        : `${props.items.length} 件の項目があります。`
      }
    >
      {(
        props.loading
        ? <Spinner size="large" label="読み込み中" />
        : <List items={props.items} onSelect={select} />
      )}
      {props.loading && (
        <p className="text-sm text-text-secondary">
          読み込み中です。しばらくお待ちください。お待ちください。
        </p>
      )}
      <Input
        onChange={width => (
          width >= 10
          && change({
            width,
            height: props.paper.height,
            unit: "mm",
          })
        )}
      />
    </div>
  );
}

console.log(a, b, label, layout, size, one, fields, onScrollbar, merge, preset);
