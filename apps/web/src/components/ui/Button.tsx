'use client'

export default function Button({ children, ...props }: { children: any }) {
  return (
    <button
      className="bg-amber-500 hover:bg-amber-600 text-white rounded px-4 py-2"
      {...props}
    >
      {children}
    </button>
  )
}
