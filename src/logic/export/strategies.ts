import { serializeTemplateFile, toFileName, type TemplateFile } from "@src/models/TemplateFile";

/** テンプレートの出力方法。保存ページで選択する。 */
export interface ExportStrategy {
  id: string;
  label: string;
  description: string;
  /** このブラウザで使えるか。 */
  isAvailable(): boolean;
  /** 出力する。ユーザーが中止した場合は false を返す。 */
  export(file: TemplateFile): Promise<boolean>;
}

/** JSON ファイルとしてダウンロードする。すべてのブラウザで使える。 */
export const downloadJsonStrategy: ExportStrategy = {
  id: "download-json",
  label: "JSONファイルをダウンロード",
  description: "ブラウザのダウンロード先に保存します。",
  isAvailable: () => true,
  async export(file) {
    const blob = new Blob([serializeTemplateFile(file)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = toFileName(file.name);
      link.click();
    } finally {
      // クリック直後に破棄するとダウンロードが始まらないブラウザがあるため、少し待つ。
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
    return true;
  },
};

interface SaveFilePickerWindow {
  showSaveFilePicker(options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }): Promise<{
    createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void> }>;
  }>;
}

/** 保存先を選んで保存する（File System Access API）。Chrome / Edge で使える。 */
export const saveFilePickerStrategy: ExportStrategy = {
  id: "save-file-picker",
  label: "名前を付けて保存",
  description: "保存先のフォルダとファイル名を選びます（Chrome / Edge）。",
  isAvailable: () => typeof window !== "undefined" && "showSaveFilePicker" in window,
  async export(file) {
    const picker = window as unknown as SaveFilePickerWindow;
    let handle;
    try {
      handle = await picker.showSaveFilePicker({
        suggestedName: toFileName(file.name),
        types: [{ description: "Atehame テンプレート", accept: { "application/json": [".json"] } }],
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return false;
      throw error;
    }

    const writable = await handle.createWritable();
    await writable.write(new Blob([serializeTemplateFile(file)], { type: "application/json" }));
    await writable.close();
    return true;
  },
};

export const exportStrategies: ExportStrategy[] = [downloadJsonStrategy, saveFilePickerStrategy];
