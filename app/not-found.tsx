export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">404</h1>
        <p className="text-sm text-muted mt-2">페이지를 찾을 수 없습니다</p>
      </div>
    </div>
  );
}
