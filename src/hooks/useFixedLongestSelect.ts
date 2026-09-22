import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * select要素の幅を、選択肢（option）の中で最も長いテキストの幅に自動で固定するフック
 * @param selectRef 対象となるselect要素のReact Ref
 */
export default function useFixedLongestSelect(
  selectRef: RefObject<HTMLSelectElement | null>,
  enable: boolean = true
)
{
  function resize(select: HTMLSelectElement)
  {

    // 現在の選択状態と、width を退避
    const originalIndex = select.selectedIndex;
    const originalWidth = select.style.minWidth;

    // 最も文字数が長い option を探す
    let maxLength = 0;
    let longestIndex = 0;
    
    Array.from(select.options).forEach((opt, index) => {
      if (opt.text.length > maxLength) {
        maxLength = opt.text.length;
        longestIndex = index;
      }
    });

    // 一時的に最長の option を選択状態にして幅を計測
    select.selectedIndex = longestIndex;
    const optimalWidth = select.getBoundingClientRect().width;

    // 状態を元に戻す
    select.selectedIndex = originalIndex;

    // 計測した最大幅をインラインスタイルの width として直接適用する
    // (もし計測値が0の場合は、非表示状態なので適用しない)
    if(optimalWidth > 0) select.style.minWidth = `${optimalWidth}px`;
    else select.style.minWidth = originalWidth;
  }

  useLayoutEffect(() => {

    const select = selectRef.current;
    if(!select) return;
    if(!enable) return;

    //マウント時
    resize(select);

    const observer = new MutationObserver(
      () => resize(select)
    );

    observer.observe(
      select,
      {
        characterData: true,
        childList: true,
        subtree: true,
      }
    );

    return () => {
      observer.disconnect();
    }
  }, [selectRef.current?.options.length]);
}
