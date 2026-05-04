import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, CheckCircle2, Sparkles, User, Building2 } from 'lucide-react'
import Logo from '../components/Logo'

export default function Register({ onSwitch }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', orgName: '', orgAction: 'create' })
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
      let orgId

      if (form.orgAction === 'create') {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: form.orgName })
          .select()
          .single()
        if (orgError) throw orgError
        orgId = org.id
        await supabase.from('profiles').update({ organization_id: orgId, role: 'owner' }).eq('id', userId)
      } else {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', orgCode.trim())
          .single()
        if (orgError) throw new Error('Código de organización inválido')
        orgId = org.id
        await supabase.from('profiles').update({ organization_id: orgId, role: 'member' }).eq('id', userId)
      }
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-black font-sans text-white">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050505] border-r border-[#1c1c1c] flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[rgb(var(--primary))]/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Lleva tu agencia al <span className="text-[rgb(var(--primary))]">siguiente nivel.</span>
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-lg leading-relaxed font-medium">
            Crea una organización profesional, gestiona clientes y delega con total claridad.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          {[
            { t: 'Inteligencia Artificial', d: 'Extracción automática de tareas.' },
            { t: 'Gestión de Equipos', d: 'Roles de Owners y Managers.' },
            { t: 'Fácil Integración', d: 'Transcripts de cualquier plataforma.' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-[#0c0c0c]/60 backdrop-blur-sm border border-[#1c1c1c] p-4 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--primary))]/10 flex items-center justify-center flex-shrink-0 border border-[rgb(var(--primary))]/20">
                <CheckCircle2 size={20} className="text-[rgb(var(--primary))]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight">{item.t}</p>
                <p className="text-[rgb(var(--text-muted))] text-xs font-medium uppercase tracking-wider">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <Logo size="md" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-[rgb(var(--primary))] text-black shadow-[0_0_12px_rgba(18,252,217,0.3)]' : 'bg-[#0c0c0c] text-[rgb(var(--text-muted))]'}`}>1</div>
            <div className={`flex-1 h-0.5 rounded-full transition-all ${step >= 2 ? 'bg-[rgb(var(--primary))]' : 'bg-[#1c1c1c]'}`} />
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-[rgb(var(--primary))] text-black shadow-[0_0_12px_rgba(18,252,217,0.3)]' : 'bg-[#0c0c0c] text-[rgb(var(--text-muted))]'}`}>2</div>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {step === 1 ? 'Tu Cuenta' : 'Workspace'}
            </h1>
            <p className="text-[rgb(var(--text-muted))] text-sm font-semibold uppercase tracking-widest mt-2 flex items-center gap-2">
              {step === 1 ? <User size={14} /> : <Building2 size={14} />}
              {step === 1 ? 'Paso 1: Datos Personales' : 'Paso 2: Organización'}
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Nombre Completo</label>
                  <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)} required
                    className="w-full bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                    placeholder="Santiago Mejía" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Email Corporativo</label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                    className="w-full bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                    placeholder="tu@agencia.com" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Contraseña</label>
                  <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}
                    className="w-full bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                    placeholder="Mínimo 6 caracteres" />
                </div>
                <button type="submit" className="w-full bg-[rgb(var(--primary))] text-black rounded-2xl py-4 text-sm font-bold hover:bg-[#0dd4b8] transition-all shadow-lg shadow-[rgb(var(--primary))]/10 active:scale-[0.98]">
                  Siguiente Paso →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-3 p-1 bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl">
                  <button type="button" onClick={() => update('orgAction', 'create')}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${form.orgAction === 'create' ? 'bg-[#141414] text-[rgb(var(--primary))] border border-[#1c1c1c]' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}>
                    Crear
                  </button>
                  <button type="button" onClick={() => update('orgAction', 'join')}
                    className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${form.orgAction === 'join' ? 'bg-[#141414] text-[rgb(var(--primary))] border border-[#1c1c1c]' : 'text-[rgb(var(--text-muted))] hover:text-white'}`}>
                    Unirse
                  </button>
                </div>

                {form.orgAction === 'create' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Nombre de la Agencia</label>
                    <input type="text" value={form.orgName} onChange={e => update('orgName', e.target.value)} required
                      className="w-full bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                      placeholder="Impulsy Digital" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">ID de Organización</label>
                    <input type="text" value={orgCode} onChange={e => setOrgCode(e.target.value)} required
                      className="w-full bg-[#0c0c0c] border border-[#1c1c1c] rounded-2xl px-5 py-3.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                      placeholder="ID del owner" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                    <p className="text-red-400 text-xs font-bold leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center justify-center px-6 py-4 border border-[#1c1c1c] bg-[#0c0c0c] text-[rgb(var(--text-muted))] rounded-2xl text-sm font-bold hover:text-white transition-all">
                    <ArrowLeft size={18} />
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-[rgb(var(--primary))] text-black rounded-2xl py-4 text-sm font-bold hover:bg-[#0dd4b8] disabled:opacity-50 transition-all shadow-lg shadow-[rgb(var(--primary))]/10 active:scale-[0.98]">
                    {loading ? 'Preparando...' : 'Finalizar Registro'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-10 pt-8 border-t border-[#1c1c1c] text-center">
            <p className="text-sm text-[rgb(var(--text-muted))] font-medium">
              ¿Ya tienes cuenta?{' '}
              <button onClick={onSwitch} className="text-[rgb(var(--primary))] hover:text-[#0dd4b8] font-bold ml-1 transition-colors">
                Inicia Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
