import type { ReactNode } from "react";

type PageProps = {
  eyebrow?: string;
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Page({ eyebrow = "WORLDVIEW LENS", title, meta, action, children }: PageProps) {
  return (
    <section className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="page-head-side">
          {meta ? <span>{meta}</span> : null}
          {action}
        </div>
      </header>
      {children}
    </section>
  );
}
