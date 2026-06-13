import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-4 text-4xl font-bold text-accent">
        NBA 2K26 Build Planner
      </h1>
      <p className="mb-8 text-lg text-muted">
        Input your MyPLAYER build and get auto-computed max potentials, badge
        eligibility, VC upgrade suggestions, and cap breaker optimization.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/build"
          className="rounded-lg bg-accent px-6 py-3 font-medium text-background hover:opacity-90"
        >
          Start Building
        </Link>
        <Link
          href="/results"
          className="rounded-lg border border-border px-6 py-3 hover:bg-card"
        >
          View Results
        </Link>
      </div>
      <ul className="mt-12 space-y-2 text-sm text-muted">
        <li>Auto max potentials from height, weight, wingspan, and position</li>
        <li>43 badges with Bronze through Legend tier requirements</li>
        <li>VC optimizer ranked by badge impact per VC spent</li>
        <li>Cap breaker allocation plans with specialization constraints</li>
      </ul>
    </main>
  );
}
