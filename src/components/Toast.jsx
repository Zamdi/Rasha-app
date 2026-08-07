import { useStaff } from '../context/StaffContext'

export default function Toast() {
  const { toast } = useStaff()
  if (!toast) return null
  return (
    <div key={toast.id}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl text-sm font-bold shadow-xl animate-fade-in whitespace-nowrap ${
        toast.type === 'error'
          ? 'bg-error-container text-error border border-error/30'
          : 'hydro-gradient text-white border border-secondary-fixed/30'
      }`}>
      {toast.msg}
    </div>
  )
}
