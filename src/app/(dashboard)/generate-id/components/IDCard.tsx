'use client'

import { forwardRef } from 'react'
import type { EmployeeWithRelations } from '@/services/employee.service'

interface IDCardProps {
  employee: EmployeeWithRelations & { [key: string]: any }
  side: 'front' | 'back'
}

// Vertical CR80: 54mm × 85.6mm rendered at ~3.7px/mm scaled 1.5× → 300 × 476
const W = 300
const H = 476

export const IDCard = forwardRef<HTMLDivElement, IDCardProps>(
  ({ employee, side }, ref) => {
    const lastName  = (employee.last_name  || '').toUpperCase()
    const firstName = (employee.first_name || '').toUpperCase()
    const jobTitle  = (employee.job_title?.title || '').toUpperCase()
    const dob = employee.date_of_birth
      ? new Date(employee.date_of_birth).toLocaleDateString('en-US', {
          month: '2-digit', day: '2-digit', year: 'numeric',
        })
      : '—'

    /* ─────────────── FRONT ─────────────── */
    if (side === 'front') {
      return (
        <div
          ref={ref}
          style={{
            width: W,
            height: H,
            fontFamily: 'Arial, Helvetica, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            userSelect: 'none',
          }}
        >
          {/* Full background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/FrontID.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Dynamic data overlay */}
          {/* Name block */}
          <div style={{
            position: 'absolute',
            top: '24%',
            left: 22,
            right: 140,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1.1 }}>
              {lastName},
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1.15, marginBottom: 8 }}>
              {firstName}
            </div>
            <div style={{ height: 2, backgroundColor: '#111', marginBottom: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {jobTitle || '\u2014'}
            </div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>
              ID # {employee.employee_id || '\u2014'}
            </div>
          </div>

          {/* Employee photo — bottom-right */}
          <div style={{
            position: 'absolute',
            right: 14,
            bottom: 108,
            width: 116,
            height: 144,
            overflow: 'hidden',
            backgroundColor: '#e5e7eb',
          }}>
            {employee.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.avatar_url}
                alt={firstName + ' ' + lastName}
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
        </div>
      )
    }

    /* ─────────────── BACK ─────────────── */
    return (
      <div
        ref={ref}
        style={{
          width: W,
          height: H,
          fontFamily: 'Arial, Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          userSelect: 'none',
        }}
      >
        {/* Full background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/BackID.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Dynamic data overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'Arial, Helvetica, sans-serif',
          paddingTop: '23%',
        }}>
          {/* Emergency contact */}
          <div style={{ textAlign: 'center', lineHeight: 1.45, marginBottom: '5%' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#111' }}>
              {(employee as any).emergency_contact_name || '\u2014'} | {(employee as any).emergency_contact_phone || employee.phone || '\u2014'}
            </div>
          </div>

          {/* Gov IDs */}
          <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
            <div style={{ fontSize: 12, color: '#222' }}>TIN No.: {(employee as any).tin_number || '\u2014'}</div>
            <div style={{ fontSize: 12, color: '#222' }}>SSS No.: {(employee as any).sss_number || '\u2014'}</div>
            <div style={{ fontSize: 12, color: '#222' }}>PAG-IBIG No.: {(employee as any).pagibig_number || '\u2014'}</div>
            <div style={{ fontSize: 12, color: '#222' }}>Philhealth No.: {(employee as any).philhealth_number || '\u2014'}</div>
            <div style={{ fontSize: 12, color: '#222' }}>Birthday: {dob}</div>
          </div>
        </div>
      </div>
    )
  }
)

IDCard.displayName = 'IDCard'
