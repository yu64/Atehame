import logoUrl from "@src/assets/logo.svg";

// #############################################################################
// MARK: コンポーネント

/**
 * アプリのロゴ（ひし形の印）。
 * 場所は 24px 四方で取り、ひし形の角はその外へはみ出す（画像は 34px 四方）。
 */
export function Logo() {
  return (
    <span className="flex h-6 w-6 items-center justify-center">
      <img src={logoUrl} alt="" className="h-[34px] w-[34px] max-w-none" />
    </span>
  );
}
