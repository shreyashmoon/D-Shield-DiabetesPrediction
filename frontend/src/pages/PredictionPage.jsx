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

const defaultPredictionPresets = [
  {
    id: 'preset-jeff',
    name: 'Jeff',
    values: {
      Pregnancies: '0',
      Glucose: '137',
      Insulin: '168',
      BMI: '43.1',
      Age: '33',
    },
  },
  {
    id: 'preset-robin',
    name: 'Robin',
    values: {
      Pregnancies: '1',
      Glucose: '89',
      Insulin: '94',
      BMI: '28.1',
      Age: '21',
    },
  },
]

function PredictionPage() {
  const [formData, setFormData] = useState(initialForm)
  const [patientName, setPatientName] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [error, setError] = useState('')
  const [recommendationError, setRecommendationError] = useState('')
  const [result, setResult] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [predictionHistory, setPredictionHistory] = useState(defaultPredictionPresets)
  const [duplicateWarning, setDuplicateWarning] = useState('')
  const [highlightedHistoryId, setHighlightedHistoryId] = useState(null)

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
  const predictionLabel = isHighRisk ? 'High Risk' : 'Low Risk'
  const probabilityValue = result ? (Number(result.probability) * 100).toFixed(1) : '0.0'
  const probabilityPercent = result
    ? `${probabilityValue}% probability of diabetes`
    : ''

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setDuplicateWarning('')

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

    const duplicateEntry = predictionHistory.find((entry) => {
      if (entry.name !== trimmedName) {
        return false
      }

      return (
        Number(entry.values.Pregnancies) === payload.Pregnancies &&
        Number(entry.values.Glucose) === payload.Glucose &&
        Number(entry.values.Insulin) === payload.Insulin &&
        Number(entry.values.BMI) === payload.BMI &&
        Number(entry.values.Age) === payload.Age
      )
    })

    setLoading(true)
    setResult(null)
    setRecommendations(null)
    setRecommendationError('')
    setRecommendationLoading(false)

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

      if (!duplicateEntry) {
        setPredictionHistory((prev) => [...prev, historyItem])
      } else {
        setDuplicateWarning('This patient record already exists in your recent predictions.')
        setHighlightedHistoryId(duplicateEntry.id)
        setTimeout(() => {
          setHighlightedHistoryId((current) => (current === duplicateEntry.id ? null : current))
        }, 3000)
      }
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
    setRecommendationError('')
    setRecommendations(null)
  }

  const handleGetRecommendations = async () => {
    if (!result) {
      return
    }

    setRecommendationLoading(true)
    setRecommendationError('')

    try {
      const response = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Pregnancies: Number(formData.Pregnancies),
          Glucose: Number(formData.Glucose),
          Insulin: Number(formData.Insulin),
          BMI: Number(formData.BMI),
          Age: Number(formData.Age),
          result: predictionLabel,
          probability: Number(probabilityValue),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch AI recommendations.')
      }

      setRecommendations(data)
    } catch (recommendationSubmitError) {
      setRecommendationError(recommendationSubmitError.message || 'Something went wrong while fetching recommendations.')
    } finally {
      setRecommendationLoading(false)
    }
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-14 ${hasPredictionHistory ? 'lg:pr-[18.5rem]' : ''}`}>
      <div className="mx-auto w-full max-w-[1000px] space-y-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Prediction</h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300">
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
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base sm:text-lg text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                required
              />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2">
            {fieldConfig.map((field) => (
              <label key={field.name} className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200">
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
                      <span className="pointer-events-none absolute bottom-7 left-1/2 z-20 w-48 sm:w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
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
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm sm:text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  required
                />
              </label>
            ))}

            <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
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

              {duplicateWarning ? <p className="text-xs sm:text-sm text-amber-300">{duplicateWarning}</p> : null}

              {error ? <p className="text-xs sm:text-sm text-red-400">{error}</p> : null}
            </div>
          </form>
        </div>

        {result ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
              <h2
                className={`text-2xl sm:text-4xl font-extrabold ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {isHighRisk ? 'High Risk' : 'Low Risk'}
              </h2>
              <p className="mt-3 text-sm sm:text-lg text-slate-200">{probabilityPercent}</p>

              <div className="mt-8 h-64 sm:h-96 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
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
                      width={80}
                      stroke="#94a3b8"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
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

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={handleGetRecommendations}
                  disabled={recommendationLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {recommendationLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      Fetching AI Recommendations...
                    </span>
                  ) : (
                    'Get AI Recommendations'
                  )}
                </button>

                {recommendationError ? <p className="text-xs sm:text-sm text-red-400">{recommendationError}</p> : null}
              </div>
            </div>

            {recommendationLoading || recommendations ? (
              <div className="w-full max-w-[900px] rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
                {recommendationLoading ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-400/80 border-t-transparent" />
                      <div className="absolute inset-3 rounded-full border border-cyan-300/40" />
                      <div className="absolute inset-6 rounded-full bg-cyan-400/10" />
                    </div>
                    <p className="mt-4 text-sm sm:text-base text-slate-300">Generating personalized recommendations...</p>
                  </div>
                ) : recommendations ? (
                  <>
                    <p className="text-sm sm:text-base text-slate-200">{recommendations.summary}</p>

                    <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="font-semibold text-cyan-300 text-sm sm:text-base">Diet Tips</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-xs sm:text-sm text-slate-300">
                          {recommendations.diet_tips.map((tip, index) => (
                            <li key={`${tip}-${index}`}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-cyan-300 text-sm sm:text-base">Exercise Tips</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-xs sm:text-sm text-slate-300">
                          {recommendations.exercise_tips.map((tip, index) => (
                            <li key={`${tip}-${index}`}>{tip}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-cyan-300 text-sm sm:text-base">Habits to Avoid</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-xs sm:text-sm text-slate-300">
                          {recommendations.habits_to_avoid.map((habit, index) => (
                            <li key={`${habit}-${index}`}>{habit}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-cyan-300 text-sm sm:text-base">Good Habits</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-xs sm:text-sm text-slate-300">
                          {recommendations.positive_habits.map((habit, index) => (
                            <li key={`${habit}-${index}`}>{habit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
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
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm text-slate-200 transition ${
                  highlightedHistoryId === entry.id
                    ? 'border-cyan-300/70 bg-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                    : 'border-transparent bg-slate-800/70 hover:bg-slate-700/70'
                }`}
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
