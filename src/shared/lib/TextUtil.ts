/** 2つの文字列で異なる範囲（前後の一致する部分を除いた範囲）。 */
export function changedRange(before: string, after: string) {
  let start = 0;
  const max = Math.min(before.length, after.length);
  while (start < max && before[start] === after[start]) start++;

  let end = 0;
  while (end < max - start && before[before.length - 1 - end] === after[after.length - 1 - end]) {
    end++;
  }
  return { start, oldEnd: before.length - end, newEnd: after.length - end };
}
