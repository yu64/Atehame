import { useSyncedText } from "@src/shared/hooks/useSyncedText";
import { formatBytes } from "@src/shared/lib/units";
import { Alert } from "@src/shared/ui/Alert";
import { Button } from "@src/shared/ui/Button";
import { Card } from "@src/shared/ui/Card";
import { ConfirmDialog } from "@src/shared/ui/ConfirmDialog";
import { FileDropZone } from "@src/shared/ui/FileDropZone";
import { Input } from "@src/shared/ui/Input";
import { useRef, useState } from "react";

// #############################################################################
// MARK: 型定義

export interface AssetItem {
  name: string;
  /** 表示に使う data: URL。読めない画像なら undefined。 */
  url?: string;
  type: string;
  bytes: number;
  /** この画像を使っている部品の名前。 */
  usage: string[];
}

export interface Props {
  items: AssetItem[];
  totalBytes: number;
  limits: { bytes: number; totalBytes: number };
  /** 登録できなかったファイルの理由を返す。 */
  onAdd: (files: File[]) => Promise<string[]>;
  /** 差し替えられなかった理由を返す。 */
  onReplace: (name: string, file: File) => Promise<string | undefined>;
  onRename: (from: string, to: string) => void;
  onRemove: (name: string) => void;
}

// #############################################################################
// MARK: 定数

const accept = "image/png,image/jpeg,image/webp,image/svg+xml,.svg";

// #############################################################################
// MARK: コンポーネント

/** 画像（アセット）の一覧。登録した画像は、画像の部品から名前で選ぶ。 */
export function AssetsPanel(props: Props) {
  const [errors, setErrors] = useState<string[]>([]);

  /** 選んだファイルを画像として登録する。登録できなかったものは理由を表示する。 */
  async function add(files: File[]) {
    setErrors(await props.onAdd(files));
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <h2 className="font-bold text-text-primary">画像</h2>
      <FileDropZone
        accept={accept}
        multiple
        label="画像を追加"
        hint={`PNG・JPEG・WebP・SVG。1枚 ${formatBytes(props.limits.bytes)}、合計 ${formatBytes(props.limits.totalBytes)} まで`}
        onFiles={files => void add(files)}
      />
      <p className="text-xs text-text-secondary">画像の部品から、ここで付けた名前で選びます。</p>
      <p className="text-xs text-text-secondary">
        使用量: {formatBytes(props.totalBytes)} / {formatBytes(props.limits.totalBytes)}
      </p>

      {errors.length > 0 && <Alert kind="error" messages={errors} />}

      {(
        (props.items.length === 0)
        ? <p className="text-sm text-text-secondary">画像がありません。</p>
        : (
          <ul aria-label="画像の一覧" className="flex flex-col gap-2">
            {props.items.map((item, index) => (
              <AssetRow
                // 名前で区別すると、名前を1文字打つたびに行が作り直されてフォーカスが外れる。
                // 名前を変えても一覧の中の位置は変わらないため、位置で区別する。
                key={index}
                item={item}
                otherNames={props.items.filter(other => other !== item).map(other => other.name)}
                onReplace={async file => {
                  const error = await props.onReplace(item.name, file);
                  setErrors(error ? [error] : []);
                }}
                onRename={to => props.onRename(item.name, to)}
                onRemove={() => props.onRemove(item.name)}
              />
            ))}
          </ul>
        )
      )}
    </div>
  );
}

// #############################################################################
// MARK: 内部部品

/** 登録した画像の1行。名前の変更・使っている部品の数・削除。 */
function AssetRow(props: {
  item: AssetItem;
  otherNames: string[];
  onReplace: (file: File) => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const { item } = props;
  const [text, setText] = useSyncedText(item.name, text => text.trim() === item.name);
  const replaceRef = useRef<HTMLInputElement>(null);

  const trimmed = text.trim();
  const error = (
    (trimmed === "")
    ? "名前を入力してください。"
    : (
      (props.otherNames.includes(trimmed))
      ? "同じ名前の画像があります。"
      : undefined
    )
  );

  const [confirming, setConfirming] = useState(false);

  /** 使っている部品があれば、削除してよいか確かめる。削除は元に戻すで戻せる。 */
  function remove() {
    if (item.usage.length > 0) setConfirming(true);
    else props.onRemove();
  }

  return (
    <Card as="li" padding="sm" className="flex gap-2">
      <div className="size-16 shrink-0 rounded bg-base flex items-center justify-center overflow-hidden">
        {(
          item.url
          ? <img src={item.url} alt="" className="max-w-full max-h-full object-contain" />
          : <span className="text-xs text-status-error">表示できません</span>
        )}
      </div>
      <div className="flex flex-1 min-w-0 flex-col gap-1">
        <Input
          type="text"
          aria-label="画像の名前"
          value={text}
          error={error}
          onChange={event => {
            const next = event.currentTarget.value;
            setText(next);
            const name = next.trim();
            if (name !== "" && name !== item.name && !props.otherNames.includes(name)) {
              props.onRename(name);
            }
          }}
        />
        <span className="text-xs text-text-tertiary">
          {item.type.replace("image/", "").replace("+xml", "").toUpperCase()}・
          {formatBytes(item.bytes)}・
          {(item.usage.length > 0 ? `${item.usage.length} 個の部品で使用` : "未使用")}
        </span>
        <div className="flex gap-1">
          <Button
            icon="i-lucide-replace"
            label="差し替え"
            onClick={() => replaceRef.current?.click()}
          />
          <Button
            icon="i-lucide-trash-2"
            label={`${item.name} を削除`}
            iconOnly
            danger
            onClick={remove}
          />
          <ConfirmDialog
            open={confirming}
            title={`「${item.name}」を削除しますか？`}
            message={`${item.usage.length} 個の部品（${item.usage.join("、")}）で使っています。削除すると、これらの部品は「画像がありません」になります（元に戻すで戻せます）。`}
            confirmLabel="削除する"
            danger
            onConfirm={() => {
              setConfirming(false);
              props.onRemove();
            }}
            onCancel={() => setConfirming(false)}
          />
          <input
            ref={replaceRef}
            type="file"
            accept={accept}
            hidden
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) props.onReplace(file);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>
    </Card>
  );
}
