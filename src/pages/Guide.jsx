import { useState } from 'react'
import { ChevronRight, ChevronLeft, UserPlus, Download, Bell, CheckSquare, Smartphone, Monitor } from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenido a Impulsy Tasks',
    subtitle: 'Tu plataforma de tareas del equipo',
    icon: CheckSquare,
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-[#0D1F3C] flex items-center justify-center mx-auto">
          <CheckSquare size={36} className="text-[#00B4D8]" />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
          Impulsy Tasks te permite ver las tareas asignadas por tu equipo, marcarlas como completadas y recibir notificaciones en tiempo real.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
          <p className="text-blue-800 text-sm font-medium">Necesitas:</p>
          <ul className="text-blue-700 text-sm mt-2 space-y-1 text-left">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" /> Un correo electrónico</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" /> El codigo de organizacion que te dieron</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" /> 2 minutos de tu tiempo</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'register',
    title: 'Paso 1: Crear tu cuenta',
    subtitle: 'Registrate en la plataforma',
    icon: UserPlus,
    content: (
      <div className="space-y-4">
        {/* Mock register screen */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden max-w-xs mx-auto shadow-lg">
          <div className="bg-[#0D1F3C] px-4 py-3 text-center">
            <p className="text-white font-bold text-sm">IMPULSY <span className="text-[#00B4D8]">TASKS</span></p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Nombre completo</p>
              <div className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-gray-50">Juan Perez</div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Correo electronico</p>
              <div className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-gray-50">juan@email.com</div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Contrasena</p>
              <div className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">********</div>
            </div>
            <div className="bg-blue-600 text-white text-center py-2.5 rounded-lg text-sm font-medium">
              Siguiente
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 max-w-xs mx-auto">
          <p className="text-yellow-800 text-xs">Usa un correo real - te llegara un email de confirmacion.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'org-code',
    title: 'Paso 2: Codigo de organizacion',
    subtitle: 'Unete al equipo de tu empresa',
    icon: UserPlus,
    content: (
      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden max-w-xs mx-auto shadow-lg">
          <div className="bg-[#0D1F3C] px-4 py-3 text-center">
            <p className="text-white font-bold text-sm">IMPULSY <span className="text-[#00B4D8]">TASKS</span></p>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-900 text-center">Unirse a organizacion</p>
            <p className="text-xs text-gray-500 text-center">Ingresa el codigo que te compartio tu administrador</p>
            <div>
              <p className="text-xs text-gray-500 mb-1">Codigo de organizacion</p>
              <div className="border-2 border-blue-400 rounded-lg px-3 py-2 text-xs text-gray-600 bg-blue-50 font-mono break-all">
                877a6435-0265-47a3-bfef-3fb25c03ddda
              </div>
            </div>
            <div className="bg-blue-600 text-white text-center py-2.5 rounded-lg text-sm font-medium">
              Crear cuenta
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 max-w-xs mx-auto">
          <p className="text-green-800 text-xs font-medium">Tu administrador te dara este codigo. Copialo y pegalo exactamente como te lo envien.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'install-ios',
    title: 'Paso 3a: Instalar en iPhone',
    subtitle: 'Agregar la app a tu pantalla de inicio',
    icon: Smartphone,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3 max-w-xs mx-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Monitor size={16} className="text-white" />
          </div>
          <p className="text-xs text-gray-600">Abre <span className="font-bold text-gray-900">Safari</span> y ve a:</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 max-w-xs mx-auto text-center">
          <p className="text-sm font-mono text-blue-600">impulsy-tasks.vercel.app</p>
        </div>

        {/* Step by step iOS */}
        <div className="max-w-xs mx-auto space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Toca el boton Compartir</p>
              <div className="mt-1.5 bg-gray-100 rounded-lg p-2 inline-flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-xs text-gray-500">Boton azul abajo en Safari</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Busca "Agregar a pantalla de inicio"</p>
              <div className="mt-1.5 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                  <span className="text-lg leading-none">+</span>
                </div>
                <span className="text-sm text-gray-800">Agregar a pantalla de inicio</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Toca "Agregar"</p>
              <div className="mt-1.5 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500">Cancelar</span>
                <span className="text-sm text-blue-600 font-semibold">Agregar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 max-w-xs mx-auto text-center">
          <p className="text-green-800 text-xs">La app aparecera en tu pantalla de inicio como cualquier otra app.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'install-android',
    title: 'Paso 3b: Instalar en Android',
    subtitle: 'Agregar la app a tu pantalla de inicio',
    icon: Smartphone,
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3 max-w-xs mx-auto">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
            <Monitor size={16} className="text-white" />
          </div>
          <p className="text-xs text-gray-600">Abre <span className="font-bold text-gray-900">Chrome</span> y ve a:</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 max-w-xs mx-auto text-center">
          <p className="text-sm font-mono text-blue-600">impulsy-tasks.vercel.app</p>
        </div>

        <div className="max-w-xs mx-auto space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Toca el menu (3 puntos)</p>
              <div className="mt-1.5 bg-gray-100 rounded-lg p-2 inline-flex items-center gap-1">
                <span className="text-lg text-gray-600 leading-none font-bold tracking-widest">...</span>
                <span className="text-xs text-gray-500">Arriba a la derecha</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Toca "Instalar aplicacion"</p>
              <div className="mt-1.5 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2">
                <Download size={16} className="text-gray-500" />
                <span className="text-sm text-gray-800">Instalar aplicacion</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-[#00B4D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Confirma tocando "Instalar"</p>
              <div className="mt-1.5 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center justify-end gap-3">
                <span className="text-sm text-gray-500">Cancelar</span>
                <span className="text-sm text-blue-600 font-semibold">Instalar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 max-w-xs mx-auto text-center">
          <p className="text-green-800 text-xs">Chrome instalara la app automaticamente en tu pantalla de inicio.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'Paso 4: Activar notificaciones',
    subtitle: 'No te pierdas ninguna tarea',
    icon: Bell,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center max-w-xs mx-auto">
          Cuando abras la app por primera vez, te pedira permiso para enviar notificaciones.
        </p>

        {/* Mock notification prompt */}
        <div className="max-w-xs mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <Bell size={24} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">"Impulsy Tasks" quiere enviarte notificaciones</p>
              <p className="text-xs text-gray-500">Las notificaciones pueden incluir alertas, sonidos e iconos de insignia.</p>
              <div className="flex border-t border-gray-200 -mx-5 mt-4">
                <div className="flex-1 py-3 text-sm text-gray-500 border-r border-gray-200">No permitir</div>
                <div className="flex-1 py-3 text-sm text-blue-600 font-semibold bg-blue-50">Permitir</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xs mx-auto space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-blue-800 text-xs font-medium">Toca "Permitir" para recibir:</p>
            <ul className="text-blue-700 text-xs mt-1.5 space-y-1">
              <li>- Nuevas tareas asignadas</li>
              <li>- Tareas aprobadas</li>
              <li>- Recordatorios de vencimiento</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'done',
    title: 'Listo!',
    subtitle: 'Ya puedes usar Impulsy Tasks',
    icon: CheckSquare,
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckSquare size={36} className="text-green-500" />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
          Tu cuenta esta lista. Abre la app desde tu pantalla de inicio y comienza a gestionar tus tareas.
        </p>
        <div className="max-w-xs mx-auto space-y-2">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1F3C] flex items-center justify-center flex-shrink-0">
              <CheckSquare size={18} className="text-[#00B4D8]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Dashboard</p>
              <p className="text-xs text-gray-500">Ve tus tareas pendientes</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1F3C] flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-[#00B4D8]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
              <p className="text-xs text-gray-500">Recibe alertas en tu celular</p>
            </div>
          </div>
        </div>
        <a
          href="/"
          className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Ir a Impulsy Tasks
        </a>
      </div>
    ),
  },
]

export default function Guide() {
  const [current, setCurrent] = useState(0)
  const step = STEPS[current]
  const Icon = step.icon
  const isLast = current === STEPS.length - 1
  const isFirst = current === 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-[#0D1F3C] px-5 py-4 text-center">
        <p className="text-white font-bold text-sm tracking-wide">IMPULSY <span className="text-[#00B4D8]">TASKS</span></p>
        <p className="text-slate-400 text-xs mt-0.5">Guia de inicio</p>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-colors ${
                i <= current ? 'bg-[#00B4D8]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">{current + 1} / {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#0D1F3C]/5 px-3 py-1.5 rounded-full mb-3">
            <Icon size={14} className="text-[#00B4D8]" />
            <span className="text-xs font-medium text-[#0D1F3C]">{step.subtitle}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{step.title}</h1>
        </div>
        {step.content}
      </div>

      {/* Navigation */}
      <div className="px-5 pb-6 flex gap-3">
        {!isFirst && (
          <button
            onClick={() => setCurrent(c => c - 1)}
            className="flex items-center gap-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
            Atras
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-3 bg-[#00B4D8] text-white rounded-xl text-sm font-semibold hover:bg-[#0096b4] transition-colors"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
