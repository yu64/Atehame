import type { ReactNode } from "react";

export type AlertKind = "error" | "warning" | "success" | "info";

export interface Props {
  kind: AlertKind;
  /** 文章。複数あれば一覧で表示する。children と併用できる（文章の後に children）。 */
  messages?: string[];
  children?: ReactNode;
  /** 画面の端から端までの帯で表示する（欄の上下に置く場合）。 */
  bar?: boolean;
  className?: string;
}

const styles: Record<AlertKind, { color: string; icon: string }> = {
  error: { color: "bg-status-error-bg text-status-error", icon: "i-lucide-circle-x" },
  warning: { color: "bg-status-warning-bg text-status-warning", icon: "i-lucide-triangle-alert" },
  success: { color: "bg-status-success-bg text-status-success", icon: "i-lucide-circle-check" },
  info: { color: "bg-base text-text-secondary", icon: "i-lucide-info" },
};

/**
 * エラー・注意・成功などを文章で示す枠。
 * エラーは割り込んで読み上げ（role="alert"）、それ以外は控えめに読み上げる（role="status"）。
 */
export default function Alert(props: Props) {
  const style = styles[props.kind];
  const messages = props.messages ?? [];

  return (
    <div
      role={props.kind === "error" ? "alert" : "status"}
      className={`
        flex items-start gap-2 text-sm
        ${props.bar ? "px-3 py-1.5" : "p-3 rounded-lg"}
        ${style.color}
        ${props.className ?? ""}
      `}
    >
      <span className={`${style.icon} size-4 shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        {messages.length === 1 && <p className="whitespace-pre-wrap break-words">{messages[0]}</p>}
        {messages.length > 1 && (
          <ul className="flex flex-col gap-1">
            {messages.map(message => (
              <li key={message} className="whitespace-pre-wrap break-words">
                {message}
              </li>
            ))}
          </ul>
        )}
        {props.children}
      </div>
    </div>
  );
}
