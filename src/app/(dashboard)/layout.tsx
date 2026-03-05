'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '../../lib/supabase/client'
import { Sidebar, Header } from '@/components/layout'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { employeeService } from '@/services/employee.service'
import type { User } from '@supabase/supabase-js'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [employeeAvatarUrl, setEmployeeAvatarUrl] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<{ firstName: string; lastName: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch employee avatar from database
      if (user) {
        try {
          // Try to get employee by user_roles first
          const { data: userRole } = await supabase
            .from('user_roles')
            .select('employee_id')
            .eq('user_id', user.id)
            .maybeSingle()

          let employeeId = userRole?.employee_id

          // If no user_role, try to find employee by email
          if (!employeeId) {
            const { data: employee } = await supabase
              .from('employees')
              .select('id, avatar_url, first_name, last_name')
              .eq('email', user.email ?? '')
              .maybeSingle()

            if (employee) {
              employeeId = employee.id
              if (employee.avatar_url) {
                setEmployeeAvatarUrl(employee.avatar_url)
              }
              setEmployeeName({
                firstName: employee.first_name || '',
                lastName: employee.last_name || ''
              })
            }
          } else {
            // Fetch employee data with avatar and name
            const { data: employee } = await supabase
              .from('employees')
              .select('avatar_url, first_name, last_name')
              .eq('id', employeeId)
              .maybeSingle()

            if (employee) {
              if (employee.avatar_url) {
                setEmployeeAvatarUrl(employee.avatar_url)
              }
              setEmployeeName({
                firstName: employee.first_name || '',
                lastName: employee.last_name || ''
              })
            }
          }
        } catch (error) {
          console.error('Error fetching employee avatar:', error)
        }
      }
      
      setLoading(false)
    }
    getUser()
  }, [supabase])

  async function handleSignOut() {
    // Clear all React Query cache to prevent data leaking between users
    queryClient.clear()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DashboardContent user={user} employeeAvatarUrl={employeeAvatarUrl} employeeName={employeeName}>
        {children}
      </DashboardContent>
    </SidebarProvider>
  )
}

function DashboardContent({ 
  user, 
  employeeAvatarUrl, 
  employeeName,
  children 
}: { 
  user: User | null
  employeeAvatarUrl: string | null
  employeeName: { firstName: string; lastName: string } | null
  children: React.ReactNode 
}) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className={isCollapsed ? "pl-[70px]" : "pl-[260px]"} style={{ transition: 'padding-left 300ms' }}>
        <Header
          user={
            user
              ? {
                  firstName: employeeName?.firstName || user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
                  lastName: employeeName?.lastName || user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ')[1] || '',
                  email: user.email || '',
                  avatarUrl: employeeAvatarUrl || user.user_metadata?.avatar_url,
                }
              : null
          }
        />
        <main className="p-6 bg-gray-100 min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  )
}
