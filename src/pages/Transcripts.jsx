import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { extractTasksFromTranscript } from '../lib/claude'
import { FileText, Sparkles, ChevronRight, X, Check, Edit2, History, Send, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Transcripts() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [transcripts, setTranscripts] = useState([])
  const [teams, setTeams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', team_id: '' })
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null) // tareas extraídas para revisar
  const [saving, setSaving] = useState(false)
  const [currentTranscriptId, setCurrentTranscriptId] = useState(null)
  const [error, setError] = useState('')
  const [viewingTranscript, setViewingTranscript] = useState(null)
  const [viewingTasks, setViewingTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchTranscripts()
    fetchTeams()
  }, [profile])

  async function fetchTeams() {
    let query = supabase
      .from('teams')
      .select('id, name, team_members(profile_id, profiles(id, full_name))')
      .eq('organization_id', profile.organization_id)

    if (profile.role !== 'owner') {
      const myTeamIds = (profile.team_members || []).map(tm => tm.team_id)
      query = query.in('id', myTeamIds)
    }

    const { data } = await query
    setTeams(data || [])
  }

  // Miembros del equipo seleccionado (o todos si no hay equipo)
  function teamMembers() {
    if (!form.team_id) return []
    const team = teams.find(t => t.id === form.team_id)
    return team?.team_members?.map(m => m.profiles).filter(Boolean) || []
  }

  async function fetchTranscripts() {
    let query = supabase
      .from('transcripts')
      .select('*, profiles(full_name)')
      .eq('organization_id', profile.organization_id)

    if (profile.role !== 'owner') {
      const myTeamIds = (profile.team_members || []).map(tm => tm.team_id)
      query = query.in('team_id', myTeamIds)
    }

    const { data } = await query.order('created_at', { ascending: false })
    setTranscripts(data || [])
  }

  useEffect(() => {
    if (viewingTranscript) {
      fetchTasksForTranscript(viewingTranscript.id)
    } else {
      setViewingTasks([])
    }
  }, [viewingTranscript])

  async function fetchTasksForTranscript(transcriptId) {
    setLoadingTasks(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, assigned_user:profiles!tasks_assigned_to_fkey(full_name)')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false })
    
    setViewingTasks(data || [])
    setLoadingTasks(false)
  }

  async function handleExtract(e) {
    e.preventDefault()
    setExtracting(true)
    setError('')
    try {
      // Guardar transcript primero
      const { data: transcript, error: tErr } = await supabase
        .from('transcripts')
        .insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          title: form.title,
          content: form.content,
          source: 'manual',
          team_id: form.team_id || null,
        })
        .select()
        .single()
      if (tErr) throw tErr
      setCurrentTranscriptId(transcript.id)

      // Extraer tareas con Claude
      const result = await extractTasksFromTranscript(form.content)
      setExtracted(result.tasks.map(t => ({ ...t, selected: true, assigned_to: '' })))
      fetchTranscripts()
    } catch (err) {
      setError(err.message)
    }
    setExtracting(false)
  }

  async function handleSaveTasks() {
    setSaving(true)
    const selectedTasks = extracted.filter(t => t.selected)
    const toInsert = selectedTasks.map(t => ({
      organization_id: profile.organization_id,
      transcript_id: currentTranscriptId,
      created_by: profile.id,
      title: t.title,
      description: t.description,
      due_date: t.due_date || null,
      assigned_to: t.assigned_to || null,
      team_id: form.team_id || null,
      status: 'pending_approval',
    }))

    await supabase.from('tasks').insert(toInsert)

    // Notificar al owner/managers
    await supabase.from('notifications').insert({
      user_id: profile.id,
      message: `🤖 ${selectedTasks.length} tarea(s) extraídas del transcript "${form.title}" esperan aprobación.`,
    })

    setSaving(false)
    setExtracted(null)
    setShowForm(false)
    setForm({ title: '', content: '', team_id: '' })
    navigate('/tasks?filter=pending_approval')
  }

  function toggleTask(idx) {
    setExtracted(prev => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t))
  }

  function updateTask(idx, field, value) {
    setExtracted(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[rgb(var(--text-primary))] tracking-tight">Transcripts</h2>
          <p className="text-[rgb(var(--text-secondary))] mt-1 font-medium">Extrae inteligencia operativa de tus reuniones con IA</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setExtracted(null) }}
          className="flex items-center justify-center gap-2 bg-[rgb(var(--primary))] text-black px-6 py-3 rounded-2xl text-sm font-bold hover:bg-[#0dd4b8] transition-all shadow-lg shadow-[rgb(var(--primary))]/10 active:scale-95"
        >
          <Sparkles size={16} />
          Nuevo Análisis
        </button>
      </div>

      {/* Form */}
      {showForm && !extracted && (
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[rgb(var(--primary))]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 bg-[rgb(var(--primary))]/10 rounded-xl flex items-center justify-center border border-[rgb(var(--primary))]/20">
              <FileText size={20} className="text-[rgb(var(--primary))]" />
            </div>
            <div>
              <h3 className="font-black text-[rgb(var(--text-primary))] tracking-tight text-lg">Subir Reunión</h3>
              <p className="text-[rgb(var(--text-muted))] text-xs font-bold uppercase tracking-widest">IA Transcript Processor</p>
            </div>
          </div>

          <form onSubmit={handleExtract} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mb-2">Título de la reunión</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-2xl px-5 py-3 text-sm font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 focus:border-[rgb(var(--primary))]/50 transition-all placeholder:text-[rgb(var(--text-muted))]"
                  placeholder="Ej: Sprint Planning · Impulsy Q2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mb-2">Asignar a Equipo</label>
                <select
                  value={form.team_id}
                  onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                  className="w-full bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-2xl px-5 py-3 text-sm font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 focus:border-[rgb(var(--primary))]/50 transition-all cursor-pointer appearance-none"
                >
                  <option value="" className="bg-[rgb(var(--card))]">Sin equipo (General)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id} className="bg-[rgb(var(--card))]">{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mb-2">Contenido del Transcript</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                rows={12}
                className="w-full bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-2xl px-5 py-4 text-sm font-medium text-[rgb(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))]/50 focus:border-[rgb(var(--primary))]/50 resize-none font-mono leading-relaxed placeholder:text-[rgb(var(--text-muted))]"
                placeholder="Pega aquí el texto completo o fragmentos de la reunión..."
              />
            </div>
            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-xs font-bold border border-red-500/20">
                {error}
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-[rgb(var(--border))] rounded-2xl text-sm font-bold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--card-hover))] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={extracting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[rgb(var(--primary))] text-black rounded-2xl text-sm font-bold hover:bg-[#0dd4b8] disabled:opacity-50 transition-all shadow-lg shadow-[rgb(var(--primary))]/10"
              >
                <Sparkles size={16} className={extracting ? 'animate-pulse' : ''} />
                {extracting ? 'Análisis con Claude...' : 'Procesar Inteligencia IA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Extracted tasks review */}
      {extracted && (
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--success))]/20 rounded-2xl p-8 shadow-2xl shadow-[rgb(var(--success))]/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(var(--success))]/10 rounded-xl flex items-center justify-center border border-[rgb(var(--success))]/20">
                <Check size={20} className="text-[rgb(var(--success))]" />
              </div>
              <div>
                <h3 className="font-black text-[rgb(var(--text-primary))] tracking-tight text-lg">Tareas Identificadas</h3>
                <p className="text-[rgb(var(--text-muted))] text-xs font-bold uppercase tracking-widest">Revisión de Extracción</p>
              </div>
            </div>
            <div className="bg-[rgb(var(--card-hover))] px-4 py-2 rounded-xl border border-[rgb(var(--border))] shadow-sm">
              <span className="text-xs font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Seleccionadas: </span>
              <span className="text-sm font-black text-[rgb(var(--primary))]">{extracted.filter(t => t.selected).length} de {extracted.length}</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {extracted.map((task, idx) => (
              <div
                key={idx}
                className={`group border rounded-2xl p-5 transition-all duration-300 ${task.selected ? 'border-[rgb(var(--primary))]/30 bg-[rgb(var(--card-hover))]/50 shadow-xl shadow-black/20' : 'border-[rgb(var(--border))] bg-[#050505] opacity-40'}`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleTask(idx)}
                    className={`mt-1 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.selected ? 'bg-[rgb(var(--primary))] border-[rgb(var(--primary))]' : 'border-[rgb(var(--border-hover))] bg-[rgb(var(--background))]'}`}
                  >
                    {task.selected && <Check size={14} className="text-black" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={e => updateTask(idx, 'title', e.target.value)}
                      className="w-full text-base font-black text-[rgb(var(--text-primary))] bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--primary))] focus:outline-none py-1 transition-all"
                    />
                    <textarea
                      value={task.description}
                      onChange={e => updateTask(idx, 'description', e.target.value)}
                      rows={2}
                      className="w-full text-sm font-medium text-[rgb(var(--text-secondary))] bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--primary))] focus:outline-none resize-none py-1 transition-all"
                    />
                    <div className="flex items-center gap-6 flex-wrap pt-2">
                      <div className="flex items-center gap-2 bg-[rgb(var(--background))]/40 px-3 py-1.5 rounded-xl border border-[rgb(var(--border))]">
                        <Calendar size={12} className="text-[rgb(var(--text-muted))]" />
                        <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Vence:</span>
                        <input
                          type="date"
                          value={task.due_date || ''}
                          onChange={e => updateTask(idx, 'due_date', e.target.value)}
                          className="text-xs font-bold text-[rgb(var(--text-secondary))] bg-transparent border-0 focus:outline-none cursor-pointer invert brightness-200"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-[rgb(var(--background))]/40 px-3 py-1.5 rounded-xl border border-[rgb(var(--border))]">
                        <User size={12} className="text-[rgb(var(--text-muted))]" />
                        <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Responsable:</span>
                        <select
                          value={task.assigned_to || ''}
                          onChange={e => updateTask(idx, 'assigned_to', e.target.value)}
                          className="text-xs font-bold text-[rgb(var(--text-secondary))] bg-transparent border-0 focus:outline-none cursor-pointer"
                        >
                          <option value="" className="bg-[rgb(var(--card))]">Sin asignar</option>
                          {teamMembers().map(m => (
                            <option key={m.id} value={m.id} className="bg-[rgb(var(--card))]">{m.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { setExtracted(null); setShowForm(false) }}
              className="px-8 py-4 border border-[rgb(var(--border))] rounded-2xl text-sm font-bold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--card-hover))] transition-all"
            >
              Descartar Todo
            </button>
            <button
              onClick={handleSaveTasks}
              disabled={saving || extracted.filter(t => t.selected).length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[rgb(var(--primary))] text-black rounded-2xl text-sm font-black hover:bg-[#0dd4b8] disabled:opacity-50 transition-all shadow-xl shadow-[rgb(var(--primary))]/20"
            >
              <Send size={18} />
              {saving ? 'Guardando...' : `Enviar ${extracted.filter(t => t.selected).length} Tareas a Aprobación`}
            </button>
          </div>
        </div>
      )}

      {/* Transcripts list */}
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-[rgb(var(--border))] bg-[rgb(var(--card-hover))]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={18} className="text-[rgb(var(--text-muted))]" />
            <h3 className="font-black text-[rgb(var(--text-primary))] tracking-tight">Historial de Análisis</h3>
          </div>
          <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">{transcripts.length} registros</span>
        </div>
        {transcripts.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-[rgb(var(--card-hover))] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[rgb(var(--border))]">
              <FileText size={24} className="text-[rgb(var(--text-muted))]" />
            </div>
            <p className="text-[rgb(var(--text-muted))] font-bold uppercase tracking-widest text-xs">No hay registros aún</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1c1c1c]">
            {transcripts.map(t => (
              <div key={t.id} onClick={() => setViewingTranscript(t)} className="flex items-center gap-4 px-8 py-5 hover:bg-[rgb(var(--card-hover))]/50 transition-colors group cursor-pointer">
                <div className="w-10 h-10 bg-[rgb(var(--primary))]/5 rounded-xl flex items-center justify-center group-hover:bg-[rgb(var(--primary))]/10 border border-[rgb(var(--border))] transition-colors">
                  <FileText size={18} className="text-[rgb(var(--primary))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--primary))] transition-colors truncate">{t.title}</p>
                  <p className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mt-1 flex items-center gap-2">
                    <span className="text-[rgb(var(--primary))]">{t.profiles?.full_name}</span>
                    <span className="text-[#252525]">|</span>
                    {new Date(t.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--primary))] group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viewing Transcript Drawer */}
      {viewingTranscript && (
        <>
          <div className="fixed inset-0 bg-[rgb(var(--background))]/80 z-40 backdrop-blur-sm" onClick={() => setViewingTranscript(null)} />
          <div className="fixed right-0 top-0 h-full w-[600px] max-w-full z-50 bg-[rgb(var(--card))] border-l border-[rgb(var(--border))] flex flex-col shadow-2xl shadow-black animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--card-hover))]/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-[rgb(var(--primary))]/10 rounded-lg flex items-center justify-center border border-[rgb(var(--primary))]/20">
                    <FileText size={14} className="text-[rgb(var(--primary))]" />
                  </div>
                  <h2 className="text-xl font-black text-[rgb(var(--text-primary))]">{viewingTranscript.title}</h2>
                </div>
                <p className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest flex items-center gap-2">
                  <span className="text-[rgb(var(--primary))]">{viewingTranscript.profiles?.full_name}</span>
                  <span className="text-[#252525]">|</span>
                  {new Date(viewingTranscript.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <button onClick={() => setViewingTranscript(null)}
                className="w-8 h-8 rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] flex items-center justify-center hover:border-[#333] hover:text-[rgb(var(--text-primary))] transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#050505] space-y-6">
              <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 shadow-sm">
                <h4 className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest mb-4 border-b border-[rgb(var(--border))] pb-2">Contenido extraído</h4>
                <div className="whitespace-pre-wrap font-mono text-sm leading-loose text-[rgb(var(--text-primary))]">
                  {viewingTranscript.content}
                </div>
              </div>

              {/* Tareas generadas */}
              <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-[rgb(var(--border))] pb-2 mb-4">
                  <h4 className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-widest">Tareas Generadas</h4>
                  <span className="text-[10px] font-bold text-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 px-2 py-0.5 rounded-full">
                    {viewingTasks.length}
                  </span>
                </div>
                
                {loadingTasks ? (
                  <div className="text-center py-8 text-[rgb(var(--text-muted))] text-sm">Cargando tareas...</div>
                ) : viewingTasks.length === 0 ? (
                  <div className="text-center py-8 text-[rgb(var(--text-muted))] text-sm">No se generaron tareas para este transcript.</div>
                ) : (
                  <div className="space-y-3">
                    {viewingTasks.map(task => (
                      <div key={task.id} className="bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-xl p-4 transition-all hover:border-[#333]">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h5 className="font-bold text-[rgb(var(--text-primary))] text-sm">{task.title}</h5>
                            {task.description && (
                              <p className="text-xs text-[rgb(var(--text-muted))] mt-1 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md shrink-0
                            ${task.status === 'completed' ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]' : 
                              task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' : 
                              'bg-black/5 text-[rgb(var(--text-muted))]'}`}>
                            {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgb(var(--border))]">
                          {task.assigned_user ? (
                            <div className="text-[10px] font-bold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-[rgb(var(--primary))]/20 text-[rgb(var(--primary))] flex items-center justify-center">
                                {task.assigned_user.full_name.charAt(0).toUpperCase()}
                              </span>
                              {task.assigned_user.full_name}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">Sin asignar</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
