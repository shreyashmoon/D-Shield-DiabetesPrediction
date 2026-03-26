import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_40%),linear-gradient(to_bottom,rgba(2,6,23,0.9),rgba(2,6,23,1))]" />

      <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm font-medium text-cyan-200">
            AI-Assisted Diabetes Risk Insights
          </p>

          <h1 className="mt-6 text-balance text-4xl font-bold leading-tight text-white md:text-6xl">
            Understand Your Diabetes Risk in Seconds
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Get a fast, data-driven estimate of your diabetes risk based on key
            health indicators. Designed to support awareness and encourage early,
            informed action.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/predict"
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Check Your Risk
            </Link>
            <Link
              to="/diet-analyzer"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Analyze Your Diet
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LandingPage
