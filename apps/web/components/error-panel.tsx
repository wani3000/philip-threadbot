export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="alert">
      <strong>연결 확인 필요</strong>
      <div>{message}</div>
    </div>
  );
}

