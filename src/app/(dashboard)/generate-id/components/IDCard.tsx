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
}

function getTextContent(id: string, employee: EmployeeWithRelations & { [key: string]: any }): string {
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
  ({ employee, side, layout }, ref) => {
    const defaultLayout = side === 'front' ? DEFAULT_FRONT_LAYOUT : DEFAULT_BACK_LAYOUT
    const elements = layout ?? defaultLayout
    const bgSrc = side === 'front' ? '/FrontID.png' : '/BackID.png'

    return (
      <div
        ref={ref}
        style={{
          width: CARD_W,
          height: CARD_H,
          fontFamily: 'Arial, Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          userSelect: 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgSrc}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
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
                  backgroundColor: '#e5e7eb',
                }}
              >
                {employee.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.avatar_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {getTextContent(el.id, employee)}
            </div>
          )
        })}
      </div>
    )
  }
)

IDCard.displayName = 'IDCard'
