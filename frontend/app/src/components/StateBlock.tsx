import type { ReactNode } from "react";

type StateBlockProps = {
  tone?: "default" | "error" | "success";
  title: string;
  body?: string;
  action?: ReactNode;
};

export function StateBlock({ tone = "default", title, body, action }: StateBlockProps) {
  return (
    <div className={`state-block ${tone}`}>
      <span className="state-orbit" />
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}
