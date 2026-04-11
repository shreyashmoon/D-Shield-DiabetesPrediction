import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const navLinkBase =
  'block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white'

const navLinkActive = 'bg-cyan-500/20 text-cyan-300'

const RECENT_PREDICTIONS_STORAGE_KEY = 'dshield-recent-predictions'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentPredictions, setRecentPredictions] = useState([])
  const location = useLocation()
  const isPredictPage = location.pathname === '/predict'

  useEffect(() => {
    const syncRecentPredictions = () => {
      try {
        const storedHistory = window.localStorage.getItem(RECENT_PREDICTIONS_STORAGE_KEY)
        const parsedHistory = storedHistory ? JSON.parse(storedHistory) : []
        setRecentPredictions(Array.isArray(parsedHistory) ? parsedHistory : [])
      } catch {
        setRecentPredictions([])
      }
    }

    syncRecentPredictions()

    const handleRecentPredictionsUpdated = (event) => {
      if (Array.isArray(event.detail)) {
        setRecentPredictions(event.detail)
      } else {
        syncRecentPredictions()
      }
    }

    window.addEventListener('dshield-recent-predictions-updated', handleRecentPredictionsUpdated)
    window.addEventListener('storage', syncRecentPredictions)

    return () => {
      window.removeEventListener('dshield-recent-predictions-updated', handleRecentPredictionsUpdated)
      window.removeEventListener('storage', syncRecentPredictions)
    }
  }, [])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const handlePresetClick = (entry) => {
    closeMenu()
    window.dispatchEvent(
      new CustomEvent('dshield-mobile-preset-select', {
        detail: entry,
      }),
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 text-lg sm:text-xl font-bold tracking-tight text-white">
          D-Shield
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/predict"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : ''}`
            }
          >
            Prediction
          </NavLink>
          <NavLink
            to="/diet-analyzer"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? navLinkActive : ''}`
            }
          >
            Diet Analyzer
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none transition"
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[73px] z-40 md:hidden"
          onClick={closeMenu}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" />

          {/* Slide-in Menu */}
          <div
            className="absolute right-0 top-0 w-full max-w-xs h-screen bg-slate-900/95 border-l border-slate-800 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-full duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-8 space-y-2 h-full overflow-y-auto">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${navLinkBase} block rounded-lg p-3 font-semibold text-base ${isActive ? navLinkActive : ''}`
                }
                onClick={closeMenu}
              >
                Home
              </NavLink>
              <NavLink
                to="/predict"
                className={({ isActive }) =>
                  `${navLinkBase} block rounded-lg p-3 font-semibold text-base ${isActive ? navLinkActive : ''}`
                }
                onClick={closeMenu}
              >
                Prediction
              </NavLink>
              <NavLink
                to="/diet-analyzer"
                className={({ isActive }) =>
                  `${navLinkBase} block rounded-lg p-3 font-semibold text-base ${isActive ? navLinkActive : ''}`
                }
                onClick={closeMenu}
              >
                Diet Analyzer
              </NavLink>

              {isPredictPage && recentPredictions.length > 0 ? (
                <div className="mt-5 border-t border-slate-800 pt-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recent Predictions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentPredictions.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handlePresetClick(entry)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-cyan-700/40 bg-cyan-950/80 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-900/90 hover:text-white"
                      >
                        <span aria-hidden="true">👤</span>
                        <span className="truncate">{entry.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
