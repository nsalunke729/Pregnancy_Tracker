'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary'   && 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800',
        variant === 'secondary' && 'bg-rose-50 text-rose-600 hover:bg-rose-100',
        variant === 'ghost'     && 'text-gray-600 hover:bg-gray-100',
        variant === 'danger'    && 'bg-red-50 text-red-600 hover:bg-red-100',
        size === 'sm'   && 'h-8 px-3 text-xs',
        size === 'md'   && 'h-10 px-4 text-sm',
        size === 'lg'   && 'h-12 px-6 text-base',
        size === 'icon' && 'h-10 w-10',
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'
