export function insertBetween<T, U>(
  iterable: Iterable<T>,
  sepFactory: (range: [T, T], index: [number, number]) => U,
) {
  let isFirst = true;
  let prevItem: T | undefined;
  return Iterator.from(iterable).flatMap((item, index) => {
    if (isFirst) {
      isFirst = false;
      prevItem = item;
      return [item];
    }
    if (prevItem === undefined) throw new Error();
    const separator = sepFactory([prevItem, item], [index - 1, index]);
    prevItem = item;
    return [separator, item];
  });
}

export function insertAt<T>(items: T[], index: number, newItem: T): T[] {
  if (!(0 <= index && index <= items.length)) return [...items];
  return items.toSpliced(index, 0, newItem);
}

export function removeAt<T>(items: T[], index: number): T[] {
  if (!(0 <= index && index < items.length)) return [...items];
  return items.toSpliced(index, 1);
}

export function moveAt<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return [...items];
  if (!(0 <= from && from < items.length)) return [...items];
  if (!(0 <= to && to < items.length)) return [...items];
  return items.toSpliced(from, 1).toSpliced(to, 0, items[from]);
}
