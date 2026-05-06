'use client'

import { useState } from 'react'
import { Clock, Globe, CalendarDays, Upload, FileSpreadsheet } from 'lucide-react'
import { Card } from '@/components/ui'
import { useGeneralSettings, useUpdateGeneralSetting } from '@/hooks/useOrgProfile'

// ─── Option maps ──────────────────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'Asia/Manila', label: '(UTC+08:00) Asia/Manila' },
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Asia/Singapore' },
  { value: 'America/New_York', label: '(UTC-05:00) America/New_York' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) America/Los_Angeles' },
  { value: 'Europe/London', label: '(UTC+00:00) Europe/London' },
]
const DATE_FORMATS  = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD-MMM-YYYY', 'MMM DD, YYYY']
const TIME_FORMATS  = ['12h', '24h']
const CURRENCIES    = ['PHP', 'USD', 'EUR', 'GBP', 'JPY', 'SGD']
const LANGUAGES     = ['en', 'fil', 'es', 'fr', 'de', 'ja']
const LANG_LABELS: Record<string,string> = { en:'English', fil:'Filipino', es:'Español', fr:'Français', de:'Deutsch', ja:'日本語' }
const LEAVE_BASES   = ['calendar', 'anniversary']
const LEAVE_BASE_LABELS: Record<string,string> = { calendar:'Calendar Year (Jan–Dec)', anniversary:'Hire Anniversary' }
const FISCAL_MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12']
const FISCAL_MONTH_LABELS: Record<string,string> = {
  '01':'January','02':'February','03':'March','04':'April',
  '05':'May','06':'June','07':'July','08':'August',
  '09':'September','10':'October','11':'November','12':'December'
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="p-2 bg-orange/10 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 w-60">{children}</div>
    </div>
  )
}

function SelectSetting({ settingKey, current, options, labelMap }: {
  settingKey: string; current: string
  options: string[]; labelMap?: Record<string, string>
}) {
  const updateMutation = useUpdateGeneralSetting()
  const [value, setValue] = useState(current)

  const handleChange = async (v: string) => {
    setValue(v)
    await updateMutation.mutateAsync({ key: settingKey, value: v })
  }

  return (
    <select
      value={value}
      onChange={e => handleChange(e.target.value)}
      disabled={updateMutation.isPending}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
    >
      {options.map(o => (
        <option key={o} value={o}>{labelMap?.[o] ?? o}</option>
      ))}
    </select>
  )
}

function TextSetting({ settingKey, current, placeholder, type = 'text' }: {
  settingKey: string; current: string; placeholder?: string; type?: string
}) {
  const updateMutation = useUpdateGeneralSetting()
  const [value, setValue] = useState(current)

  const handleBlur = async () => {
    if (value !== current) {
      await updateMutation.mutateAsync({ key: settingKey, value })
    }
  }

  return (
    <input
      type={type}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GeneralSettingsPage() {
  const { data: settings = [], isLoading } = useGeneralSettings()

  const get = (key: string, fallback = '') =>
    settings.find(s => s.key === key)?.value ?? fallback

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-gray-600 mt-1">System-wide defaults for date, time, localization, and behaviour</p>
      </div>

      {/* Date & Time */}
      <Card className="p-6">
        <SectionHeader icon={Clock} title="Date & Time" description="Timezone and display formats used throughout the system" />
        <SettingRow label="Timezone" description="All system times will be displayed in this timezone">
          <SelectSetting settingKey="timezone" current={get('timezone','Asia/Manila')} options={TIMEZONES.map(t=>t.value)} labelMap={Object.fromEntries(TIMEZONES.map(t=>[t.value,t.label]))} />
        </SettingRow>
        <SettingRow label="Date Format" description="How dates are displayed across the system">
          <SelectSetting settingKey="date_format" current={get('date_format','YYYY-MM-DD')} options={DATE_FORMATS} />
        </SettingRow>
        <SettingRow label="Time Format" description="12-hour or 24-hour clock">
          <SelectSetting settingKey="time_format" current={get('time_format','12h')} options={TIME_FORMATS} labelMap={{ '12h':'12-hour (1:30 PM)', '24h':'24-hour (13:30)' }} />
        </SettingRow>
      </Card>

      {/* Localization */}
      <Card className="p-6">
        <SectionHeader icon={Globe} title="Localization" description="Language and currency settings" />
        <SettingRow label="Language" description="Default interface language">
          <SelectSetting settingKey="language" current={get('language','en')} options={LANGUAGES} labelMap={LANG_LABELS} />
        </SettingRow>
        <SettingRow label="Currency" description="Currency used for payroll and financial fields">
          <SelectSetting settingKey="currency" current={get('currency','PHP')} options={CURRENCIES} />
        </SettingRow>
        <SettingRow label="Currency Symbol" description="Symbol shown before amounts">
          <TextSetting settingKey="currency_symbol" current={get('currency_symbol','₱')} placeholder="₱" />
        </SettingRow>
      </Card>

      {/* Fiscal / Leave */}
      <Card className="p-6">
        <SectionHeader icon={CalendarDays} title="Fiscal & Leave Year" description="How annual periods are calculated" />
        <SettingRow label="Fiscal Year Start" description="Month when the fiscal year begins">
          <SelectSetting settingKey="fiscal_year_start" current={get('fiscal_year_start','01')} options={FISCAL_MONTHS} labelMap={FISCAL_MONTH_LABELS} />
        </SettingRow>
        <SettingRow label="Leave Year Basis" description="When employees' annual leave entitlement resets">
          <SelectSetting settingKey="leave_year_basis" current={get('leave_year_basis','calendar')} options={LEAVE_BASES} labelMap={LEAVE_BASE_LABELS} />
        </SettingRow>
      </Card>

      {/* File Uploads */}
      <Card className="p-6">
        <SectionHeader icon={Upload} title="File Uploads" description="Limits for user file uploads" />
        <SettingRow label="Max Upload Size (MB)" description="Maximum file size allowed for attachments and documents">
          <TextSetting settingKey="max_upload_mb" current={get('max_upload_mb','10')} placeholder="10" type="number" />
        </SettingRow>
      </Card>
    </div>
  )
}
