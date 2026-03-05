'use client'

import { useState } from 'react'
import { Globe, MapPin, Building, Users, TrendingUp } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useLocations } from '@/hooks/useLocations'

export default function InternationalOperationsPage() {
  const { data: locations = [], isLoading } = useLocations()

  // Group locations by country
  const locationsByCountry = locations.reduce((acc, location) => {
    const country = location.country
    if (!acc[country]) {
      acc[country] = []
    }
    acc[country].push(location)
    return acc
  }, {} as Record<string, any[]>)

  const countries = Object.keys(locationsByCountry).sort()
  const totalCountries = countries.length
  const totalLocations = locations.length
  const activeLocations = locations.filter(l => l.status === 'active').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading international operations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">International Operations</h1>
        <p className="text-gray-600 mt-1">
          Manage international offices and global operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Countries</p>
              <p className="text-2xl font-bold text-gray-900">{totalCountries}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{totalLocations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeLocations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Headquarters</p>
              <p className="text-2xl font-bold text-orange-600">{locations.filter(l => l.is_headquarters).length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {countries.length === 0 ? (
          <Card className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No international operations yet</h3>
            <p className="text-gray-600">Add locations to see international presence</p>
          </Card>
        ) : (
          countries.map((country) => {
            const countryLocations = locationsByCountry[country]
            const activeCount = countryLocations.filter(l => l.status === 'active').length
            const cities = new Set(countryLocations.map(l => l.city).filter(Boolean))

            return (
              <Card key={country} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{country}</h3>
                      <p className="text-sm text-gray-500">{countryLocations.length} locations across {cities.size} cities</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {activeCount} Active
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {countryLocations.map((location) => (
                    <div key={location.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <h4 className="font-medium text-gray-900">{location.name}</h4>
                        </div>
                        {location.is_headquarters && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">HQ</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{location.city}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-700 text-xs capitalize">
                          {location.location_type?.replace('_', ' ')}
                        </Badge>
                        <Badge className={location.status === 'active' ? 'bg-green-100 text-green-700 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                          {location.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
