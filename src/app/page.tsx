import { ClientPage } from '@/components/ClientPage';
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-8">
      <main className="max-w-3xl mx-auto">
        <ErrorBoundary fallback={<div className="text-gray-900 dark:text-gray-100">Something went wrong</div>}>
          <ClientPage />
        </ErrorBoundary>
      </main>
    </div>
  );
}