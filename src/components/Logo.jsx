export default function Logo({ size = 'md', dark = false }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }
  const s = sizes[size]

  return (
    <div className={`flex items-baseline gap-1.5 leading-none select-none ${s}`}>
      <span className={`font-black tracking-tighter ${dark ? 'text-white' : 'text-slate-900'}`}>
        IMPULSY
      </span>
      <span className="font-black tracking-tighter text-blue-600">
        TASKS
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
    </div>
  )
}
