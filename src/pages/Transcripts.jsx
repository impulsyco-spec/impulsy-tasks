import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { extractTasksFromTranscript } from '../lib/claude'
import { FileText, Sparkles, ChevronRight, X, Check, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Transcripts() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [transcripts, setTranscripts] = useState([])
  const [teams, setTeams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', team_id: '', meeting_date: new Date().toISOString().split('T')[0] })
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [saving, setSaving] = useState(false)
  const [currentTranscriptId, setCurrentTranscriptId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchTranscripts()
    fetchTeams()
  }, [profile])

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, team_members(profile_id, profiles(id, full_name))')
      .eq('organization_id', profile.organization_id)
    setTeams(data || [])
  }

  async function fetchTranscripts() {
    let query = supabase
      .from('transcripts')
      .select('*, profiles(full_name), tasks(id, title, status, assigned_to, profiles!tasks_assigned_to_fkey(full_name))')
      .eq('organization_id', profile.organization_id)

    // Si no es owner, filtrar por los equipos a los que pertenece
    if (profile.role !== 'owner') {
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('profile_id', profile.id)
      
      const teamIds = memberTeams?.map(mt => mt.team_id) || []
      query = query.in('team_id', teamIds)
    }

    const { data } = await query.order('meeting_date', { ascending: false })
    setTranscripts(data || [])
  }

  async function handleExtract(e) {
    e.preventDefault()
    setExtracting(true)
    setError('')
    try {
      const { data: transcript, error: tErr } = await supabase
        .from('transcripts')
        .insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          title: form.title,
          content: form.content,
          source: 'manual',
          team_id: form.team_id || null,
          meeting_date: form.meeting_date,
        })
        .select()
        .single()
      if (tErr) throw tErr
      setCurrentTranscriptId(transcript.id)

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

    const { data: insertedTasks } = await supabase.from('tasks').insert(toInsert).select()

    if (insertedTasks) {
      const memberNotifs = insertedTasks
        .filter(t => t.assigned_to && t.assigned_to !== profile.id)
        .map(t => ({
          user_id: t.assigned_to,
          task_id: t.id,
          message: `Se te asignó la tarea "${t.title}". Esperando aprobación.`,
        }))
      if (memberNotifs.length > 0) {
        await supabase.from('notifications').insert(memberNotifs)
      }
    }

    setSaving(false)
    setExtracted(null)
    setShowForm(false)
    setForm({ title: '', content: '', team_id: '', meeting_date: new Date().toISOString().split('T')[0] })
    fetchTranscripts() // Refrescar para ver las tareas vinculadas
    navigate('/tasks?filter=pending_approval')
  }

  // ... (toggleTask and updateTask functions kept the same)
  function teamMembers() {
    if (!form.team_id) return []
    const team = teams.find(t => t.id === form.team_id)
    return team?.team_members?.map(m => m.profiles).filter(Boolean) || []
  }
  function toggleTask(idx) {
    setExtracted(prev => prev.map((t, i) => i === idx ? { ...t, selected: !t.selected } : t))
  }
  function updateTask(idx, field, value) {
    setExtracted(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transcripts</h2>
          <p className="text-gray-500 mt-1">Sube reuniones y extrae tareas con IA</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setExtracted(null) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Sparkles size={15} />
          Nuevo transcript
        </button>
      </div>

      {/* Form */}
      {showForm && !extracted && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Subir transcript</h3>
          <form onSubmit={handleExtract} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la reunión</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Reunión semanal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de reunión</label>
                <input
                  type="date"
                  value={form.meeting_date}
                  onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo</label>
                <select
                  value={form.team_id}
                  onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin equipo</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                placeholder="Pega aquí el texto de la reunión..."
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={extracting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Sparkles size={14} />
                {extracting ? 'Analizando con Claude...' : 'Extraer tareas con IA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Extracted tasks review (kept mostly same) */}
      {extracted && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Tareas identificadas</h3>
              <p className="text-sm text-gray-500 mt-0.5">Revisa y selecciona las tareas a crear</p>
            </div>
            <span className="text-sm text-gray-500">{extracted.filter(t => t.selected).length} seleccionadas</span>
          </div>

          <div className="space-y-3 mb-6">
            {extracted.map((task, idx) => (
              <div key={idx} className={`border rounded-lg p-4 transition-colors ${task.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleTask(idx)} className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${task.selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                    {task.selected && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input type="text" value={task.title} onChange={e => updateTask(idx, 'title', e.target.value)} className="w-full text-sm font-medium bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-0" />
                    <textarea value={task.description} onChange={e => updateTask(idx, 'description', e.target.value)} rows={2} className="w-full text-sm text-gray-600 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none resize-none py-0" />
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Vence:</span>
                        <input type="date" value={task.due_date || ''} onChange={e => updateTask(idx, 'due_date', e.target.value)} className="text-xs text-gray-600 bg-transparent border-0 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Asignar a:</span>
                        <select value={task.assigned_to || ''} onChange={e => updateTask(idx, 'assigned_to', e.target.value)} className="text-xs text-gray-600 bg-transparent border-0 focus:outline-none cursor-pointer">
                          <option value="">Sin asignar</option>
                          {teamMembers().map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setExtracted(null); setShowForm(false) }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Descartar</button>
            <button onClick={handleSaveTasks} disabled={saving || extracted.filter(t => t.selected).length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Check size={14} />
              {saving ? 'Guardando...' : `Enviar ${extracted.filter(t => t.selected).length} tareas`}
            </button>
          </div>
        </div>
      )}

      {/* Transcripts list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historial de Reuniones</h3>
        </div>
        {transcripts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay reuniones registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transcripts.map(t => (
              <div key={t.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(t.meeting_date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Por {t.profiles?.full_name}
                        </p>
                      </div>
                    </div>
                    
                    {/* Tareas asociadas */}
                    {t.tasks && t.tasks.length > 0 && (
                      <div className="mt-4 pl-11 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tareas generadas ({t.tasks.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {t.tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-2 py-1.5 shadow-sm overflow-hidden">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                              <span className="text-xs text-gray-700 truncate flex-1">{task.title}</span>
                              {task.profiles?.full_name && (
                                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  {task.profiles.full_name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
