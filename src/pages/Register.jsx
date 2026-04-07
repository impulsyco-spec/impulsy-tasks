import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function Register({ onSwitch }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [orgCode, setOrgCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (authError) throw authError

      const userId = authData.user.id

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', orgCode.trim())
        .single()
      if (orgError) throw new Error('Código de organización inválido')

      await supabase
        .from('profiles')
        .update({ organization_id: org.id, role: 'member' })
        .eq('id', userId)
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D1F3C] flex-col justify-between p-12">
        <Logo size="lg" dark />
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Únete a tu equipo.
          </h2>
          <p className="text-slate-400 text-base">
            Pide el ID de organización a tu manager<br />y empieza a gestionar tus tareas hoy.
          </p>
        </div>
        <div className="space-y-3">
          {['Recibe tareas asignadas desde reuniones', 'Notificaciones push en tu celular', 'Confirma tareas completadas'].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#00B4D8] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-slate-300 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-[#0D1F3C] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`flex-1 h-0.5 transition-colors ${step >= 2 ? 'bg-[#00B4D8]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-[#0D1F3C] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>

          <h1 className="text-2xl font-bold text-[#0D1F3C] mb-1">
            {step === 1 ? 'Crear cuenta' : 'Unirte al equipo'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {step === 1 ? 'Paso 1 de 2 — Datos personales' : 'Paso 2 de 2 — ID de tu organización'}
          </p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                  <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm"
                    placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm"
                    placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm"
                    placeholder="Mínimo 6 caracteres" />
                </div>
                <button type="submit" className="w-full bg-[#0D1F3C] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#163060] transition-colors shadow-sm">
                  Continuar →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ID de la organización</label>
                  <input type="text" value={orgCode} onChange={e => setOrgCode(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent bg-white shadow-sm font-mono"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  <p className="text-xs text-gray-400 mt-1.5">Pídelo a tu manager o al owner de la organización</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    <ArrowLeft size={14} /> Atrás
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[#0D1F3C] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#163060] disabled:opacity-50 transition-colors shadow-sm">
                    {loading ? 'Uniéndose...' : 'Unirme al equipo'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <button onClick={onSwitch} className="text-[#00B4D8] hover:underline font-semibold">
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
