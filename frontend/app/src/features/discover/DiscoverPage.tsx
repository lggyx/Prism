import { useDiscoverQuery } from "../../api/hooks";
import { Page } from "../../components/Page";
import { StateBlock } from "../../components/StateBlock";

export function DiscoverPage() {
  const discover = useDiscoverQuery();
  return (
    <Page title="DISCOVER" meta={discover.data ? `${discover.data.observerCount} OBSERVERS` : "SIGNAL"}>
      {discover.isLoading ? <StateBlock title="LOADING SIGNALS" /> : null}
      {discover.error ? <StateBlock tone="error" title="DISCOVER OFFLINE" body={discover.error.message} /> : null}
      {discover.data ? (
        <div className="discover-stack">
          <section className="challenge-panel" style={{ "--lens": discover.data.weeklyChallenge?.lensColor || "#a78bfa" } as React.CSSProperties}>
            <p className="eyebrow">WEEKLY CHALLENGE</p>
            <h2>{discover.data.weeklyChallenge?.title}</h2>
            <small>{discover.data.weeklyChallenge?.joinedCount ?? 0} joined / {discover.data.weeklyChallenge?.daysLeft ?? 0} days left</small>
          </section>
          <div className="signal-list">
            {discover.data.signalFeed.items.map((signal) => (
              <article key={signal.id} className="signal-card">
                <span className="lens-dot" style={{ background: signal.lens.color }} />
                <strong>{signal.observerCode}</strong>
                <p>{signal.summary}</p>
                <small>◇ {signal.resonanceCount} / {signal.locationText ?? "PRIVATE"}</small>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Page>
  );
}
