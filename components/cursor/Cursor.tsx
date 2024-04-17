import CursorSVG from '@/public/assets/CursorSVG'
import React from 'react'

type props = {
  color: string,
  x: number,
  y: number,
  message: string
}

// Componente que renderiza el cursor
export default function Cursor({color, x, y, message}: props) {
  return (
    <div className='pointer-events-none absolute top-0 left-0' style={{transform: `translateX(${x}px) translateY(${y}px)`}}>
        <CursorSVG color={color} />

        {/* Message */}
        {/* leading-relaxed es el espaciado entre cada parrafo,espacio de arriba y abajo */}
        {message && (
            <div className='absolute left-0 top-5 rounded-3xl px-4 py-2' style={{backgroundColor: color}}>
                <p className='text-white whitespace-nowrap text-sm leading-relaxed'>{message}</p>
            </div>
        )}

    </div>
  )
}
