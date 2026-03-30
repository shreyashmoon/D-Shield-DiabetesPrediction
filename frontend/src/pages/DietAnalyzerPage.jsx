import { useEffect, useMemo, useState } from 'react'

const nutrientCards = [
  { minKey: 'calories_min', maxKey: 'calories_max', label: 'Calories', unit: 'kcal' },
  { minKey: 'sugar_min', maxKey: 'sugar_max', label: 'Sugar', unit: 'g' },
  { minKey: 'carbs_min', maxKey: 'carbs_max', label: 'Carbs', unit: 'g' },
  { minKey: 'protein_min', maxKey: 'protein_max', label: 'Protein', unit: 'g' },
  { minKey: 'fat_min', maxKey: 'fat_max', label: 'Fat', unit: 'g' },
]

const loadingMessages = [
  'Sending image to AI model...',
  'Identifying food item...',
  'Analyzing nutritional content...',
  'Estimating portion size...',
  'Calculating diabetic risk...',
  'Fetching results...',
]

const riskBadgeStyles = {
  low: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  high: 'bg-red-500/20 text-red-300 border border-red-500/40',
}

function DietAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [activeHistoryId, setActiveHistoryId] = useState(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [messageVisible, setMessageVisible] = useState(true)

  const hasHistory = analysisHistory.length > 0

  const riskKey = useMemo(() => {
    if (!analysis?.diabetic_risk) {
      return ''
    }
    return String(analysis.diabetic_risk).toLowerCase()
  }, [analysis])

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0)
      setMessageVisible(true)
      return undefined
    }

    const intervalId = setInterval(() => {
      setMessageVisible(false)
      setTimeout(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
        setMessageVisible(true)
      }, 250)
    }, 1500)

    return () => clearInterval(intervalId)
  }, [loading])

  const handleFileSelect = (file) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }

    setError('')
    setAnalysis(null)
    setActiveHistoryId(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleInputChange = (event) => {
    const file = event.target.files?.[0]
    handleFileSelect(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer?.files?.[0]
    handleFileSelect(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload a food image first.')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('http://localhost:5000/analyze-food', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze image.')
      }

      const newAnalysisEntry = {
        id: Date.now(),
        ...data,
        image_url: previewUrl,
      }

      setAnalysis(newAnalysisEntry)
      setActiveHistoryId(newAnalysisEntry.id)
      setAnalysisHistory((prev) => [newAnalysisEntry, ...prev])
    } catch (analysisError) {
      setError(analysisError.message || 'Something went wrong while analyzing the image.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeAnother = () => {
    setAnalysis(null)
    setSelectedFile(null)
    setPreviewUrl('')
    setError('')
    setActiveHistoryId(null)
  }

  const handleSelectHistory = (item) => {
    setAnalysis(item)
    setPreviewUrl(item.image_url)
    setSelectedFile(null)
    setError('')
    setLoading(false)
    setActiveHistoryId(item.id)
  }

  return (
    <section className={`mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-14 ${hasHistory ? 'lg:pr-80' : ''}`}>
      <div className="space-y-8">
        {!loading && !analysis ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Diet Analyzer</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Upload a food image and get nutrition details with diabetic risk insights.
            </p>

            <div
              className="mt-8 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 sm:p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                id="food-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
              />

              <label
                htmlFor="food-image-upload"
                className="cursor-pointer text-sm sm:text-base text-cyan-300 hover:text-cyan-200"
              >
                Drag and drop a food image here, or click to upload
              </label>

              {previewUrl ? (
                <div className="mt-5">
                  <img
                    src={previewUrl}
                    alt="Food preview"
                    className="mx-auto max-h-64 sm:max-h-72 rounded-xl border border-slate-700 object-contain"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleAnalyze}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Analyze
              </button>

              {error ? <p className="text-xs sm:text-sm text-red-400">{error}</p> : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-12 text-center">
              <div className="mx-auto flex h-32 sm:h-40 w-32 sm:w-40 items-center justify-center">
                <div className="relative h-24 sm:h-32 w-24 sm:w-32">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/80 border-t-transparent" />
                  <div className="absolute inset-4 animate-pulse rounded-full border border-cyan-300/60" />
                  <div className="absolute inset-8 rounded-full bg-cyan-400/10" />
                </div>
              </div>
              <p
                className={`mt-5 text-xs sm:text-sm text-slate-300 transition-opacity duration-500 px-4 ${messageVisible ? 'opacity-100' : 'opacity-0'}`}
              >
                {loadingMessages[loadingMessageIndex]}
              </p>
            </div>
          </div>
        ) : null}

        {analysis && !loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 shadow-xl shadow-slate-950/40">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-5 lg:items-start">
              <div className="lg:col-span-2">
                <div className="flex flex-col items-center gap-4 lg:items-start">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Analyzed food"
                      className="h-48 w-48 sm:h-56 sm:w-56 rounded-xl border border-slate-700 object-cover"
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={handleAnalyzeAnother}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>

              <div className="lg:col-span-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{analysis.food_name}</h2>

                <div className="mt-5 grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {nutrientCards.map((card) => (
                    <div
                      key={card.minKey}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-slate-400">{card.label}</p>
                      <p className="mt-2 text-sm sm:text-lg font-bold text-slate-100">
                        {Number(analysis[card.minKey]).toFixed(1)} - {Number(analysis[card.maxKey]).toFixed(1)} {card.unit}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-xs sm:text-sm font-semibold ${riskBadgeStyles[riskKey] || 'bg-slate-700 text-slate-200 border border-slate-600'}`}
                  >
                    Diabetic Risk: {analysis.diabetic_risk}
                  </span>

                  <p className="mt-3 text-xs sm:text-sm text-slate-300">{analysis.reason}</p>
                  <p className="mt-4 text-xs text-slate-400">
                    ⚠️ Nutritional values are AI-estimated based on a standard serving size and may vary depending on portion size, ingredients, and preparation method.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {hasHistory ? (
        <aside className="fixed right-6 top-24 hidden w-64 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl shadow-slate-950/50 lg:block">
          <h3 className="text-lg font-semibold text-white">Recent Analyses</h3>
          <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {analysisHistory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectHistory(item)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${activeHistoryId === item.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40' : 'bg-slate-800/70 text-slate-200 hover:bg-slate-700/70'}`}
              >
                {item.food_name}
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  )
}

export default DietAnalyzerPage
