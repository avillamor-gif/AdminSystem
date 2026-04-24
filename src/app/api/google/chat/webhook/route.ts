/**
 * Google Chat incoming webhook handler.
 * Configure this URL in Google Cloud Console → Chat API → Configuration → HTTP endpoint URL:
 *   https://<your-vercel-domain>/api/google/chat/webhook
 *
 * This handles events that Google Chat sends TO your app:
 *   - ADDED_TO_SPACE
 *   - REMOVED_FROM_SPACE
 *   - MESSAGE (user sends a message to the bot)
 *   - CARD_CLICKED
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, space, message, user } = body

    console.log('[Chat webhook] Event:', type, space?.name)

    switch (type) {
      case 'ADDED_TO_SPACE': {
        // Bot was added to a space or DM — send a greeting
        const userName = user?.displayName ?? 'there'
        return NextResponse.json({
          text: `👋 Hi ${userName}! I'm the *IBON Admin System* bot. I'll send you notifications about your leave requests, travel approvals, and other HR updates. No action needed — just keep me here! ✅`,
        })
      }

      case 'REMOVED_FROM_SPACE': {
        // Bot was removed — nothing to return, just acknowledge
        console.log('[Chat webhook] Bot removed from space:', space?.name)
        return NextResponse.json({})
      }

      case 'MESSAGE': {
        // User sent a message to the bot — send a helpful reply
        const msgText = (message?.text ?? '').toLowerCase()
        const userName = user?.displayName?.split(' ')[0] ?? 'there'

        if (msgText.includes('help') || msgText.includes('hello') || msgText.includes('hi')) {
          return NextResponse.json({
            text: `👋 Hi ${userName}! I'm your *IBON HR Admin* notification bot.\n\nI'll automatically message you when:\n• ✅ Your leave request is approved\n• ❌ Your leave request is rejected\n• ✈️ Your travel request is approved or rejected\n\nFor anything else, please use the HR Admin System directly.`,
          })
        }

        // Default reply
        return NextResponse.json({
          text: `Hi ${userName}! I only send automated HR notifications. Please use the *IBON Admin System* for any HR requests. 🔔`,
        })
      }

      case 'CARD_CLICKED': {
        // Handle card button clicks if you add interactive cards later
        return NextResponse.json({ text: 'Action received.' })
      }

      default:
        return NextResponse.json({})
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Chat webhook] Error:', message)
    // Always return 200 to Google — never let webhook errors cause retries
    return NextResponse.json({ text: '' })
  }
}
