import { useEffect, useRef, useState } from 'react'
import { useGeminiModel } from '../context/GeminiModelContext'

const modelOptions = [
  'Gemini 2.5 Flash',
  'Gemini 2.5 Flash Lite',
  'Gemini 3 Flash',
  'Gemini 3.1 Flash Lite',
]

function GeminiModelSelector() {
  const { selectedModel, setSelectedModel } = useGeminiModel()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('touchstart', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="mb-3 w-[19rem] rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl shadow-slate-950/80 backdrop-blur">
          <p className="text-sm font-semibold text-cyan-300">Select Gemini Model</p>
          <div className="mt-3 space-y-2">
            {modelOptions.map((option) => {
              const isSelected = selectedModel === option
              const isDefault = option === 'Gemini 2.5 Flash'

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedModel(option)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700 bg-slate-950/60 text-slate-200 hover:border-cyan-700 hover:text-cyan-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isSelected ? 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]' : 'bg-slate-500'
                      }`}
                    />
                    <span>{option}</span>
                    {isDefault ? (
                      <span className="rounded-md border border-cyan-700/70 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-cyan-300">
                        Default
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">Switch model if you hit rate limits</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm font-medium text-cyan-200 shadow-lg shadow-slate-950/70 transition hover:border-cyan-500/70 hover:bg-slate-800"
        aria-expanded={isOpen}
        aria-label="Toggle Gemini model selector"
      >
        <span className="text-base" aria-hidden="true">
          🤖
        </span>
        <span>AI Model</span>
      </button>
    </div>
  )
}

export default GeminiModelSelector
