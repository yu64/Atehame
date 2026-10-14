import { type RefObject, useLayoutEffect } from "react";

// #############################################################################
// MARK: フック

/**
 * select要素の最小の幅を、選択肢（option）の中で最も長いテキストの幅に自動で固定するフック。
 * 選んだ選択肢で幅が変わらないようにする（appearance: base-select では、選んだ選択肢の幅になるため）。
 * @param selectRef 対象となるselect要素のReact Ref
 */
export function useFixedLongestSelect(
  selectRef: RefObject<HTMLSelectElement | null>,
  enable: boolean = true,
) {
  /** 最も長い選択肢を一時的に選んで幅を測り、その幅を最小の幅にする。 */
  function resize(select: HTMLSelectElement) {
    // 現在の選択状態と、width を退避
    const originalIndex = select.selectedIndex;
    const originalMinWidth = select.style.minWidth;
    const originalWidth = select.style.width;

    // 最も文字数が長い option を探す
    let maxLength = 0;
    let longestIndex = 0;

    Array.from(select.options).forEach((opt, index) => {
      if (opt.text.length > maxLength) {
        maxLength = opt.text.length;
        longestIndex = index;
      }
    });

    // 一時的に最長の option を選択状態にして幅を計測する。
    // 中身に合わせた幅で測る。親いっぱいに広がった幅（w-full など）や、前に固定した最小の幅で測ると、
    // その時点の親の幅を固定してしまい、後で親が狭くなったときにはみ出す。
    select.selectedIndex = longestIndex;
    select.style.minWidth = "";
    select.style.width = "max-content";
    const optimalWidth = select.getBoundingClientRect().width;

    // 状態を元に戻す
    select.selectedIndex = originalIndex;
    select.style.width = originalWidth;

    // 計測した幅を、インラインスタイルの min-width として直接適用する
    // (もし計測値が0の場合は、非表示状態なので適用しない)
    if (optimalWidth > 0) select.style.minWidth = `${optimalWidth}px`;
    else select.style.minWidth = originalMinWidth;
  }

  useLayoutEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    if (!enable) return;

    // マウント時
    resize(select);

    const observer = new MutationObserver(() => resize(select));

    observer.observe(select, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [selectRef, enable]);
}
