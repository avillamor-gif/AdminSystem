'use client'

import React, { useState } from 'react'
import { 
  Building2, Users, Star, DollarSign, FileText, Phone,
  Plus, Edit, Eye, Search, Filter, CheckCircle, XCircle,
  MapPin, Clock, CreditCard, Award, AlertTriangle,
  TrendingUp, Calendar, Globe
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'

interface TravelVendor {
  id: string
  name: string
  category: 'airline' | 'hotel' | 'car_rental' | 'travel_agent' | 'ground_transport' | 'other'
  type: 'preferred' | 'approved' | 'restricted'
  status: 'active' | 'inactive' | 'pending_approval'
  contactInfo: {
    email: string
    phone: string
    website?: string
    address?: string
    city: string
    country: string
  }
  corporateContact: {
    name: string
    title: string
    email: string
    phone: string
  }
  contractInfo: {
    contractNumber: string
    startDate: string
    endDate: string
    autoRenewal: boolean
    terms: string[]
    discountStructure: string
  }
  performance: {
    rating: number
    totalBookings: number
    cancelledBookings: number
    averagePrice: number
    onTimePerformance?: number
    customerSatisfaction: number
  }
  paymentTerms: {
    method: 'net_30' | 'net_60' | 'credit_card' | 'immediate'
    creditLimit?: number
    currency: string
  }
  services: string[]
  coverage: string[]
  lastEvaluation: string
  notes?: string
}

interface VendorContract {
  id: string
  vendorId: string
  vendorName: string
  contractNumber: string
  contractType: 'master_agreement' | 'preferred_rates' | 'volume_discount' | 'exclusive'
  startDate: string
  endDate: string
  value: number
  currency: string
  status: 'active' | 'expiring' | 'expired' | 'under_negotiation'
  keyTerms: string[]
  discounts: {
    type: string
    value: string
    conditions: string[]
  }[]
  performanceMetrics: {
    metric: string
    target: string
    actual: string
    status: 'met' | 'missed' | 'exceeded'
  }[]
  renewalDate?: string
  accountManager: string
}

const VendorManagementPage = () => {
  const [activeTab, setActiveTab] = useState<'vendors' | 'contracts' | 'performance' | 'evaluation'>('vendors')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const travelVendors: TravelVendor[] = [
    {
      id: 'VEN001',
      name: 'American Airlines',
      category: 'airline',
      type: 'preferred',
      status: 'active',
      contactInfo: {
        email: 'corporate@aa.com',
        phone: '+1-800-433-7300',
        website: 'www.aa.com',
        address: '4333 Amon Carter Blvd',
        city: 'Fort Worth',
        country: 'United States'
      },
      corporateContact: {
        name: 'Sarah Mitchell',
        title: 'Corporate Sales Manager',
        email: 'sarah.mitchell@aa.com',
        phone: '+1-817-555-0123'
      },
      contractInfo: {
        contractNumber: 'AA-2024-CORP-001',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        autoRenewal: true,
        terms: ['15% discount on published fares', 'Free changes within 24 hours', 'Priority boarding for employees'],
        discountStructure: 'Volume-based tiered discounts: 10-15% based on annual spend'
      },
      performance: {
        rating: 4.5,
        totalBookings: 1250,
        cancelledBookings: 45,
        averagePrice: 485,
        onTimePerformance: 87,
        customerSatisfaction: 4.2
      },
      paymentTerms: {
        method: 'net_30',
        currency: 'USD'
      },
      services: ['Domestic Flights', 'International Flights', 'Business Class', 'First Class'],
      coverage: ['North America', 'Europe', 'South America', 'Asia'],
      lastEvaluation: '2024-02-15T10:30:00Z',
      notes: 'Excellent on-time performance and customer service. Preferred carrier for domestic travel.'
    },
    {
      id: 'VEN002',
      name: 'Marriott International',
      category: 'hotel',
      type: 'preferred',
      status: 'active',
      contactInfo: {
        email: 'corporate@marriott.com',
        phone: '+1-800-721-7033',
        website: 'www.marriott.com',
        city: 'Bethesda',
        country: 'United States'
      },
      corporateContact: {
        name: 'David Chen',
        title: 'Global Corporate Sales Director',
        email: 'david.chen@marriott.com',
        phone: '+1-301-555-0145'
      },
      contractInfo: {
        contractNumber: 'MAR-2024-GLOBAL-002',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        autoRenewal: false,
        terms: ['Corporate rates 20% below BAR', 'Free WiFi', 'Late checkout', 'Complimentary breakfast'],
        discountStructure: 'Flat 20% discount on Best Available Rate'
      },
      performance: {
        rating: 4.7,
        totalBookings: 890,
        cancelledBookings: 23,
        averagePrice: 165,
        customerSatisfaction: 4.6
      },
      paymentTerms: {
        method: 'net_30',
        currency: 'USD'
      },
      services: ['Standard Rooms', 'Executive Rooms', 'Suites', 'Meeting Rooms'],
      coverage: ['Global', 'All Major Cities', '130+ Countries'],
      lastEvaluation: '2024-03-01T14:20:00Z'
    },
    {
      id: 'VEN003',
      name: 'Enterprise Rent-A-Car',
      category: 'car_rental',
      type: 'preferred',
      status: 'active',
      contactInfo: {
        email: 'corporate@enterprise.com',
        phone: '+1-855-266-9565',
        website: 'www.enterprise.com',
        city: 'St. Louis',
        country: 'United States'
      },
      corporateContact: {
        name: 'Michael Johnson',
        title: 'National Account Manager',
        email: 'michael.johnson@enterprise.com',
        phone: '+1-314-555-0167'
      },
      contractInfo: {
        contractNumber: 'ENT-2024-NAT-003',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        autoRenewal: true,
        terms: ['25% discount on base rates', 'Free additional driver', 'Unlimited mileage', 'Priority counter service'],
        discountStructure: '25% off base rates, additional volume discounts available'
      },
      performance: {
        rating: 4.3,
        totalBookings: 456,
        cancelledBookings: 12,
        averagePrice: 45,
        customerSatisfaction: 4.1
      },
      paymentTerms: {
        method: 'credit_card',
        currency: 'USD'
      },
      services: ['Economy Cars', 'Mid-size Cars', 'SUVs', 'Luxury Vehicles'],
      coverage: ['North America', 'Europe', 'Select International'],
      lastEvaluation: '2024-02-28T09:45:00Z'
    }
  ]

  const vendorContracts: VendorContract[] = [
    {
      id: 'CON001',
      vendorId: 'VEN001',
      vendorName: 'American Airlines',
      contractNumber: 'AA-2024-CORP-001',
      contractType: 'volume_discount',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      value: 750000,
      currency: 'USD',
      status: 'active',
      keyTerms: [
        '15% discount on published fares',
        'Free changes within 24 hours',
        'Priority boarding',
        'Waived bag fees for business class'
      ],
      discounts: [
        {
          type: 'Volume Discount',
          value: '10-15%',
          conditions: ['Based on annual spend', 'Minimum $500K annual commitment']
        }
      ],
      performanceMetrics: [
        { metric: 'On-time Performance', target: '85%', actual: '87%', status: 'exceeded' },
        { metric: 'Customer Satisfaction', target: '4.0', actual: '4.2', status: 'exceeded' },
        { metric: 'Booking Volume', target: '1000', actual: '1250', status: 'exceeded' }
      ],
      accountManager: 'Sarah Mitchell'
    },
    {
      id: 'CON002',
      vendorId: 'VEN002',
      vendorName: 'Marriott International',
      contractNumber: 'MAR-2024-GLOBAL-002',
      contractType: 'preferred_rates',
      startDate: '2024-01-01',
      endDate: '2025-12-31',
      value: 450000,
      currency: 'USD',
      status: 'active',
      keyTerms: [
        '20% discount on Best Available Rate',
        'Free WiFi and breakfast',
        'Late checkout until 2 PM',
        'Meeting room discounts'
      ],
      discounts: [
        {
          type: 'Corporate Rate',
          value: '20%',
          conditions: ['Off Best Available Rate', 'Subject to availability']
        }
      ],
      performanceMetrics: [
        { metric: 'Rate Competitiveness', target: 'Top 3', actual: 'Top 2', status: 'exceeded' },
        { metric: 'Customer Satisfaction', target: '4.5', actual: '4.6', status: 'exceeded' },
        { metric: 'Room Nights', target: '800', actual: '890', status: 'exceeded' }
      ],
      accountManager: 'David Chen'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'exceeded': return 'success'
      case 'pending_approval': case 'under_negotiation': case 'met': return 'warning'
      case 'inactive': case 'expired': case 'missed': return 'danger'
      case 'expiring': return 'warning'
      default: return 'outline'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preferred': return 'success'
      case 'approved': return 'info'
      case 'restricted': return 'danger'
      default: return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airline': return '✈️'
      case 'hotel': return '🏨'
      case 'car_rental': return '🚗'
      case 'travel_agent': return '🧳'
      case 'ground_transport': return '🚌'
      default: return '📋'
    }
  }

  const renderVendors = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vendors by name, category, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="airline">Airlines</option>
            <option value="hotel">Hotels</option>
            <option value="car_rental">Car Rental</option>
            <option value="travel_agent">Travel Agents</option>
            <option value="ground_transport">Ground Transport</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="preferred">Preferred</option>
            <option value="approved">Approved</option>
            <option value="restricted">Restricted</option>
          </select>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Vendor List */}
      {travelVendors.map((vendor) => (
        <Card key={vendor.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">{getCategoryIcon(vendor.category)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                  <Badge variant={getTypeColor(vendor.type)} className="text-xs">
                    {vendor.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusColor(vendor.status)} className="text-xs">
                    {vendor.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 capitalize">{vendor.category.replace('_', ' ')}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vendor.contactInfo.city}, {vendor.contactInfo.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {vendor.contactInfo.phone}
                  </span>
                  {vendor.contactInfo.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {vendor.contactInfo.website}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-gray-900">{vendor.performance.rating}</span>
              </div>
              <p className="text-xs text-gray-500">{vendor.performance.totalBookings} bookings</p>
              <p className="text-xs text-blue-600">
                Avg: ${vendor.performance.averagePrice}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500">Contract</p>
              <p className="font-medium font-mono text-xs">{vendor.contractInfo.contractNumber}</p>
              <p className="text-xs text-gray-500">
                Until {new Date(vendor.contractInfo.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Corporate Contact</p>
              <p className="font-medium">{vendor.corporateContact.name}</p>
              <p className="text-xs text-gray-500">{vendor.corporateContact.title}</p>
            </div>
            <div>
              <p className="text-gray-500">Performance</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">{vendor.performance.customerSatisfaction}/5.0</span>
                {vendor.performance.onTimePerformance && (
                  <Badge variant="outline" className="text-xs">
                    {vendor.performance.onTimePerformance}% OTP
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-500">Payment Terms</p>
              <p className="font-medium">{vendor.paymentTerms.method.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500">{vendor.paymentTerms.currency}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Services & Coverage</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {vendor.services.slice(0, 4).map((service, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
              {vendor.services.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{vendor.services.length - 4} more
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {vendor.coverage.slice(0, 3).map((area, index) => (
                <Badge key={index} variant="info" className="text-xs">
                  {area}
                </Badge>
              ))}
              {vendor.coverage.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{vendor.coverage.length - 3} regions
                </Badge>
              )}
            </div>
          </div>

          {vendor.contractInfo.discountStructure && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                <strong>Discount Structure:</strong> {vendor.contractInfo.discountStructure}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Edit Vendor
            </Button>
            <Button size="sm" variant="outline">
              Contract Details
            </Button>
            <Button size="sm" variant="outline">
              Performance Report
            </Button>
            <Button size="sm" variant="outline">
              Contact
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderContracts = () => (
    <div className="space-y-4">
      {vendorContracts.map((contract) => (
        <Card key={contract.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{contract.contractNumber}</h4>
                  <Badge variant={getStatusColor(contract.status)} className="text-xs">
                    {contract.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {contract.contractType.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{contract.vendorName}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {contract.accountManager}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {contract.currency} {contract.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Contract Value</p>
              {contract.status === 'expiring' && (
                <p className="text-xs text-red-600 mt-1">Expires in 30 days</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Key Terms</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <ul className="text-sm text-gray-700 space-y-1">
                {contract.keyTerms.map((term, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {contract.performanceMetrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{metric.metric}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-bold">{metric.actual}</span>
                  <Badge variant={getStatusColor(metric.status)} className="text-xs">
                    {metric.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">Target: {metric.target}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Eye className="w-3 h-3 mr-1" />
              View Contract
            </Button>
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Amend Contract
            </Button>
            <Button size="sm" variant="outline">
              Performance Review
            </Button>
            {contract.status === 'expiring' && (
              <Button size="sm" variant="primary">
                Renew Contract
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Top Performers</h4>
          <p className="text-2xl font-bold text-green-600">8</p>
          <p className="text-sm text-gray-500">Above 4.5 rating</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Avg Performance</h4>
          <p className="text-2xl font-bold text-blue-600">4.3</p>
          <p className="text-sm text-gray-500">Overall rating</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
            <DollarSign className="w-8 h-8 text-orange-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Cost Savings</h4>
          <p className="text-2xl font-bold text-orange-600">$342K</p>
          <p className="text-sm text-gray-500">YTD savings</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Active Vendors</h4>
          <p className="text-2xl font-bold text-purple-600">24</p>
          <p className="text-sm text-gray-500">Under contract</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Performance by Category</h3>
          <div className="space-y-4">
            {[
              { category: 'Airlines', rating: 4.5, spend: 285000, color: 'bg-blue-500' },
              { category: 'Hotels', rating: 4.6, spend: 220000, color: 'bg-green-500' },
              { category: 'Car Rental', rating: 4.2, spend: 85000, color: 'bg-purple-500' },
              { category: 'Ground Transport', rating: 4.0, spend: 42000, color: 'bg-orange-500' }
            ].map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{cat.category}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{cat.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${cat.spend.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">YTD Spend</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Contract Status</h3>
          <div className="space-y-3">
            {[
              { status: 'Active Contracts', count: 18, color: 'bg-green-100 text-green-800' },
              { status: 'Expiring Soon', count: 3, color: 'bg-yellow-100 text-yellow-800' },
              { status: 'Under Negotiation', count: 2, color: 'bg-blue-100 text-blue-800' },
              { status: 'Expired', count: 1, color: 'bg-red-100 text-red-800' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="font-medium text-gray-900">{item.status}</span>
                <Badge variant="outline" className={`${item.color} text-sm`}>
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  const renderEvaluation = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Award className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-800">Vendor Evaluation</h3>
            <p className="text-purple-700 mt-1">
              Systematic evaluation of vendor performance, compliance, and service quality.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Evaluation Criteria</h3>
          <div className="space-y-4">
            {[
              { criteria: 'Service Quality', weight: 30, description: 'Customer satisfaction and service delivery' },
              { criteria: 'Cost Competitiveness', weight: 25, description: 'Pricing and value for money' },
              { criteria: 'Reliability', weight: 20, description: 'On-time performance and consistency' },
              { criteria: 'Contract Compliance', weight: 15, description: 'Adherence to contract terms' },
              { criteria: 'Innovation', weight: 10, description: 'Technology and process improvements' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.criteria}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {item.weight}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Evaluations</h3>
          <div className="space-y-3">
            {[
              { vendor: 'American Airlines', dueDate: '2024-04-15', type: 'Annual Review' },
              { vendor: 'Enterprise Rent-A-Car', dueDate: '2024-04-20', type: 'Quarterly Review' },
              { vendor: 'Hilton Hotels', dueDate: '2024-05-01', type: 'Contract Renewal' },
              { vendor: 'Delta Airlines', dueDate: '2024-05-15', type: 'Performance Review' }
            ].map((evaluation, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{evaluation.vendor}</p>
                  <p className="text-sm text-gray-600">{evaluation.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(evaluation.dueDate).toLocaleDateString()}
                  </p>
                  <Badge variant="warning" className="text-xs">
                    Due Soon
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500 mt-1">Manage travel service providers, contracts, and performance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Vendor Report
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'vendors', label: 'Vendors', icon: Building2, count: travelVendors.length },
            { id: 'contracts', label: 'Contracts', icon: FileText, count: vendorContracts.length },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'evaluation', label: 'Evaluation', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant={activeTab === tab.id ? "outline" : "secondary"} className="ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'contracts' && renderContracts()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'evaluation' && renderEvaluation()}
        </div>
      </Card>
    </div>
  )
}

export default VendorManagementPage