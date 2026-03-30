import { Link } from 'react-router-dom'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function LandingPage() {
  const globalStats = [
    { label: 'Global Diabetics', value: '537M+', subtext: 'People affected worldwide', icon: '👥' },
    { label: 'India Diabetics', value: '74.2M', subtext: 'Estimated cases in India', icon: '🇮🇳' },
    { label: 'Annual Deaths', value: '6.7M', subtext: 'Diabetes-related deaths/year', icon: '⚠️' },
    { label: 'Cost Impact', value: '$327B', subtext: 'Global healthcare spending', icon: '💰' },
  ]

  const countryStats = [
    { country: 'China', percentage: 12.3, population: '~141M' },
    { country: 'India', percentage: 8.7, population: '~74M' },
    { country: 'USA', percentage: 10.4, population: '~37M' },
    { country: 'Brazil', percentage: 9.5, population: '~20M' },
    { country: 'Indonesia', percentage: 6.2, population: '~19M' },
    { country: 'Mexico', percentage: 14.2, population: '~13M' },
  ]

  const diabetesGrowth = [
    { year: '2000', cases: 151 },
    { year: '2005', cases: 194 },
    { year: '2010', cases: 285 },
    { year: '2015', cases: 415 },
    { year: '2020', cases: 463 },
    { year: '2025', cases: 537 },
  ]

  const riskFactors = [
    { name: 'Obesity', value: 80, color: '#ef4444' },
    { name: 'Sedentary', value: 65, color: '#f97316' },
    { name: 'Age 40+', value: 72, color: '#eab308' },
    { name: 'Family History', value: 300, color: '#3b82f6' },
  ]

  return (
    <div className="relative isolate overflow-hidden">
      {/* Enhanced Hero Section */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.25),transparent_40%),linear-gradient(135deg,rgba(2,6,23,0.95),rgba(30,41,59,0.8))]" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl items-center px-4 sm:px-6 py-8 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-200 backdrop-blur-sm mb-4 sm:mb-6 animate-pulse">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Diabetes Risk Assessment
            </div>

            <h1 className="mt-6 text-balance text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-white">
              Your Health, Our Priority
            </h1>

            <p className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300">
              Harness the power of AI to understand your diabetes risk in seconds. Early detection saves lives—take control of your health today.
            </p>

            <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap gap-4">
              <Link
                to="/predict"
                className="group relative rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-white transition hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-105 text-center"
              >
                Start Risk Assessment →
              </Link>
              <Link
                to="/diet-analyzer"
                className="rounded-xl border-2 border-slate-600 bg-slate-900/50 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-slate-100 transition hover:border-cyan-500 hover:bg-slate-800/80 backdrop-blur-sm text-center"
              >
                Analyze Your Diet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Global Stats Section with Animation */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">The Global Diabetes Crisis</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-lg">
              Understanding the scale of the challenge helps us appreciate the urgency of action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {globalStats.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 sm:p-8 hover:border-cyan-500/40 transition duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] group backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition" />
                <div className="relative">
                  <div className="text-3xl sm:text-4xl mb-3">{stat.icon}</div>
                  <div className="text-cyan-400 text-xs sm:text-sm font-semibold mb-2 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-2xl sm:text-4xl font-black text-white mb-2">{stat.value}</div>
                  <div className="text-slate-400 text-xs sm:text-sm">{stat.subtext}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diabetes Growth Chart */}
      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">Global Diabetes Growth Trend</h2>
            <p className="text-slate-400 text-sm sm:text-lg">Rising cases over 25 years (in millions)</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-4 sm:p-8 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={diabetesGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', r: 6 }}
                  activeDot={{ r: 8 }}
                  name="Cases (Millions)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* India Focus Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
                <span className="text-red-300 font-semibold text-xs sm:text-sm">🇮🇳 India's Challenge</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">India's Diabetes Epidemic</h2>
              
              <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-lg">
                India is home to the <span className="text-cyan-400 font-semibold">second-largest diabetic population</span> in the world, with an estimated <span className="text-red-400 font-bold">74.2 million people</span> living with diabetes.
              </p>
              
              <p className="text-slate-300 mb-4 leading-relaxed text-sm sm:text-lg">
                This represents approximately <span className="text-orange-400 font-semibold">8.7% of India's adult population</span>. The rapid rise is driven by urbanization, sedentary lifestyles, and dietary changes.
              </p>
              
              <p className="text-slate-300 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-lg">
                Unlike developed nations, India faces unique challenges in managing diabetes within resource constraints. Early detection is critical.
              </p>

              <div className="space-y-3">
                {[
                  '70-90% of Type 2 cases are preventable',
                  'Early detection can delay onset by 5-10 years',
                  'Lifestyle changes can reduce risk by 58%'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-300 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src="https://imgs.search.brave.com/vhtCD5ELfrcTZ-oZTh8TSnTXiq832KLbbq8PG9Mu39U/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9waGFy/bWVhc3kuaW4vcmVz/ZWFyY2gvaW1hZ2Vz/L2RpYWJldGVzL0Ny/ZWF0aXZlMTIud2Vi/cA"
                alt="Healthcare and wellness"
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Countries by Diabetes Rate with Bar Chart */}
      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">Diabetes Prevalence by Country</h2>
            <p className="text-slate-400 text-sm sm:text-lg">Which countries are most affected?</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-4 sm:p-8 backdrop-blur-sm mb-8 sm:mb-12">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={countryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="country" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="percentage" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {countryStats.map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800/30 to-slate-900/30 p-4 sm:p-6 hover:border-cyan-500/30 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{stat.country}</h3>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">{stat.percentage.toFixed(1)}%</div>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mt-3 font-semibold">{stat.population} cases</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prevention Section */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <img
                src="https://imgs.search.brave.com/t-D6AtiDGbSYeisftz8Gm4LAitrH2lA_FFr3HnLOsUM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTcy/Njk2OTk2L3Bob3Rv/L2EtcGljdHVyZS1v/Zi1waWxscy1hbmQt/ZGlhYmV0aWMtc3Vw/cGxpZXMuanBnP3M9/NjEyeDYxMiZ3PTAm/az0yMCZjPWtLZ2Qz/R3JqRXJZWjl6QVY0/VXlBc1dUcEdKaHRj/ZnZMU0hJTG9oYUE0/RlE9"
                alt="Healthy lifestyle and fitness"
                className="w-full h-64 sm:h-96 object-cover"
              />
            </div>

            <div>
              <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg mb-4">
                <span className="text-green-300 font-semibold text-xs sm:text-sm">✓ Prevention & Control</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">Prevent Diabetes Today</h2>

              <div className="space-y-4 mb-6 sm:mb-8">
                {[
                  { title: 'Regular Exercise', desc: '150 mins/week reduces risk by 58%' },
                  { title: 'Healthy Diet', desc: 'High fiber, low processed foods' },
                  { title: 'Weight Management', desc: '5-10% weight loss shows benefits' },
                  { title: 'Sleep & Stress', desc: '7-9 hours daily, stress reduction' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm sm:text-base">{item.title}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
                D-Shield helps you monitor these factors and track your progress towards better health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Factors Pie Chart */}
      <section className="py-16 sm:py-24 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4">Major Risk Factor Impact</h2>
            <p className="text-slate-400 text-sm sm:text-lg">Relative contribution to diabetes risk</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/50 p-4 sm:p-8 backdrop-blur-sm flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={riskFactors}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskFactors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6">
              {riskFactors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div 
                    className="w-4 h-4 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: factor.color }}
                  ></div>
                  <div>
                    <h3 className="text-white font-bold text-base sm:text-lg mb-1">{factor.name}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {factor.name === 'Obesity' && 'Excess weight increases insulin resistance'}
                      {factor.name === 'Sedentary' && 'Physical inactivity significantly raises risk'}
                      {factor.name === 'Age 40+' && 'Risk increases substantially after 40 years'}
                      {factor.name === 'Family History' && 'Genetic predisposition is a major factor'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 bg-gradient-to-b from-slate-950 to-slate-950">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand Section */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">D-Shield</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                AI-powered diabetes risk assessment platform helping millions understand their health better.
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/" className="w-10 h-10 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center transition text-xs sm:text-sm">
                  <span>f</span>
                </a>
                <a href="https://x.com/" className="w-10 h-10 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center transition text-xs sm:text-sm">
                  <span>𝕏</span>
                </a>
                <a href="https://www.linkedin.com/" className="w-10 h-10 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center transition text-xs sm:text-sm">
                  <span>in</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center transition text-xs sm:text-sm">
                  <span>✓</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs sm:text-sm tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/predict" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Risk Assessment
                  </Link>
                </li>
                <li>
                  <Link to="/diet-analyzer" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Diet Analyzer
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs sm:text-sm tracking-wider">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Health Articles
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Research Papers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Support Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Company */}
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-xs sm:text-sm tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition text-xs sm:text-sm">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800/50 mb-6 sm:mb-8"></div>

          {/* Bottom Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-slate-400">
            <div>
              <p>© 2024 D-Shield. All rights reserved. | Made with ❤️ for better health.</p>
            </div>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <a href="#" className="hover:text-cyan-400 transition">Security</a>
              <a href="#" className="hover:text-cyan-400 transition">Accessibility</a>
              <a href="#" className="hover:text-cyan-400 transition">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
