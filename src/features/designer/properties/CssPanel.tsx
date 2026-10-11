import type { CssEditorComponent, RevealRequest } from "@src/features/designer/types";

export interface Props {
  css: string;
  warnings: string[];
  editor?: CssEditorComponent;
  reveal?: RevealRequest;
  onChange: (css: string) => void;
}

/** レイアウトの CSS。部品も用紙もここに書かれた内容がすべて。 */
export default function CssPanel(props: Props) {
  const Editor = props.editor;

  return (
    <div className="flex flex-col h-full min-h-0">
      <details className="shrink-0 px-3 py-2 text-xs text-text-secondary">
        <summary className="cursor-pointer">書き方</summary>
        <ul className="mt-1 flex flex-col gap-1 list-disc pl-4">
          <li>
            <code className="font-mono">[data-name="名前"] {"{ … }"}</code>{" "}
            だけをセレクタに持つ規則が部品になります。
          </li>
          <li>
            表示する文字は <code className="font-mono">--atehame-text: "{"{カラム名}"} 様";</code>{" "}
            のように書きます。
          </li>
          <li>
            <code className="font-mono">--atehame-split: char;</code> で1文字ずつに分かれ、
            <code className="font-mono">[data-part="char"]</code> で指定できます。
          </li>
          <li>
            用紙は <code className="font-mono">@page {"{ size: 100mm 148mm; }"}</code>、フォントは{" "}
            <code className="font-mono">var(--atehame-font-mincho)</code> などで指定します。
          </li>
          <li>url() などの外部の読み込みは使えません。</li>
        </ul>
      </details>
      <div className="flex-1 min-h-0 border-y border-surface-border">
        {Editor ? (
          <Editor
            value={props.css}
            onChange={props.onChange}
            language="css"
            ariaLabel="レイアウトの CSS"
            reveal={props.reveal}
          />
        ) : (
          <textarea
            aria-label="レイアウトの CSS"
            className="size-full p-2 font-mono text-sm resize-none outline-none"
            value={props.css}
            onChange={event => props.onChange(event.currentTarget.value)}
          />
        )}
      </div>
      {props.warnings.length > 0 && (
        <ul
          role="status"
          className="shrink-0 px-3 py-2 text-xs text-status-warning bg-status-warning-bg"
        >
          {props.warnings.map(warning => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
