import { isDarkAtom } from "@src/app/store";
import { CodeEditor, type Props } from "@src/shared/ui/CodeEditor";
import { useAtomValue } from "jotai";

// #############################################################################
// MARK: コンポーネント

/** アプリの配色（ダークモード）に合わせたコードエディター。 */
export function ThemedCodeEditor(props: Omit<Props, "dark">) {
  const dark = useAtomValue(isDarkAtom);
  return <CodeEditor {...props} dark={dark} />;
}
