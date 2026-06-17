import { PageShell } from "@/components/app/page-shell";

export function StubPage({ title }: { title: string }) {
  return (
    <PageShell title={title}>
      <p className="text-sm text-muted-foreground">
        This page is part of the upcoming refactor and will be rebuilt next.
      </p>
    </PageShell>
  );
}
