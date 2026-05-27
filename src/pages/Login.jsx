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
    <div className="min-h-screen flex bg-[rgb(var(--background))] font-sans text-[rgb(var(--text-primary))]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050505] border-r border-[rgb(var(--border))] flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[rgb(var(--primary))]/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-black text-[rgb(var(--text-primary))] leading-[1.1] mb-6 tracking-tight">
            Gestión inteligente de <span className="text-[rgb(var(--primary))]">tareas y equipos.</span>
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-lg leading-relaxed font-medium">
            Impulsy Task combina IA avanzada con una interfaz Clean Tech para maximizar la productividad de tu agencia.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 flex-1 hover:border-[rgb(var(--primary))]/30 transition-all">
            <div className="w-10 h-10 bg-[rgb(var(--primary))]/10 rounded-xl flex items-center justify-center mb-3 border border-[rgb(var(--primary))]/20">
              <Zap size={20} className="text-[rgb(var(--primary))]" />
            </div>
            <p className="text-[rgb(var(--text-primary))] font-bold text-sm uppercase tracking-widest mb-1">IA Activa</p>
            <p className="text-[rgb(var(--text-muted))] text-xs font-medium leading-relaxed uppercase tracking-wider">Extracción de tareas inteligente</p>
          </div>
          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 flex-1 hover:border-[rgb(var(--primary))]/30 transition-all">
             <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3 border border-indigo-500/20">
              <Users size={20} className="text-indigo-400" />
            </div>
            <p className="text-[rgb(var(--text-primary))] font-bold text-sm uppercase tracking-widest mb-1">Equipos</p>
            <p className="text-[rgb(var(--text-muted))] text-xs font-medium leading-relaxed uppercase tracking-wider">Colaboración de alto nivel</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[rgb(var(--background))]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <Logo size="md" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">Bienvenido</h1>
            <p className="text-[rgb(var(--text-muted))] text-sm font-semibold uppercase tracking-widest mt-2">Acceso a tu Workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl px-5 py-3.5 text-sm font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 focus:border-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                placeholder="tu@agencia.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl px-5 py-3.5 text-sm font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 focus:border-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
                <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[rgb(var(--primary))] text-black rounded-2xl py-4 text-sm font-bold hover:bg-[#0dd4b8] disabled:opacity-50 transition-all shadow-lg shadow-[rgb(var(--primary))]/10 active:scale-[0.98]"
            >
              {loading ? 'Procesando...' : 'Entrar ahora'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[rgb(var(--border))] text-center">
            <p className="text-sm text-[rgb(var(--text-muted))] font-medium">
              ¿Eres nuevo?{' '}
              <button onClick={onSwitch} className="text-[rgb(var(--primary))] hover:text-[#0dd4b8] font-bold ml-1 transition-colors">
                Crea una cuenta gratis
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
