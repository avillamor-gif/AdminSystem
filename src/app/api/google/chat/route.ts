/**
 * Google Chat API route.
 *
 * POST /api/google/chat
 * Body:
 *   action: 'sendDM' | 'sendToSpace'
 *   userEmail?: string      — for sendDM: recipient Workspace email
 *   spaceName?: string      — for sendToSpace: e.g. "spaces/AAAA1234"
 *   message: string         — plain text message
 *   cards?: object[]        — optional Google Chat card v2 payloads
 *
 * Returns: { success: true, messageName: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getChatClient } from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userEmail, spaceName, message, cards } = body

    const chat = getChatClient()

    if (action === 'sendDM') {
      if (!userEmail) {
        return NextResponse.json({ error: 'userEmail is required for sendDM' }, { status: 400 })
      }

      // Create or find DM space with the user
      const spaceRes = await chat.spaces.findDirectMessage({
        name: `users/${userEmail}`,
      })

      const dmSpaceName = spaceRes.data.name
      if (!dmSpaceName) {
        return NextResponse.json({ error: 'Could not find or create DM space' }, { status: 500 })
      }

      const msgRes = await chat.spaces.messages.create({
        parent: dmSpaceName,
        requestBody: {
          text: message,
          ...(cards ? { cardsV2: cards } : {}),
        },
      })

      return NextResponse.json({ success: true, messageName: msgRes.data.name })
    }

    if (action === 'sendToSpace') {
      if (!spaceName) {
        return NextResponse.json({ error: 'spaceName is required for sendToSpace' }, { status: 400 })
      }

      const msgRes = await chat.spaces.messages.create({
        parent: spaceName,
        requestBody: {
          text: message,
          ...(cards ? { cardsV2: cards } : {}),
        },
      })

      return NextResponse.json({ success: true, messageName: msgRes.data.name })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Google Chat API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
