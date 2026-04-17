export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Preparing your Launchly workspace...</p>
      </div>
    </div>
  );
}
