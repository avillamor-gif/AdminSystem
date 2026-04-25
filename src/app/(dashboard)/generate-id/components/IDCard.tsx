'use client'

import { forwardRef } from 'react'
import type { EmployeeWithRelations } from '@/services/employee.service'
import {
  CARD_W,
  CARD_H,
  DEFAULT_FRONT_LAYOUT,
  DEFAULT_BACK_LAYOUT,
  type CardElementLayout,
} from '../hooks/useIDCardLayout'

interface IDCardProps {
  employee: EmployeeWithRelations & { [key: string]: any }
  side: 'front' | 'back'
  layout?: CardElementLayout[]
  bgImage?: string | null
  overlayImage?: string | null
  forPrint?: boolean
}

function getTextContent(id: string, employee: EmployeeWithRelations & { [key: string]: any }, customText?: string): string {
  if (customText !== undefined) return customText
  switch (id) {
    case 'lastName': return (employee.last_name || '').toUpperCase()
    case 'firstName': return (employee.first_name || '').toUpperCase()
    case 'jobTitle': return (employee.job_title?.title || '').toUpperCase()
    case 'employeeId': return `ID # ${employee.employee_id || '—'}`
    case 'emergencyContact':
      return `${employee.emergency_contact_name || '—'} | ${employee.emergency_contact_phone || employee.phone || '—'}`
    case 'tinNumber': return `TIN No.: ${employee.tin_number || '—'}`
    case 'sssNumber': return `SSS No.: ${employee.sss_number || '—'}`
    case 'pagibigNumber': return `PAG-IBIG No.: ${employee.pagibig_number || '—'}`
    case 'philhealthNumber': return `Philhealth No.: ${employee.philhealth_number || '—'}`
    case 'birthday': {
      const dob = employee.date_of_birth
        ? new Date(employee.date_of_birth).toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
          })
        : '—'
      return `Birthday: ${dob}`
    }
    default: return ''
  }
}

export const IDCard = forwardRef<HTMLDivElement, IDCardProps>(
  ({ employee, side, layout, bgImage, overlayImage, forPrint = false }, ref) => {
    const defaultLayout = side === 'front' ? DEFAULT_FRONT_LAYOUT : DEFAULT_BACK_LAYOUT
    const elements = layout ?? defaultLayout
    const defaultBgSrc = side === 'front' ? '/FrontID.png' : '/BackID.png'
    const bgSrc = bgImage ?? defaultBgSrc

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          fontFamily: 'Arial, Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          // Remove rounded corners and shadow for print — printer cuts straight edges
          borderRadius: forPrint ? 0 : 10,
          boxShadow: forPrint ? 'none' : '0 4px 20px rgba(0,0,0,0.18)',
          userSelect: 'none',
        }}
      >
        {/* Background — use div+backgroundImage so html2canvas renders it correctly */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${bgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            pointerEvents: 'none',
          }}
        />

        {elements.map(el => {
          if (el.style.hidden) return null

          if (el.type === 'photo') {
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.style.x,
                  top: el.style.y,
                  width: el.style.width,
                  height: el.style.height,
                  overflow: 'hidden',
                }}
              >
                {employee.avatar_url ? (
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url(${employee.avatar_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center',
                  }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 700, color: '#9ca3af',
                  }}>
                    {(employee.first_name?.[0] || '').toUpperCase()}
                    {(employee.last_name?.[0] || '').toUpperCase()}
                  </div>
                )}
              </div>
            )
          }

          if (el.type === 'overlay') {
            return overlayImage ? (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.style.x,
                  top: el.style.y,
                  width: el.style.width ?? CARD_W,
                  height: el.style.height ?? CARD_H,
                  backgroundImage: `url(${overlayImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  pointerEvents: 'none',
                }}
              />
            ) : null
          }

          if (el.type === 'divider') {
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.style.x,
                  top: el.style.y,
                  width: el.style.width ?? 140,
                  height: el.style.height ?? 2,
                  backgroundColor: el.style.color ?? '#111',
                }}
              />
            )
          }

          if (el.type === 'signature') {
            return employee.signature_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={el.id}
                src={employee.signature_url}
                alt="signature"
                style={{
                  position: 'absolute',
                  left: el.style.x,
                  top: el.style.y,
                  width: el.style.width ?? 120,
                  height: el.style.height ?? 40,
                  objectFit: 'contain',
                }}
              />
            ) : null
          }

          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.style.x,
                top: el.style.y,
                width: el.style.width,
                fontSize: el.style.fontSize,
                fontWeight: el.style.fontWeight,
                color: el.style.color,
                textAlign: el.style.textAlign ?? 'left',
                letterSpacing: el.style.letterSpacing,
                lineHeight: el.style.lineHeight,
                whiteSpace: el.style.width ? 'normal' : 'nowrap',
              }}
            >
              {getTextContent(el.id, employee, el.style.customText)}
            </div>
          )
        })}
      </div>
    )
  }
)

IDCard.displayName = 'IDCard'
