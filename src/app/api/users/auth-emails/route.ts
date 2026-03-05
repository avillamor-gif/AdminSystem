import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds } = body

    console.log('Fetching auth emails for user IDs:', userIds)

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: {} })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch auth users
    const usersMap: { [key: string]: { email: string } } = {}
    
    // Fetch each user's email from auth.users
    const promises = userIds.map(async (userId: string) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        
        if (!error && data?.user?.email) {
          usersMap[userId] = { email: data.user.email }
        } else if (error) {
          console.warn(`Error fetching user ${userId}:`, error.message)
        }
      } catch (err) {
        console.warn(`Could not fetch user ${userId}:`, err)
      }
    })

    await Promise.all(promises)

    console.log('Fetched auth user emails:', usersMap)

    return NextResponse.json({ users: usersMap })
  } catch (error) {
    console.error('Error fetching auth user emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user emails' },
      { status: 500 }
    )
  }
}
