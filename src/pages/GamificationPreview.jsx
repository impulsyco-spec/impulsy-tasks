import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Zap, Star } from 'lucide-react';

const STAGES = [
  {
    level: 1,
    name: 'Robot Oxidado',
    description: 'Un comienzo humilde. Está un poco viejo pero tiene muchas ganas de trabajar.',
    image: 'https://img.freepik.com/premium-photo/rusty-robot-standing-white-background_931878-223403.jpg', // Fallback if local fails
    localImage: '/C:/Users/scmej/.gemini/antigravity/brain/d8fa0da1-aa76-4c5c-9dc1-8c8f372a61c4/impulsor_lvl1_rusty_1777323202267.png'
  },
  {
    level: 2,
    name: 'Robot Funcional',
    description: 'Limpio, pulido y listo para la acción. La productividad empieza a notarse.',
    image: 'https://img.freepik.com/premium-photo/cute-robot-white-background_931878-223405.jpg',
    localImage: '/C:/Users/scmej/.gemini/antigravity/brain/d8fa0da1-aa76-4c5c-9dc1-8c8f372a61c4/impulsor_lvl2_clean_1777323432181.png'
  },
  {
    level: 3,
    name: 'Robot Avanzado',
    description: 'Con alas de energía holográfica. ¡Ahora vuela a través de las tareas!',
    image: 'https://img.freepik.com/premium-photo/futuristic-robot-with-wings-white-background_931878-223410.jpg',
    localImage: '/C:/Users/scmej/.gemini/antigravity/brain/d8fa0da1-aa76-4c5c-9dc1-8c8f372a61c4/impulsor_lvl3_advanced_1777323447710.png'
  },
  {
    level: 4,
    name: 'Robot Dorado',
    description: 'Máximo rendimiento y estilo. Un líder en eficiencia.',
    image: 'https://img.freepik.com/premium-photo/golden-robot-white-background_931878-223415.jpg',
    localImage: '/C:/Users/scmej/.gemini/antigravity/brain/d8fa0da1-aa76-4c5c-9dc1-8c8f372a61c4/impulsor_lvl4_futuristic_1777323463321.png'
  },
  {
    level: 5,
    name: 'Entidad Suprema',
    description: 'El dios de la productividad. Hecho de luz pura y cristal cósmico.',
    image: 'https://img.freepik.com/premium-photo/cosmic-robot-entity-white-background_931878-223420.jpg',
    localImage: '/C:/Users/scmej/.gemini/antigravity/brain/d8fa0da1-aa76-4c5c-9dc1-8c8f372a61c4/impulsor_lvl5_god_1777323479085.png'
  }
];

export default function GamificationPreview() {
  const [current, setCurrent] = useState(0);
  const stage = STAGES[current];

  return (
    <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-yellow-400 text-[#0D1F3C] px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg">
            <Star size={12} fill="currentColor" />
            NIVEL {stage.level}
          </div>
        </div>

        <div className="h-80 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src={stage.image} 
            alt={stage.name}
            className="w-64 h-64 object-contain drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.src = stage.image }}
          />
          
          <button 
            onClick={() => setCurrent(prev => (prev === 0 ? STAGES.length - 1 : prev - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:scale-110 transition-all shadow-md"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => setCurrent(prev => (prev === STAGES.length - 1 ? 0 : prev + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:scale-110 transition-all shadow-md"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">{stage.name}</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {stage.description}
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {STAGES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-blue-500' : 'w-2 bg-gray-200'}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase">Recompensa</span>
              </div>
              <div className="text-lg font-black text-[#0D1F3C]">+10 XP</div>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
              <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                <Trophy size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase">Progreso</span>
              </div>
              <div className="text-lg font-black text-[#0D1F3C]">5 Etapas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
