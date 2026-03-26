import { Link, NavLink } from 'react-router-dom'

const navLinkBase =
  'rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white'

const navLinkActive = 'bg-cyan-500/20 text-cyan-300'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          D-Shield
        </Link>

        <div className="flex items-center gap-2">
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
      </nav>
    </header>
  )
}

export default Navbar
