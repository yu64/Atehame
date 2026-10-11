import { isDarkAtom } from "@src/app/store";
import CodeEditor, { type CodeEditorHandle, type Props } from "@src/shared/ui/CodeEditor";
import { useAtomValue } from "jotai";
import { forwardRef } from "react";

/** アプリの配色（ダークモード）に合わせたコードエディター。 */
export const ThemedCodeEditor = forwardRef<CodeEditorHandle, Omit<Props, "dark">>(
  function ThemedCodeEditor(props, ref) {
    const dark = useAtomValue(isDarkAtom);
    return <CodeEditor ref={ref} {...props} dark={dark} />;
  },
);

export default ThemedCodeEditor;
