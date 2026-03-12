export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state card">
      <h2 className="card-title">{title}</h2>
      <p className="card-copy">{copy}</p>
    </div>
  );
}
