import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FROM_ADDRESS } from '@/lib/resend'

/**
 * Simple in-memory rate limiter
 * Tracks IP addresses and request counts
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(ip: string): string {
  return `public-equipment-checkout:${ip}`
}

function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 3600000): boolean {
  const key = getRateLimitKey(ip)
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    // New window or expired
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count < maxRequests) {
    entry.count++
    return true
  }

  return false
}

/**
 * POST /api/forms/equipment-checkout
 *
 * Public endpoint for external partners to submit equipment checkout requests
 * - No authentication required
 * - Rate limited per IP (5 requests per hour)
 * - Creates asset_request with borrower_type: 'external'
 * - Sends confirmation email
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'external_borrower_name',
      'external_borrower_org',
      'external_borrower_contact',
      'assigned_asset_id',
      'item_description',
      'justification',
      'borrow_start_date',
      'borrow_end_date',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Sanitize inputs (prevent XSS)
    const sanitize = (str: string) => {
      if (!str) return ''
      return str.trim().replace(/<[^>]*>/g, '').slice(0, 500)
    }

    const payload = {
      employee_id: null, // External borrower, no employee
      assigned_asset_id: body.assigned_asset_id,
      borrower_type: 'external' as const,
      external_borrower_name: sanitize(body.external_borrower_name),
      external_borrower_org: sanitize(body.external_borrower_org),
      external_borrower_contact: sanitize(body.external_borrower_contact),
      external_borrower_position: body.external_borrower_position ? sanitize(body.external_borrower_position) : undefined,
      category_id: body.category_id || undefined,
      item_description: sanitize(body.item_description),
      justification: sanitize(body.justification),
      requested_date: new Date().toISOString().split('T')[0],
      borrow_start_date: body.borrow_start_date,
      borrow_end_date: body.borrow_end_date,
      notes: body.notes ? sanitize(body.notes) : undefined,
      priority: 'normal' as const,
      status: 'pending' as const,
    }

    // Validate dates
    const startDate = new Date(payload.borrow_start_date)
    const endDate = new Date(payload.borrow_end_date)
    const today = new Date()

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startDate < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      )
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate contact format (basic)
    const contactRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[\d\s\-\+\(\)]{10,}$/
    if (!contactRegex.test(payload.external_borrower_contact)) {
      return NextResponse.json(
        { error: 'Please provide a valid email or phone number' },
        { status: 400 }
      )
    }

    // Create asset request using admin client (bypasses RLS)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('asset_requests')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      console.error('[equipment-checkout] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      )
    }

    // Send confirmation email (best-effort, don't fail if email fails)
    try {
      await sendConfirmationEmail({
        name: payload.external_borrower_name,
        email: payload.external_borrower_contact,
        org: payload.external_borrower_org,
        item: payload.item_description,
        startDate: payload.borrow_start_date,
        endDate: payload.borrow_end_date,
        requestId: data.id,
      })
    } catch (emailError) {
      console.warn('[equipment-checkout] Email send failed (non-critical):', emailError)
      // Don't fail the entire request
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Request submitted successfully',
        requestId: data.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[equipment-checkout] Fatal error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Send confirmation email to external borrower
 */
async function sendConfirmationEmail(params: {
  name: string
  email: string
  org: string
  item: string
  startDate: string
  endDate: string
  requestId: string
}): Promise<void> {
  const { Resend } = await import('resend')

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.email,
    subject: 'Equipment Checkout Request Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Equipment Checkout Request Received</h1>
        </div>
        
        <p>Hello <strong>${params.name}</strong>,</p>
        
        <p>Thank you for submitting your equipment checkout request. We have received it and our team will review it shortly.</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">Request Details:</h3>
          <p style="margin: 5px 0;"><strong>Equipment:</strong> ${params.item}</p>
          <p style="margin: 5px 0;"><strong>Organization:</strong> ${params.org}</p>
          <p style="margin: 5px 0;"><strong>Borrow Period:</strong> ${params.startDate} to ${params.endDate}</p>
          <p style="margin: 5px 0;"><strong>Request ID:</strong> ${params.requestId}</p>
        </div>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Next Steps:</h3>
          <p style="margin: 5px 0;">Our team will contact you at <strong>${params.email}</strong> within 2 business days to confirm the request.</p>
          <p style="margin: 5px 0;">Please keep this request ID for reference: <strong>${params.requestId}</strong></p>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message. Please do not reply to this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          IBON International • Equipment Management System
        </p>
      </div>
    `,
  })
}

/**
 * OPTIONS handler for CORS (if needed)
 */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
