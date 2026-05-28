export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }
  const s = sizes[size] || sizes.md

  return (
    <div className={`flex items-baseline gap-1.5 leading-none select-none ${s} ${className}`}>
      <span className="font-black tracking-tighter text-current">
        IMPULSY
      </span>
      <span className="font-black tracking-tighter text-[rgb(var(--primary))]">
        TASKS
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--primary))]" />
    </div>
  )
}
