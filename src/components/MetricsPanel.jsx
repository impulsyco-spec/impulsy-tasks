import { useEffect, useRef } from 'react'

const CHART_DEFAULTS = {
  color: '#707070',
  plugins: { legend: { display: false }, tooltip: {
    backgroundColor: '#141414', borderColor: '#252525', borderWidth: 1,
    titleColor: '#c8c8c8', bodyColor: '#707070', padding: 10
  }},
  scales: {
    x: { grid: { color: '#1c1c1c' }, ticks: { color: '#404040', font: { size: 11 } } },
    y: { grid: { color: '#1c1c1c' }, ticks: { color: '#404040', font: { size: 11 } }, beginAtZero: true },
  }
}

function useChart(ref, config) {
  useEffect(() => {
    if (!ref.current || !window.Chart) return
    const chart = new window.Chart(ref.current, config)
    return () => chart.destroy()
  }, [])
}

export default function MetricsPanel({ tareas = [] }) {
  const lineRef   = useRef()
  const donutRef  = useRef()
  const barsRef   = useRef()

  // Gráfico línea — completadas por semana
  useChart(lineRef, {
    type: 'line',
    data: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Esta sem'],
      datasets: [{
        data: [4, 7, 5, 8],
        borderColor: '#12fcd9',
        backgroundColor: (ctx) => {
          if (!ctx.chart.ctx) return 'rgba(18,252,217,0.15)'
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,200)
          g.addColorStop(0, 'rgba(18,252,217,0.15)')
          g.addColorStop(1, 'rgba(18,252,217,0)')
          return g
        },
        borderWidth: 2, pointBackgroundColor: '#12fcd9',
        pointRadius: 4, tension: 0.4, fill: true,
      }]
    },
    options: { ...CHART_DEFAULTS, responsive: true, maintainAspectRatio: false }
  })

  // Gráfico dona — distribución estados
  useChart(donutRef, {
    type: 'doughnut',
    data: {
      labels: ['Completadas','En progreso','Urgentes','Por aprobar'],
      datasets: [{
        data: [4, 3, 2, 1],
        backgroundColor: ['#34d399','#12fcd9','#ff4545','#f5a623'],
        borderWidth: 0, hoverOffset: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '72%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: '#707070', font: { size: 11 }, padding: 16, boxWidth: 10, usePointStyle: true } },
        tooltip: CHART_DEFAULTS.plugins.tooltip,
      }
    }
  })

  // Barras horizontales — por integrante
  useChart(barsRef, {
    type: 'bar',
    data: {
      labels: ['Luz Ramírez', 'Carlos M.', 'Sin asignar'],
      datasets: [{
        data: [75, 50, 0],
        backgroundColor: 'rgba(18,252,217,0.15)',
        borderColor: '#12fcd9',
        borderWidth: 1, borderRadius: 5,
      }]
    },
    options: {
      ...CHART_DEFAULTS,
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ...CHART_DEFAULTS.scales.x, max: 100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: v => v + '%' } },
        y: { ...CHART_DEFAULTS.scales.y, grid: { display: false } }
      }
    }
  })

  return (
    <div className="space-y-4">

      {/* Fila superior: línea + dona */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#404040] mb-4">
            Tareas completadas por semana
          </p>
          <div style={{ height: 180 }}>
            <canvas ref={lineRef} />
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#404040] mb-4">
            Estado actual
          </p>
          <div style={{ height: 180 }}>
            <canvas ref={donutRef} />
          </div>
        </div>
      </div>

      {/* Fila inferior: barras equipo */}
      <div className="bg-[#0c0c0c] border border-[#1c1c1c] rounded-[12px] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#404040] mb-4">
          Progreso por integrante
        </p>
        <div style={{ height: 120 }}>
          <canvas ref={barsRef} />
        </div>
      </div>
    </div>
  )
}
