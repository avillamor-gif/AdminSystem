import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: CardProps) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h3>
}

export function CardDescription({ children, className }: CardProps) {
  return <p className={cn('text-sm text-gray-500 mt-1', className)}>{children}</p>
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('', className)}>{children}</div>
}
