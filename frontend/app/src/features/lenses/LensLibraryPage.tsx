import { useLensesQuery } from "../../api/hooks";
import { Page } from "../../components/Page";
import { StateBlock } from "../../components/StateBlock";

export function LensLibraryPage() {
  const lenses = useLensesQuery();
  return (
    <Page title="LENS LIBRARY" meta={lenses.data ? `${lenses.data.total} AVAILABLE` : "SYNC"}>
      {lenses.isLoading ? <StateBlock title="LOADING LENSES" /> : null}
      {lenses.error ? <StateBlock tone="error" title="LENSES OFFLINE" body={lenses.error.message} /> : null}
      <div className="lens-library">
        {lenses.data?.items.map((lens) => (
          <article key={lens.id} className="library-card" style={{ "--lens": lens.color } as React.CSSProperties}>
            <span className="lens-dot" />
            <div>
              <strong>{lens.name}</strong>
              <small>{lens.englishName} / {lens.category}</small>
              <p>{lens.fullDescription || lens.description}</p>
            </div>
          </article>
        ))}
      </div>
    </Page>
  );
}
