import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const fieldConfig = [
  { name: 'Pregnancies', min: 0, max: 20, step: 1, type: 'number' },
  { name: 'Glucose', min: 0, max: 300, step: 1, type: 'number' },
  { name: 'Insulin', min: 0, max: 900, step: 1, type: 'number' },
  { name: 'BMI', min: 0, max: 70, step: 0.1, type: 'number' },
  { name: 'Age', min: 1, max: 120, step: 1, type: 'number' },
]

const initialForm = {
  Pregnancies: '',
  Glucose: '',
  Insulin: '',
  BMI: '',
  Age: '',
}

const fieldPlaceholders = {
  Pregnancies: 'Enter number of pregnancies',
  Glucose: 'Enter glucose level',
  Insulin: 'Enter insulin level',
  BMI: 'Enter BMI value',
  Age: 'Enter age',
}

const fieldTooltips = {
  Glucose: 'Normal fasting glucose is 70–100 mg/dL. Enter value between 0–300.',
  Insulin: 'Normal insulin level is 2–25 μU/mL. Enter value between 0–900.',
  BMI: 'BMI is weight(kg) divided by height(m²). Normal range is 18.5–24.9. Enter value between 0–70.',
}

function PredictionPage() {
  const [formData, setFormData] = useState(initialForm)
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [predictionHistory, setPredictionHistory] = useState([])

  const hasPredictionHistory = predictionHistory.length > 0

  const chartData = useMemo(() => {
    if (!result?.shap_values) {
      return []
    }

    const allowedFeatures = ['Glucose', 'BMI', 'Age', 'Insulin', 'Pregnancies']

    return Object.entries(result.shap_values)
      .filter(([feature]) => allowedFeatures.includes(feature))
      .map(([feature, value]) => ({
        feature,
        value: Number(value),
      }))
  }, [result])

  const isHighRisk = result?.prediction === 1
  const probabilityPercent = result
    ? `${(Number(result.probability) * 100).toFixed(1)}% probability of diabetes`
    : ''

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const trimmedName = patientName.trim()
    if (!trimmedName) {
      setError('Patient Name is required.')
      return
    }

    const payload = {}
    for (const field of fieldConfig) {
      const raw = formData[field.name]
      if (String(raw).trim() === '') {
        setError(`${field.name} is required.`)
        return
      }
      const numeric = Number(raw)

      if (!Number.isFinite(numeric)) {
        setError(`${field.name} must be a valid number.`)
        return
      }

      if (numeric < field.min || numeric > field.max) {
        setError(`${field.name} must be between ${field.min} and ${field.max}.`)
        return
      }

      payload[field.name] = numeric
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Prediction request failed.')
      }

      setResult(data)
      const historyItem = {
        id: Date.now(),
        name: trimmedName,
        values: {
          Pregnancies: formData.Pregnancies,
          Glucose: formData.Glucose,
          Insulin: formData.Insulin,
          BMI: formData.BMI,
          Age: formData.Age,
        },
      }
      setPredictionHistory((prev) => [historyItem, ...prev])
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPrediction = (entry) => {
    setPatientName(entry.name)
    setFormData({
      Pregnancies: String(entry.values.Pregnancies),
      Glucose: String(entry.values.Glucose),
      Insulin: String(entry.values.Insulin),
      BMI: String(entry.values.BMI),
      Age: String(entry.values.Age),
    })
    setError('')
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-6 py-14 ${hasPredictionHistory ? 'lg:pr-80' : ''}`}>
      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/40">
          <h1 className="text-3xl font-bold text-white">Prediction</h1>
          <p className="mt-2 text-slate-300">
            Enter your health metrics to estimate diabetes risk.
          </p>

          <div className="mt-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">Patient Name</span>
              <input
                type="text"
                name="patientName"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Enter patient name"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xl text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                required
              />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
            {fieldConfig.map((field) => (
              <label key={field.name} className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                  {field.name}
                  {fieldTooltips[field.name] ? (
                    <span className="group relative inline-flex">
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`${field.name} info`}
                        className="inline-flex cursor-default select-none text-xs font-semibold text-cyan-300"
                      >
                        ⓘ
                      </span>
                      <span className="pointer-events-none absolute bottom-7 left-1/2 z-20 w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        {fieldTooltips[field.name]}
                      </span>
                    </span>
                  ) : null}
                </span>
                <input
                  type={field.type}
                  name={field.name}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={fieldPlaceholders[field.name]}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
              </label>
            ))}

            <div className="md:col-span-2 mt-2 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Predicting...
                  </span>
                ) : (
                  'Predict'
                )}
              </button>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}
            </div>
          </form>
        </div>

        {result ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/40">
              <h2
                className={`text-4xl font-extrabold ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {isHighRisk ? 'High Risk' : 'Low Risk'}
              </h2>
              <p className="mt-3 text-lg text-slate-200">{probabilityPercent}</p>

              <div className="mt-8 h-[360px] rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      width={130}
                      stroke="#94a3b8"
                      tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: '#e2e8f0',
                      }}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                      formatter={(value) => [Number(value).toFixed(4), 'SHAP Value']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.feature}
                          fill={entry.value >= 0 ? '#f87171' : '#34d399'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-slate-950/40">
              <h3 className="text-2xl font-bold text-white">Recommendations</h3>

              {isHighRisk ? (
                <div className="mt-4 grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="font-semibold text-red-300">Diet Tips</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      <li>Reduce sugary drinks and refined carbs.</li>
                      <li>Focus on high-fiber meals and lean protein.</li>
                      <li>Control portions and meal timing consistently.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-300">Exercise Tips</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      <li>Aim for 30–45 minutes of brisk walking daily.</li>
                      <li>Add resistance training 2–3 times per week.</li>
                      <li>Break long sitting periods with short movement.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-300">Habits to Avoid</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      <li>Skipping meals followed by heavy eating.</li>
                      <li>Late-night snacking and poor sleep routines.</li>
                      <li>Smoking and frequent high-calorie processed food.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="font-semibold text-emerald-300">Maintenance Tips</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      <li>Keep balanced meals with whole grains and vegetables.</li>
                      <li>Stay hydrated and maintain regular sleep schedule.</li>
                      <li>Monitor your weight and routine health markers.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-300">Healthy Habits to Continue</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                      <li>Continue regular physical activity each week.</li>
                      <li>Maintain low intake of added sugars.</li>
                      <li>Do periodic preventive checkups with your doctor.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {hasPredictionHistory ? (
        <aside className="fixed right-6 top-24 hidden w-64 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl shadow-slate-950/50 lg:block">
          <h3 className="text-lg font-semibold text-white">Recent Predictions</h3>
          <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {predictionHistory.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleSelectPrediction(entry)}
                className="w-full rounded-lg bg-slate-800/70 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700/70"
              >
                {entry.name}
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  )
}

export default PredictionPage
