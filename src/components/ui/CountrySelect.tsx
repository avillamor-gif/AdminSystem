'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

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

const base = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400'

interface CountrySelectProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export function CountrySelect({ value, onChange, className }: CountrySelectProps) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef           = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) { setQuery(''); inputRef.current?.focus() }
  }, [open])

  const filtered = query
    ? COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES

  function select(country: string) { onChange(country); setOpen(false) }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${base} ${className ?? ''} flex items-center justify-between text-left ${!value ? 'text-gray-400' : 'text-gray-900'}`}
      >
        <span className="truncate">{value || 'Select country…'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
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
