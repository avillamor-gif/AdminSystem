'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Edit2, Trash2, Search, Users, X, Mail, Phone, MapPin,
  BellOff, BellRing, ChevronRight, Download, ArrowUpDown, ArrowUp, ChevronDown,
} from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  useMembers, useCreateMember, useUpdateMember, useDeleteMember,
  useMemberDues, useCreateMemberDue, useUpdateMemberDue, useDeleteMemberDue,
  useMemberCampaignHistory,
} from '@/hooks/useGovernance'
import { useHasPermission } from '@/hooks/usePermissions'
import type { Member, MemberDue } from '@/services/governance.service'
import { formatDate } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  regular:       'bg-blue-100 text-blue-700',
  associate:     'bg-purple-100 text-purple-700',
  honorary:      'bg-amber-100 text-amber-700',
  institutional: 'bg-teal-100 text-teal-700',
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-orange-100 text-orange-700',
  lapsed:    'bg-yellow-100 text-yellow-700',
  deceased:  'bg-red-100 text-red-700',
}

const DUES_STATUS_COLORS: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  waived:  'bg-gray-100 text-gray-500',
}

const CAMPAIGN_RECIPIENT_CLS: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  bounced: 'bg-orange-100 text-orange-700',
  pending: 'bg-gray-100 text-gray-500',
}

const inp = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400'

// ── Countries ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus',
  'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji',
  'Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland',
  'India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
  'Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi',
  'Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico',
  'Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
  'North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia',
  'Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden',
  'Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo',
  'Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

// ── CountrySelect ──────────────────────────────────────────────────────────────

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const wrapRef             = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) { setQuery(''); inputRef.current?.focus() }
  }, [open])

  const filtered = query
    ? COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES

  function select(country: string) {
    onChange(country)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${inp} flex items-center justify-between text-left ${!value ? 'text-gray-400' : 'text-gray-900'}`}
      >
        <span className="truncate">{value || 'Select country…'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search countries…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          {/* List */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No countries found</li>
            ) : filtered.map(c => (
              <li
                key={c}
                onClick={() => select(c)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 ${value === c ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'}`}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Dial Codes ─────────────────────────────────────────────────────────────────

// Philippines first, then alphabetical
const DIAL_CODES = [
  { name: 'Philippines',              code: 'PH', dial: '+63'  },
  { name: 'Afghanistan',              code: 'AF', dial: '+93'  },
  { name: 'Albania',                  code: 'AL', dial: '+355' },
  { name: 'Algeria',                  code: 'DZ', dial: '+213' },
  { name: 'Andorra',                  code: 'AD', dial: '+376' },
  { name: 'Angola',                   code: 'AO', dial: '+244' },
  { name: 'Antigua and Barbuda',      code: 'AG', dial: '+1'   },
  { name: 'Argentina',                code: 'AR', dial: '+54'  },
  { name: 'Armenia',                  code: 'AM', dial: '+374' },
  { name: 'Australia',                code: 'AU', dial: '+61'  },
  { name: 'Austria',                  code: 'AT', dial: '+43'  },
  { name: 'Azerbaijan',               code: 'AZ', dial: '+994' },
  { name: 'Bahamas',                  code: 'BS', dial: '+1'   },
  { name: 'Bahrain',                  code: 'BH', dial: '+973' },
  { name: 'Bangladesh',               code: 'BD', dial: '+880' },
  { name: 'Barbados',                 code: 'BB', dial: '+1'   },
  { name: 'Belarus',                  code: 'BY', dial: '+375' },
  { name: 'Belgium',                  code: 'BE', dial: '+32'  },
  { name: 'Belize',                   code: 'BZ', dial: '+501' },
  { name: 'Benin',                    code: 'BJ', dial: '+229' },
  { name: 'Bhutan',                   code: 'BT', dial: '+975' },
  { name: 'Bolivia',                  code: 'BO', dial: '+591' },
  { name: 'Bosnia and Herzegovina',   code: 'BA', dial: '+387' },
  { name: 'Botswana',                 code: 'BW', dial: '+267' },
  { name: 'Brazil',                   code: 'BR', dial: '+55'  },
  { name: 'Brunei',                   code: 'BN', dial: '+673' },
  { name: 'Bulgaria',                 code: 'BG', dial: '+359' },
  { name: 'Burkina Faso',             code: 'BF', dial: '+226' },
  { name: 'Burundi',                  code: 'BI', dial: '+257' },
  { name: 'Cabo Verde',               code: 'CV', dial: '+238' },
  { name: 'Cambodia',                 code: 'KH', dial: '+855' },
  { name: 'Cameroon',                 code: 'CM', dial: '+237' },
  { name: 'Canada',                   code: 'CA', dial: '+1'   },
  { name: 'Central African Republic', code: 'CF', dial: '+236' },
  { name: 'Chad',                     code: 'TD', dial: '+235' },
  { name: 'Chile',                    code: 'CL', dial: '+56'  },
  { name: 'China',                    code: 'CN', dial: '+86'  },
  { name: 'Colombia',                 code: 'CO', dial: '+57'  },
  { name: 'Comoros',                  code: 'KM', dial: '+269' },
  { name: 'Congo (Brazzaville)',       code: 'CG', dial: '+242' },
  { name: 'Congo (Kinshasa)',          code: 'CD', dial: '+243' },
  { name: 'Costa Rica',               code: 'CR', dial: '+506' },
  { name: 'Croatia',                  code: 'HR', dial: '+385' },
  { name: 'Cuba',                     code: 'CU', dial: '+53'  },
  { name: 'Cyprus',                   code: 'CY', dial: '+357' },
  { name: 'Czech Republic',           code: 'CZ', dial: '+420' },
  { name: 'Denmark',                  code: 'DK', dial: '+45'  },
  { name: 'Djibouti',                 code: 'DJ', dial: '+253' },
  { name: 'Dominica',                 code: 'DM', dial: '+1'   },
  { name: 'Dominican Republic',       code: 'DO', dial: '+1'   },
  { name: 'Ecuador',                  code: 'EC', dial: '+593' },
  { name: 'Egypt',                    code: 'EG', dial: '+20'  },
  { name: 'El Salvador',              code: 'SV', dial: '+503' },
  { name: 'Equatorial Guinea',        code: 'GQ', dial: '+240' },
  { name: 'Eritrea',                  code: 'ER', dial: '+291' },
  { name: 'Estonia',                  code: 'EE', dial: '+372' },
  { name: 'Eswatini',                 code: 'SZ', dial: '+268' },
  { name: 'Ethiopia',                 code: 'ET', dial: '+251' },
  { name: 'Fiji',                     code: 'FJ', dial: '+679' },
  { name: 'Finland',                  code: 'FI', dial: '+358' },
  { name: 'France',                   code: 'FR', dial: '+33'  },
  { name: 'Gabon',                    code: 'GA', dial: '+241' },
  { name: 'Gambia',                   code: 'GM', dial: '+220' },
  { name: 'Georgia',                  code: 'GE', dial: '+995' },
  { name: 'Germany',                  code: 'DE', dial: '+49'  },
  { name: 'Ghana',                    code: 'GH', dial: '+233' },
  { name: 'Greece',                   code: 'GR', dial: '+30'  },
  { name: 'Grenada',                  code: 'GD', dial: '+1'   },
  { name: 'Guatemala',                code: 'GT', dial: '+502' },
  { name: 'Guinea',                   code: 'GN', dial: '+224' },
  { name: 'Guinea-Bissau',            code: 'GW', dial: '+245' },
  { name: 'Guyana',                   code: 'GY', dial: '+592' },
  { name: 'Haiti',                    code: 'HT', dial: '+509' },
  { name: 'Honduras',                 code: 'HN', dial: '+504' },
  { name: 'Hungary',                  code: 'HU', dial: '+36'  },
  { name: 'Iceland',                  code: 'IS', dial: '+354' },
  { name: 'India',                    code: 'IN', dial: '+91'  },
  { name: 'Indonesia',                code: 'ID', dial: '+62'  },
  { name: 'Iran',                     code: 'IR', dial: '+98'  },
  { name: 'Iraq',                     code: 'IQ', dial: '+964' },
  { name: 'Ireland',                  code: 'IE', dial: '+353' },
  { name: 'Israel',                   code: 'IL', dial: '+972' },
  { name: 'Italy',                    code: 'IT', dial: '+39'  },
  { name: 'Jamaica',                  code: 'JM', dial: '+1'   },
  { name: 'Japan',                    code: 'JP', dial: '+81'  },
  { name: 'Jordan',                   code: 'JO', dial: '+962' },
  { name: 'Kazakhstan',               code: 'KZ', dial: '+7'   },
  { name: 'Kenya',                    code: 'KE', dial: '+254' },
  { name: 'Kiribati',                 code: 'KI', dial: '+686' },
  { name: 'Kuwait',                   code: 'KW', dial: '+965' },
  { name: 'Kyrgyzstan',               code: 'KG', dial: '+996' },
  { name: 'Laos',                     code: 'LA', dial: '+856' },
  { name: 'Latvia',                   code: 'LV', dial: '+371' },
  { name: 'Lebanon',                  code: 'LB', dial: '+961' },
  { name: 'Lesotho',                  code: 'LS', dial: '+266' },
  { name: 'Liberia',                  code: 'LR', dial: '+231' },
  { name: 'Libya',                    code: 'LY', dial: '+218' },
  { name: 'Liechtenstein',            code: 'LI', dial: '+423' },
  { name: 'Lithuania',                code: 'LT', dial: '+370' },
  { name: 'Luxembourg',               code: 'LU', dial: '+352' },
  { name: 'Madagascar',               code: 'MG', dial: '+261' },
  { name: 'Malawi',                   code: 'MW', dial: '+265' },
  { name: 'Malaysia',                 code: 'MY', dial: '+60'  },
  { name: 'Maldives',                 code: 'MV', dial: '+960' },
  { name: 'Mali',                     code: 'ML', dial: '+223' },
  { name: 'Malta',                    code: 'MT', dial: '+356' },
  { name: 'Marshall Islands',         code: 'MH', dial: '+692' },
  { name: 'Mauritania',               code: 'MR', dial: '+222' },
  { name: 'Mauritius',                code: 'MU', dial: '+230' },
  { name: 'Mexico',                   code: 'MX', dial: '+52'  },
  { name: 'Micronesia',               code: 'FM', dial: '+691' },
  { name: 'Moldova',                  code: 'MD', dial: '+373' },
  { name: 'Monaco',                   code: 'MC', dial: '+377' },
  { name: 'Mongolia',                 code: 'MN', dial: '+976' },
  { name: 'Montenegro',               code: 'ME', dial: '+382' },
  { name: 'Morocco',                  code: 'MA', dial: '+212' },
  { name: 'Mozambique',               code: 'MZ', dial: '+258' },
  { name: 'Myanmar',                  code: 'MM', dial: '+95'  },
  { name: 'Namibia',                  code: 'NA', dial: '+264' },
  { name: 'Nauru',                    code: 'NR', dial: '+674' },
  { name: 'Nepal',                    code: 'NP', dial: '+977' },
  { name: 'Netherlands',              code: 'NL', dial: '+31'  },
  { name: 'New Zealand',              code: 'NZ', dial: '+64'  },
  { name: 'Nicaragua',                code: 'NI', dial: '+505' },
  { name: 'Niger',                    code: 'NE', dial: '+227' },
  { name: 'Nigeria',                  code: 'NG', dial: '+234' },
  { name: 'North Korea',              code: 'KP', dial: '+850' },
  { name: 'North Macedonia',          code: 'MK', dial: '+389' },
  { name: 'Norway',                   code: 'NO', dial: '+47'  },
  { name: 'Oman',                     code: 'OM', dial: '+968' },
  { name: 'Pakistan',                 code: 'PK', dial: '+92'  },
  { name: 'Palau',                    code: 'PW', dial: '+680' },
  { name: 'Palestine',                code: 'PS', dial: '+970' },
  { name: 'Panama',                   code: 'PA', dial: '+507' },
  { name: 'Papua New Guinea',         code: 'PG', dial: '+675' },
  { name: 'Paraguay',                 code: 'PY', dial: '+595' },
  { name: 'Peru',                     code: 'PE', dial: '+51'  },
  { name: 'Poland',                   code: 'PL', dial: '+48'  },
  { name: 'Portugal',                 code: 'PT', dial: '+351' },
  { name: 'Qatar',                    code: 'QA', dial: '+974' },
  { name: 'Romania',                  code: 'RO', dial: '+40'  },
  { name: 'Russia',                   code: 'RU', dial: '+7'   },
  { name: 'Rwanda',                   code: 'RW', dial: '+250' },
  { name: 'Saint Kitts and Nevis',    code: 'KN', dial: '+1'   },
  { name: 'Saint Lucia',              code: 'LC', dial: '+1'   },
  { name: 'Saint Vincent',            code: 'VC', dial: '+1'   },
  { name: 'Samoa',                    code: 'WS', dial: '+685' },
  { name: 'San Marino',               code: 'SM', dial: '+378' },
  { name: 'Sao Tome and Principe',    code: 'ST', dial: '+239' },
  { name: 'Saudi Arabia',             code: 'SA', dial: '+966' },
  { name: 'Senegal',                  code: 'SN', dial: '+221' },
  { name: 'Serbia',                   code: 'RS', dial: '+381' },
  { name: 'Seychelles',               code: 'SC', dial: '+248' },
  { name: 'Sierra Leone',             code: 'SL', dial: '+232' },
  { name: 'Singapore',                code: 'SG', dial: '+65'  },
  { name: 'Slovakia',                 code: 'SK', dial: '+421' },
  { name: 'Slovenia',                 code: 'SI', dial: '+386' },
  { name: 'Solomon Islands',          code: 'SB', dial: '+677' },
  { name: 'Somalia',                  code: 'SO', dial: '+252' },
  { name: 'South Africa',             code: 'ZA', dial: '+27'  },
  { name: 'South Korea',              code: 'KR', dial: '+82'  },
  { name: 'South Sudan',              code: 'SS', dial: '+211' },
  { name: 'Spain',                    code: 'ES', dial: '+34'  },
  { name: 'Sri Lanka',                code: 'LK', dial: '+94'  },
  { name: 'Sudan',                    code: 'SD', dial: '+249' },
  { name: 'Suriname',                 code: 'SR', dial: '+597' },
  { name: 'Sweden',                   code: 'SE', dial: '+46'  },
  { name: 'Switzerland',              code: 'CH', dial: '+41'  },
  { name: 'Syria',                    code: 'SY', dial: '+963' },
  { name: 'Taiwan',                   code: 'TW', dial: '+886' },
  { name: 'Tajikistan',               code: 'TJ', dial: '+992' },
  { name: 'Tanzania',                 code: 'TZ', dial: '+255' },
  { name: 'Thailand',                 code: 'TH', dial: '+66'  },
  { name: 'Timor-Leste',              code: 'TL', dial: '+670' },
  { name: 'Togo',                     code: 'TG', dial: '+228' },
  { name: 'Tonga',                    code: 'TO', dial: '+676' },
  { name: 'Trinidad and Tobago',      code: 'TT', dial: '+1'   },
  { name: 'Tunisia',                  code: 'TN', dial: '+216' },
  { name: 'Turkey',                   code: 'TR', dial: '+90'  },
  { name: 'Turkmenistan',             code: 'TM', dial: '+993' },
  { name: 'Tuvalu',                   code: 'TV', dial: '+688' },
  { name: 'Uganda',                   code: 'UG', dial: '+256' },
  { name: 'Ukraine',                  code: 'UA', dial: '+380' },
  { name: 'United Arab Emirates',     code: 'AE', dial: '+971' },
  { name: 'United Kingdom',           code: 'GB', dial: '+44'  },
  { name: 'United States',            code: 'US', dial: '+1'   },
  { name: 'Uruguay',                  code: 'UY', dial: '+598' },
  { name: 'Uzbekistan',               code: 'UZ', dial: '+998' },
  { name: 'Vanuatu',                  code: 'VU', dial: '+678' },
  { name: 'Venezuela',                code: 'VE', dial: '+58'  },
  { name: 'Vietnam',                  code: 'VN', dial: '+84'  },
  { name: 'Yemen',                    code: 'YE', dial: '+967' },
  { name: 'Zambia',                   code: 'ZM', dial: '+260' },
  { name: 'Zimbabwe',                 code: 'ZW', dial: '+263' },
]

function flagEmoji(code: string) {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('')
}

// ── PhoneInput ─────────────────────────────────────────────────────────────────

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Parse stored value: "+63 9123456789" → { dialEntry, localNumber }
  function parse(v: string): { entry: typeof DIAL_CODES[0]; local: string } {
    if (v && v.startsWith('+')) {
      const spaceIdx = v.indexOf(' ')
      if (spaceIdx > 0) {
        const dial = v.slice(0, spaceIdx)
        const local = v.slice(spaceIdx + 1)
        const found = DIAL_CODES.find(d => d.dial === dial)
        if (found) return { entry: found, local }
      }
    }
    return { entry: DIAL_CODES[0], local: v || '' }  // default PH
  }

  const parsed              = parse(value)
  const [entry, setEntry]   = useState(parsed.entry)
  const [local, setLocal]   = useState(parsed.local)
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const wrapRef             = useRef<HTMLDivElement>(null)
  const searchRef           = useRef<HTMLInputElement>(null)

  // Sync when value changes externally (e.g. form reset)
  useEffect(() => {
    const p = parse(value)
    setEntry(p.entry)
    setLocal(p.local)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) { setQuery(''); searchRef.current?.focus() }
  }, [open])

  function selectEntry(e: typeof DIAL_CODES[0]) {
    setEntry(e)
    setOpen(false)
    onChange(local ? `${e.dial} ${local}` : '')
  }

  function handleLocalChange(v: string) {
    setLocal(v)
    onChange(v ? `${entry.dial} ${v}` : '')
  }

  const filtered = query
    ? DIAL_CODES.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.dial.includes(query)
      )
    : DIAL_CODES

  return (
    <div ref={wrapRef} className="flex gap-0">
      {/* Country code trigger */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:z-10 h-full whitespace-nowrap"
        >
          <span className="text-base leading-none">{flagEmoji(entry.code)}</span>
          <span className="text-gray-700 font-medium">{entry.dial}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search country or code…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">No results</li>
              ) : filtered.map(d => (
                <li
                  key={`${d.code}-${d.dial}`}
                  onClick={() => selectEntry(d)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 ${entry.code === d.code ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'}`}
                >
                  <span className="text-base w-6 text-center leading-none">{flagEmoji(d.code)}</span>
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="text-gray-400 text-xs font-mono">{d.dial}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Local number input */}
      <input
        type="tel"
        value={local}
        onChange={e => handleLocalChange(e.target.value)}
        placeholder="Mobile number"
        className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:z-10"
      />
    </div>
  )
}

// ── Member Form Modal ──────────────────────────────────────────────────────────

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  address: '', city: '', country: 'Philippines', organization: '',
  member_number: '', membership_type: 'regular' as Member['membership_type'],
  status: 'active' as Member['status'], date_admitted: '', sex: '', notes: '',
  avatar_url: '', opt_out_email: false,
}

function MemberFormModal({ open, onClose, member, createMutation, updateMutation }: {
  open: boolean; onClose: () => void; member: Member | null
  createMutation: any; updateMutation: any
}) {
  const [form, setForm] = useState(emptyForm)

  // Sync form when member prop changes
  useEffect(() => {
    if (member) {
      setForm({
        first_name: member.first_name, last_name: member.last_name,
        email: member.email || '', phone: member.phone || '',
        address: member.address || '', city: member.city || '',
        country: member.country || 'Philippines', organization: member.organization || '',
        member_number: member.member_number || '',
        membership_type: member.membership_type, status: member.status,
        date_admitted: member.date_admitted || '', sex: member.sex || '', notes: member.notes || '',
        avatar_url: member.avatar_url || '', opt_out_email: member.opt_out_email,
      })
    } else {
      setForm(emptyForm)
    }
  }, [member])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      email: form.email || null, phone: form.phone || null,
      address: form.address || null, city: form.city || null,
      organization: form.organization || null,
      member_number: form.member_number || null,
      date_admitted: form.date_admitted || null,
      notes: form.notes || null, avatar_url: form.avatar_url || null,
    }
    if (member) { await updateMutation.mutateAsync({ id: member.id, data: payload }) }
    else { await createMutation.mutateAsync(payload as any) }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>{member ? 'Edit Member' : 'Add Member'}</ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
              <input required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
              <input required value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Number</label>
              <input value={form.member_number} onChange={e => setForm(p => ({ ...p, member_number: e.target.value }))} placeholder="e.g. MBR-001" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Admitted</label>
              <input type="date" value={form.date_admitted} onChange={e => setForm(p => ({ ...p, date_admitted: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender/Sex</label>
              <select value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))} className={inp}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
              <select value={form.membership_type} onChange={e => setForm(p => ({ ...p, membership_type: e.target.value as any }))} className={inp}>
                <option value="regular">Regular</option>
                <option value="associate">Associate</option>
                <option value="honorary">Honorary</option>
                <option value="institutional">Institutional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className={inp}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="lapsed">Lapsed</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <CountrySelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} placeholder="e.g. IBON International" className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.opt_out_email}
                  onChange={e => setForm(p => ({ ...p, opt_out_email: e.target.checked }))}
                  className="accent-amber-500 w-4 h-4" />
                <span className="text-sm text-gray-700">Opted out of email communications</span>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {member ? 'Save Changes' : 'Add Member'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ── Dues Tab ───────────────────────────────────────────────────────────────────

const emptyDue = {
  period_label: '', amount: 0, currency: 'PHP', due_date: '',
  paid_date: '', status: 'pending' as MemberDue['status'],
  payment_method: '', reference_number: '', notes: '',
}

function DuesTab({ member, canManage }: { member: Member; canManage?: boolean }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<MemberDue | null>(null)
  const [form, setForm]         = useState(emptyDue)
  const { data: dues = [], isLoading } = useMemberDues(member.id)
  const createDue = useCreateMemberDue()
  const updateDue = useUpdateMemberDue()
  const deleteDue = useDeleteMemberDue()

  function openAdd() { setEditing(null); setForm(emptyDue); setShowForm(true) }
  function openEdit(d: MemberDue) {
    setEditing(d)
    setForm({ period_label: d.period_label, amount: d.amount, currency: d.currency,
      due_date: d.due_date || '', paid_date: d.paid_date || '', status: d.status,
      payment_method: d.payment_method || '', reference_number: d.reference_number || '', notes: d.notes || '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form, member_id: member.id, amount: Number(form.amount),
      due_date: form.due_date || null, paid_date: form.paid_date || null,
      payment_method: form.payment_method || null,
      reference_number: form.reference_number || null, notes: form.notes || null,
    }
    if (editing) { await updateDue.mutateAsync({ id: editing.id, memberId: member.id, data: payload }) }
    else { await createDue.mutateAsync(payload as any) }
    setShowForm(false)
  }

  const si = 'w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Dues Records</p>
        <Button variant="secondary" onClick={openAdd} disabled={!canManage}><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Period Label <span className="text-red-500">*</span></label>
              <input required value={form.period_label} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} placeholder="e.g. 2025 Annual" className={si} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} className={si} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className={si}>
                <option>PHP</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={si} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))} className={si}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            {form.status === 'paid' && (<>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Paid Date</label>
                <input type="date" value={form.paid_date} onChange={e => setForm(p => ({ ...p, paid_date: e.target.value }))} className={si} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <input value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} placeholder="e.g. Bank Transfer" className={si} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Reference #</label>
                <input value={form.reference_number} onChange={e => setForm(p => ({ ...p, reference_number: e.target.value }))} className={si} />
              </div>
            </>)}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className={si} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={createDue.isPending || updateDue.isPending}>{editing ? 'Save' : 'Add Record'}</Button>
          </div>
        </form>
      )}
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
      ) : dues.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No dues records yet.</p>
      ) : (
        <div className="space-y-2">
          {dues.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">{d.period_label}</p>
                <p className="text-xs text-gray-500">
                  {d.currency} {Number(d.amount).toLocaleString()}
                  {d.due_date && <> · Due {formatDate(d.due_date)}</>}
                  {d.paid_date && <> · Paid {formatDate(d.paid_date)}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DUES_STATUS_COLORS[d.status]}`}>{d.status}</span>
                <button onClick={() => openEdit(d)} className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm('Remove this dues record?')) deleteDue.mutate({ id: d.id, memberId: member.id }) }}
                  className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Campaigns Tab ──────────────────────────────────────────────────────────────

function CampaignsTab({ member }: { member: Member }) {
  const { data: history = [], isLoading } = useMemberCampaignHistory(member.id)
  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">This member hasn&apos;t received any campaigns yet.</p>
      ) : (
        <div className="space-y-2">
          {history.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">{r.campaign?.title ?? 'Unknown Campaign'}</p>
                <p className="text-xs text-gray-500">{r.campaign?.subject ?? ''}{r.sent_at && <> · {formatDate(r.sent_at)}</>}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_RECIPIENT_CLS[r.status]}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Member Detail Panel ────────────────────────────────────────────────────────

function MemberDetailPanel({ member, onClose, onEdit, updateMutation, canManage, canDueManage, canCampaigns }: {
  member: Member; onClose: () => void; onEdit: () => void; updateMutation: any; canManage: boolean; canDueManage?: boolean; canCampaigns?: boolean
}) {
  const [tab, setTab] = useState<'profile' | 'dues' | 'campaigns'>('profile')

  async function toggleOptOut() {
    await updateMutation.mutateAsync({ id: member.id, data: { opt_out_email: !member.opt_out_email } })
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[480px] bg-white shadow-2xl flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-lg flex-shrink-0">
            {member.first_name.charAt(0)}{member.last_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.first_name} {member.last_name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {member.member_number && <span className="text-xs text-gray-500">#{member.member_number}</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[member.status]}`}>{member.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[member.membership_type]}`}>{member.membership_type}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><X className="w-4 h-4" /></button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-5">
        {(['profile', 'dues', 'campaigns'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              {member.email && (
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="hover:text-amber-700">{member.email}</a>
                  {member.opt_out_email && (
                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <BellOff className="w-3 h-3" /> opted out
                    </span>
                  )}
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />{member.phone}
                </div>
              )}
              {(member.city || member.country) && (
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {[member.city, member.country].filter(Boolean).join(', ')}
                </div>
              )}
              {member.date_admitted && (
                <div className="flex items-center gap-2.5 text-xs text-gray-500">
                  Admitted: {formatDate(member.date_admitted)}
                </div>
              )}
            </div>
            {member.notes && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700">
                <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>{member.notes}
              </div>
            )}
            {/* Email opt-out toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                {member.opt_out_email ? <BellOff className="w-4 h-4 text-red-400" /> : <BellRing className="w-4 h-4 text-green-500" />}
                <span className="text-sm text-gray-700">Email communications</span>
              </div>
              <button onClick={toggleOptOut} disabled={updateMutation.isPending}
                className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${member.opt_out_email ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}>
                {member.opt_out_email ? 'Re-subscribe' : 'Unsubscribe'}
              </button>
            </div>
            <Button variant="secondary" onClick={onEdit} disabled={!canManage} className="w-full">
              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Profile
            </Button>
          </div>
        )}
        {tab === 'dues' && <DuesTab member={member} canManage={canDueManage} />}
        {tab === 'campaigns' && <CampaignsTab member={member} />}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const canManage = useHasPermission('membership.manage')
  const canDueManage = useHasPermission('membership.dues.manage')
  const canCampaigns = useHasPermission('membership.campaigns.manage')
  const canExport = useHasPermission('membership.export')
  
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(false)
  const [selected, setSelected]         = useState<Member | null>(null)
  const [detailMember, setDetailMember] = useState<Member | null>(null)
  const [sortBy, setSortBy]             = useState<'name' | 'number' | 'type' | 'date' | 'status' | 'country'>('name')
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc')

  const { data: members = [], isLoading } = useMembers(
    statusFilter || typeFilter
      ? { status: statusFilter || undefined, membership_type: typeFilter || undefined }
      : undefined
  )
  const createMutation = useCreateMember()
  const updateMutation = useUpdateMember()
  const deleteMutation = useDeleteMember()

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.member_number?.toLowerCase().includes(q) ||
      m.country?.toLowerCase().includes(q)
    )
  })

  // Sorting logic
  const sortedMembers = [...filtered].sort((a, b) => {
    let aVal: any, bVal: any
    switch (sortBy) {
      case 'name':
        aVal = `${a.first_name} ${a.last_name}`.toLowerCase()
        bVal = `${b.first_name} ${b.last_name}`.toLowerCase()
        break
      case 'number':
        aVal = a.member_number || ''
        bVal = b.member_number || ''
        break
      case 'type':
        aVal = a.membership_type
        bVal = b.membership_type
        break
      case 'date':
        aVal = a.date_admitted || ''
        bVal = b.date_admitted || ''
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'country':
        aVal = (a.country || '').toLowerCase()
        bVal = (b.country || '').toLowerCase()
        break
      default:
        return 0
    }
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? comparison : -comparison
  })

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc' ? 
      <ArrowUp className="w-3 h-3 text-amber-500" /> : 
      <ArrowUp className="w-3 h-3 text-amber-500 transform rotate-180" />
  }

  const stats = {
    total:    members.length,
    active:   members.filter(m => m.status === 'active').length,
    regular:  members.filter(m => m.membership_type === 'regular').length,
    optedOut: members.filter(m => m.opt_out_email).length,
  }

  function exportCsv() {
    const header = 'Member #,First Name,Last Name,Email,Phone,City,Country,Type,Status,Date Admitted,Opt Out\n'
    const rows = filtered.map(m =>
      [m.member_number, m.first_name, m.last_name, m.email, m.phone, m.city, m.country,
       m.membership_type, m.status, m.date_admitted, m.opt_out_email ? 'Yes' : 'No']
        .map(v => `"${v ?? ''}"`)
        .join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'members.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Keep panel in sync after mutations refresh the query
  const syncedDetail = detailMember
    ? (members.find(m => m.id === detailMember.id) ?? detailMember)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
          <p className="text-gray-600 mt-1">Registry of organizational members eligible to vote at General Assemblies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0 || !canExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => { setSelected(null); setModal(true) }} disabled={!canManage}>
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.total,    color: 'text-blue-600',   bg: 'bg-blue-100'   },
          { label: 'Active',        value: stats.active,   color: 'text-green-600',  bg: 'bg-green-100'  },
          { label: 'Regular',       value: stats.regular,  color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Opted Out',     value: stats.optedOut, color: 'text-red-600',    bg: 'bg-red-100'    },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <Users className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, number…"
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 w-60" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="lapsed">Lapsed</option>
          <option value="deceased">Deceased</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Types</option>
          <option value="regular">Regular</option>
          <option value="associate">Associate</option>
          <option value="honorary">Honorary</option>
          <option value="institutional">Institutional</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-2">
                      Member
                      <SortIcon col="name" />
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('number')}>
                    <div className="flex items-center gap-2">
                      Number
                      <SortIcon col="number" />
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('type')}>
                    <div className="flex items-center gap-2">
                      Type
                      <SortIcon col="type" />
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('country')}>
                    <div className="flex items-center gap-2">
                      Country
                      <SortIcon col="country" />
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-2">
                      Date Admitted
                      <SortIcon col="date" />
                    </div>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-2">
                      Status
                      <SortIcon col="status" />
                    </div>
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedMembers.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailMember(m)}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-gray-500">{m.email || '—'}</p>
                        {m.opt_out_email && (
                          <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-red-100">
                            <BellOff className="w-2.5 h-2.5" /> opt-out
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{m.member_number || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[m.membership_type]}`}>
                        {m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{m.country || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{m.date_admitted ? formatDate(m.date_admitted) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(m); setModal(true) }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm(`Remove ${m.first_name} ${m.last_name}?`)) deleteMutation.mutate(m.id) }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDetailMember(m)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <MemberFormModal
        open={modal} onClose={() => setModal(false)} member={selected}
        createMutation={createMutation} updateMutation={updateMutation}
      />

      {/* Detail Panel */}
      {syncedDetail && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setDetailMember(null)} />
          <MemberDetailPanel
            member={syncedDetail}
            onClose={() => setDetailMember(null)}
            onEdit={() => { setSelected(syncedDetail); setModal(true); setDetailMember(null) }}
            updateMutation={updateMutation}
            canManage={canManage}
            canDueManage={canDueManage}
            canCampaigns={canCampaigns}
          />
        </>
      )}
    </div>
  )
}

