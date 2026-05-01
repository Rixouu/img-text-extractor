import { ClientPage } from '@/components/ClientPage';
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#EDE8E0] p-5 md:p-10">
      <div className="w-full max-w-[1040px]">
        <ErrorBoundary fallback={<div className="text-foreground text-center">Something went wrong</div>}>
          <ClientPage />
        </ErrorBoundary>
      </div>
    </main>
  );
}
