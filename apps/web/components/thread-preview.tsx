type ThreadPreviewProps = {
  segments: string[];
  prefix?: string;
  emptyMessage?: string;
};

export function ThreadPreview({
  segments,
  prefix = "이어쓰기",
  emptyMessage
}: ThreadPreviewProps) {
  if (segments.length === 0) {
    return emptyMessage ? (
      <div className="thread-preview">{emptyMessage}</div>
    ) : null;
  }

  return (
    <div className="thread-preview">
      {segments.map((segment, index) => (
        <div key={`${prefix}-${index}`}>
          <strong>
            {prefix} {index + 1}
          </strong>
          <div>{segment}</div>
          {index < segments.length - 1 ? (
            <div style={{ margin: "0.75rem 0" }}>---</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
