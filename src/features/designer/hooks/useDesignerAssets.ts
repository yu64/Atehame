import {
  checkAssetLimits,
  createAsset,
  uniqueAssetName,
  type Assets,
} from "@src/features/designer/assets/assets";
import {
  useDesignerSelector,
  useDesignerStore,
} from "@src/features/designer/state/DesignerContext";
import { selectLayout } from "@src/features/designer/state/designerStore";
import { readImageFile } from "@src/shared/lib/imageFile";

/** ファイルから画像を作る。できなければ理由を返す。 */
async function readAsset(file: File, assets: Assets) {
  const image = await readImageFile(file);
  if (!image) return { error: `「${file.name}」は PNG・JPEG・WebP・SVG の画像ではありません。` };
  const asset = createAsset(image.type, image.bytes);
  if (!asset) return { error: `「${file.name}」は SVG として読み込めませんでした。` };
  const error = checkAssetLimits(assets, asset);
  return error ? { error } : { asset };
}

/** 画像（アセット）の一覧と、登録・差し替え・名前の変更・削除。どれも元に戻せる。 */
export function useDesignerAssets() {
  const store = useDesignerStore();
  const assets = useDesignerSelector(state => selectLayout(state).assets);

  return {
    assets,
    /** ファイルを画像として登録する。登録できなかったファイルの理由を返す。 */
    add: async (files: Iterable<File>): Promise<string[]> => {
      const errors: string[] = [];
      for (const file of files) {
        const current = store.layout.assets;
        const result = await readAsset(file, current);
        if (result.error) errors.push(result.error);
        else store.setAsset(uniqueAssetName(current, file.name), result.asset!);
      }
      return errors;
    },
    /** 画像を差し替える。名前と、参照している部品はそのまま。 */
    replace: async (name: string, file: File): Promise<string | undefined> => {
      const { [name]: _replaced, ...others } = store.layout.assets;
      const result = await readAsset(file, others);
      if (result.error) return result.error;
      store.setAsset(name, result.asset!);
      return undefined;
    },
    rename: store.renameAsset,
    remove: store.removeAsset,
    /** 画像を参照している部品の名前。 */
    usage: (name: string) => store.layout.assetUsage(name),
  };
}

export default useDesignerAssets;
