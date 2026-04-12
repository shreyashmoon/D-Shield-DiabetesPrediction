import { BrowserRouter, Route, Routes } from 'react-router-dom'

import GeminiModelSelector from './components/GeminiModelSelector'
import Navbar from './components/Navbar'
import { GeminiModelProvider } from './context/GeminiModelContext'
import DietAnalyzerPage from './pages/DietAnalyzerPage'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'

function App() {
  return (
    <GeminiModelProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/predict" element={<PredictionPage />} />
              <Route path="/diet-analyzer" element={<DietAnalyzerPage />} />
            </Routes>
          </main>
          <GeminiModelSelector />
        </div>
      </BrowserRouter>
    </GeminiModelProvider>
  )
}

export default App
