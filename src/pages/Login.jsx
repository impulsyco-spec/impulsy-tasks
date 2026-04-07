import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D1F3C] flex-col justify-between p-12">
        <Logo size="lg" dark />
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Convierte reuniones<br />en acción real.
          </h2>
          <p className="text-slate-400 text-base">
            Sube el transcript, la IA extrae las tareas,<br />tu equipo las ejecuta.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1">
            <p className="text-[#00B4D8] font-bold text-xl mb-1">IA</p>
            <p className="text-slate-400 text-sm">Extracción automática de tareas desde reuniones</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex-1">
            <p className="text-[#00B4D8] font-bold text-xl mb-1">Equipos</p>
            <p className="text-slate-400 text-sm">Clientes y miembros organizados por equipo</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-[#0D1F3C] mb-1">Bienvenido de vuelta</h1>
          <p className="text-gray-500 text-sm mb-8">Ingresa a tu cuenta</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D1F3C] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#163060] disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <button onClick={onSwitch} className="text-[#00B4D8] hover:underline font-semibold">
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
