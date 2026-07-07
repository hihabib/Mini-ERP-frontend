import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'

interface ProductSearchBarProps {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

export function ProductSearchBar({ value, onChange, debounceMs = 400 }: ProductSearchBarProps) {
  const [local, setLocal] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setLocal(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(next), debounceMs)
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search products"
        placeholder="Search by name or SKU…"
        className="pl-9"
        value={local}
        onChange={handleChange}
      />
    </div>
  )
}
