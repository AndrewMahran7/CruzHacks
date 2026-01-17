export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          ✓ API is running
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          POST /api/analyze - Screenshot analysis endpoint
        </p>
        <div className="mt-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 p-6 font-mono text-sm">
          <p className="text-zinc-700 dark:text-zinc-300">
            Status: <span className="text-green-600 dark:text-green-400 font-semibold">Healthy</span>
          </p>
          <p className="text-zinc-700 dark:text-zinc-300">
            Timestamp: {new Date().toISOString()}
          </p>
        </div>
      </main>
    </div>
  );
}

