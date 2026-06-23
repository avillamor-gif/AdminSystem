import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Board of Trustees',        href: '/admin/governance/board' },
  { label: 'Membership Invitations',   href: '/admin/governance/membership-invitations' },
  { label: 'Membership Applications',  href: '/admin/governance/membership-applications' },
  { label: 'Membership',               href: '/admin/governance/members' },
  { label: 'General Assemblies',       href: '/admin/governance/general-assemblies' },
  { label: 'Email Campaigns',          href: '/admin/governance/campaigns' },
  { label: 'Reports',                  href: '/admin/governance/reports' },
]

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}

const flatItems = [
  { label: 'Board of Trustees',       href: '/admin/governance/board' },
  { label: 'Membership Invitations',  href: '/admin/governance/membership-invitations' },
  { label: 'Membership Applications', href: '/admin/governance/membership-applications' },
  { label: 'Membership',              href: '/admin/governance/members' },
  { label: 'General Assemblies',      href: '/admin/governance/general-assemblies' },
  { label: 'Email Campaigns',         href: '/admin/governance/campaigns' },
]

const reportsDropdown = [
  { label: 'Membership Analytics', href: '/admin/governance/reports/membership-analytics' },
  { label: 'Email Report',         href: '/admin/governance/reports/email-report' },
]

function GovernanceNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const reportsActive = pathname.startsWith('/admin/governance/reports')

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="px-6 relative">
        <nav className="flex gap-2 overflow-x-auto">
          {flatItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn('px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  isActive ? 'border-orange text-orange' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}>
                {item.label}
              </Link>
            )
          })}

          {/* Reports dropdown — rendered outside overflow-x-auto to avoid clipping */}
          <div ref={ref} className="relative flex items-stretch flex-shrink-0">
            <button
              onClick={() => setOpen(o => !o)}
              className={cn('flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                reportsActive ? 'border-orange text-orange' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              Reports
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : '')} />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px] z-[100]">
                {reportsDropdown.map(item => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn('block px-4 py-2.5 text-sm transition-colors',
                        isActive ? 'text-amber-700 bg-amber-50 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      )}>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <GovernanceNav />
      <div className="p-6">{children}</div>
    </div>
  )
}

