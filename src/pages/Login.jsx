import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import { Sparkles, Users, Zap } from 'lucide-react'

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 border-r border-slate-100 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
            Gestión inteligente de <span className="text-blue-600">tareas y equipos.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            Impulsy Task combina IA avanzada con una interfaz Clean Tech para maximizar la productividad de tu agencia.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-6 flex-1 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Zap size={20} className="text-blue-600" />
            </div>
            <p className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-1">IA Activa</p>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">Extracción de tareas inteligente</p>
          </div>
          <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl p-6 flex-1 hover:shadow-md transition-shadow">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
              <Users size={20} className="text-indigo-600" />
            </div>
            <p className="text-slate-900 font-bold text-sm uppercase tracking-widest mb-1">Equipos</p>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">Colaboración de alto nivel</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <Logo size="md" />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido</h1>
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mt-2">Acceso a tu Workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 transition-all placeholder:text-slate-300"
                placeholder="tu@agencia.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
                <p className="text-red-600 text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-2xl py-4 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? 'Procesando...' : 'Entrar ahora'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-400 font-medium">
              ¿Eres nuevo?{' '}
              <button onClick={onSwitch} className="text-blue-600 hover:text-blue-700 font-bold ml-1 transition-colors">
                Crea una cuenta gratis
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

