import { createContext, useContext, useMemo, useState } from 'react'

const GeminiModelContext = createContext(null)

export function GeminiModelProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash')

  const value = useMemo(
    () => ({
      selectedModel,
      setSelectedModel,
    }),
    [selectedModel],
  )

  return <GeminiModelContext.Provider value={value}>{children}</GeminiModelContext.Provider>
}

export function useGeminiModel() {
  const context = useContext(GeminiModelContext)
  if (!context) {
    throw new Error('useGeminiModel must be used within GeminiModelProvider.')
  }

  return context
}
