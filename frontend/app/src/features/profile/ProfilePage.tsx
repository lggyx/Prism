import { useMeQuery, useSignoutMutation } from "../../api/hooks";
import { Page } from "../../components/Page";
import { StateBlock } from "../../components/StateBlock";
import { ThemeToggle } from "../../components/ThemeToggle";

export function ProfilePage() {
  const me = useMeQuery();
  const signout = useSignoutMutation();
  const activity = Array.isArray(me.data?.activity) ? me.data.activity : me.data?.activity.items;

  return (
    <Page title="PROFILE" meta={me.data?.observer.observerCode ?? "OBSERVER"} action={<ThemeToggle />}>
      {me.isLoading ? <StateBlock title="LOADING PROFILE" /> : null}
      {me.error ? <StateBlock tone="error" title="PROFILE OFFLINE" body={me.error.message} /> : null}
      {me.data ? (
        <div className="profile-stack">
          <section className="observer-panel">
            <div className="observer-no">{me.data.observer.observerNo}</div>
            <p className="eyebrow">{me.data.observer.activeSinceLabel}</p>
            <h2>{me.data.observer.observerCode}</h2>
          </section>
          <section className="stat-grid">
            <span><strong>{me.data.stats.sliceCount}</strong>SLICES</span>
            <span><strong>{me.data.stats.usedLensCount}</strong>LENSES</span>
            <span><strong>{me.data.stats.resonanceReceived}</strong>RESONANCE</span>
          </section>
          <section className="activity-strip">
            {activity?.map((item) => <span key={item.date} data-level={item.level}>{item.weekday}</span>)}
          </section>
          <button className="secondary-button full" onClick={() => signout.mutate()}>SIGN OUT</button>
        </div>
      ) : null}
    </Page>
  );
}
