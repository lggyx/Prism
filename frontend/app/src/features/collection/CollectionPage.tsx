import { Link } from "react-router-dom";
import { useSlicesQuery } from "../../api/hooks";
import { Page } from "../../components/Page";
import { PhotoSurface } from "../../components/PhotoSurface";
import { StateBlock } from "../../components/StateBlock";

export function CollectionPage() {
  const slices = useSlicesQuery();
  const items = slices.data?.items ?? [];

  return (
    <Page title="COLLECTION" meta={slices.data ? `${slices.data.total} SLICES` : "SYNC"}>
      <div className="filter-strip">
        <span className="active">ALL</span>
        {slices.data?.filters.map((filter) => (
          <span key={filter.lensId} style={{ "--lens": filter.color } as React.CSSProperties}>{filter.name} {filter.count}</span>
        ))}
      </div>

      {slices.isLoading ? <StateBlock title="LOADING COLLECTION" body="正在读取你的认知切片。" /> : null}
      {slices.error ? <StateBlock tone="error" title="MOCK SERVER OFFLINE" body={slices.error.message} /> : null}
      {!slices.isLoading && !slices.error && items.length === 0 ? (
        <StateBlock
          title={slices.data?.emptyState?.title ?? "还没有认知切片"}
          body={slices.data?.emptyState?.subtitle ?? "拍下第一张照片，开始收藏你的视角。"}
          action={<Link className="primary-button inline" to="/capture">BEGIN OBSERVATION</Link>}
        />
      ) : null}

      <div className="slice-grid">
        {items.map((item) => (
          <Link to={`/collection?slice=${item.id}`} className="slice-card" key={item.id}>
            <div className="film-window">
              <PhotoSurface compact />
              <span className="date-chip">{item.dateLabel}</span>
            </div>
            <div className="slice-meta">
              <span className="lens-dot" style={{ background: item.lens.color }} />
              <strong>{item.lens.name}</strong>
              <p>{item.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
