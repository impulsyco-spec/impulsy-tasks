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
  const [form, setForm] = useState({ title: '', content: '', team_id: '' })
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null) // tareas extraídas para revisar
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

  // Miembros del equipo seleccionado (o todos si no hay equipo)
  function teamMembers() {
    if (!form.team_id) return []
    const team = teams.find(t => t.id === form.team_id)
    return team?.team_members?.map(m => m.profiles).filter(Boolean) || []
  }

  async function fetchTranscripts() {
    const { data } = await supabase
      .from('transcripts')
      .select('*, profiles(full_name)')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
    setTranscripts(data || [])
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

    // Notificar al owner
    await supabase.from('notifications').insert({
      user_id: profile.id,
      task_id: toInsert[0] ? undefined : undefined,
      message: `${selectedTasks.length} tarea(s) extraídas del transcript "${form.title}" esperan aprobación.`,
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
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la reunión</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Reunión semanal Impulsy - 7 abril"
                />
              </div>
              <div className="w-44">
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

      {/* Extracted tasks review */}
      {extracted && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Tareas identificadas</h3>
              <p className="text-sm text-gray-500 mt-0.5">Revisa, edita y selecciona las tareas a crear</p>
            </div>
            <span className="text-sm text-gray-500">{extracted.filter(t => t.selected).length} de {extracted.length} seleccionadas</span>
          </div>

          <div className="space-y-3 mb-6">
            {extracted.map((task, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 transition-colors ${task.selected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(idx)}
                    className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${task.selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}
                  >
                    {task.selected && <Check size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={e => updateTask(idx, 'title', e.target.value)}
                      className="w-full text-sm font-medium bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none py-0"
                    />
                    <textarea
                      value={task.description}
                      onChange={e => updateTask(idx, 'description', e.target.value)}
                      rows={2}
                      className="w-full text-sm text-gray-600 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none resize-none py-0"
                    />
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Vence:</span>
                        <input
                          type="date"
                          value={task.due_date || ''}
                          onChange={e => updateTask(idx, 'due_date', e.target.value)}
                          className="text-xs text-gray-600 bg-transparent border-0 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Asignar a:</span>
                        {task.assigned_name && (
                          <span className="text-xs text-blue-500 font-medium">{task.assigned_name} →</span>
                        )}
                        <select
                          value={task.assigned_to || ''}
                          onChange={e => updateTask(idx, 'assigned_to', e.target.value)}
                          className="text-xs text-gray-600 bg-transparent border-0 focus:outline-none cursor-pointer"
                        >
                          <option value="">Sin asignar</option>
                          {teamMembers().map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setExtracted(null); setShowForm(false) }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSaveTasks}
              disabled={saving || extracted.filter(t => t.selected).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Check size={14} />
              {saving ? 'Guardando...' : `Enviar ${extracted.filter(t => t.selected).length} tareas a aprobación`}
            </button>
          </div>
        </div>
      )}

      {/* Transcripts list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historial</h3>
        </div>
        {transcripts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay transcripts aún</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transcripts.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-3">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.profiles?.full_name} · {new Date(t.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
