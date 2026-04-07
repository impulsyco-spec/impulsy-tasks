export default function Logo({ size = 'md', dark = false }) {
  const sizes = {
    sm: { impulsy: 'text-lg', tasks: 'text-lg' },
    md: { impulsy: 'text-2xl', tasks: 'text-2xl' },
    lg: { impulsy: 'text-4xl', tasks: 'text-4xl' },
    xl: { impulsy: 'text-5xl', tasks: 'text-5xl' },
  }
  const s = sizes[size]

  return (
    <div className="leading-none">
      <span className={`font-black uppercase tracking-tight ${s.impulsy} ${dark ? 'text-white' : 'text-[#0D1F3C]'}`}>
        IMPULSY
      </span>
      <br />
      <span className={`font-black uppercase tracking-tight ${s.tasks} text-[#00B4D8]`}>
        TASKS
      </span>
    </div>
  )
}
