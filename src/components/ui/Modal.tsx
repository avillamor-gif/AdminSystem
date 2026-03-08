'use client'

import { Fragment } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, children, className, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modal = (
    <div
      className="fixed inset-0 z-[9990] flex justify-end bg-black/40 animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white shadow-2xl w-full flex flex-col min-h-0 animate-[slideInFromRight_0.25s_cubic-bezier(0.16,1,0.3,1)]',
          sizeClasses[size],
          className
        )}
        style={{ height: '100vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}

export function ModalHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {onClose && (
        <button onClick={onClose} className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 min-h-0 overflow-y-auto px-6 py-5', className)}>{children}</div>
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white', className)}>
      {children}
    </div>
  )
}
