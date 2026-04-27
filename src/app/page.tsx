import { ClientPage } from '@/components/ClientPage';
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <main className="max-w-4xl mx-auto">
        <ErrorBoundary fallback={<div className="text-foreground">Something went wrong</div>}>
          <ClientPage />
        </ErrorBoundary>
      </main>
    </div>
  );
}