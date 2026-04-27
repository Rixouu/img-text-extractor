import { ClientPage } from '@/components/ClientPage';
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-3xl">
        <ErrorBoundary fallback={<div className="text-foreground text-center">Something went wrong</div>}>
          <ClientPage />
        </ErrorBoundary>
      </div>
    </main>
  );
}