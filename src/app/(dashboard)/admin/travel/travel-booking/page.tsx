'use client'

import React, { useState } from 'react'
import { 
  Plane, Hotel, Car, Search, Filter, Calendar, Clock,
  MapPin, DollarSign, Star, Building, Users, CreditCard,
  CheckCircle, XCircle, AlertTriangle, Plus, Edit
} from 'lucide-react'
import { Card, Button, Badge, Input } from '@/components/ui'

interface FlightBooking {
  id: string
  bookingReference: string
  employeeId: string
  employeeName: string
  requestId: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    date: string
    time: string
  }
  arrival: {
    airport: string
    city: string
    date: string
    time: string
  }
  class: 'economy' | 'business' | 'first'
  price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  bookingDate: string
  seatNumber?: string
  mealPreference?: string
  specialRequests?: string
}

interface HotelBooking {
  id: string
  bookingReference: string
  employeeId: string
  employeeName: string
  requestId: string
  hotelName: string
  address: string
  city: string
  country: string
  checkIn: string
  checkOut: string
  nights: number
  roomType: string
  rate: number
  totalCost: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  amenities: string[]
  rating: number
  cancellationPolicy: string
  confirmation?: string
}

interface CarRentalBooking {
  id: string
  bookingReference: string
  employeeId: string
  employeeName: string
  requestId: string
  rentalCompany: string
  vehicleType: string
  model: string
  pickupLocation: string
  dropoffLocation: string
  pickupDate: string
  returnDate: string
  days: number
  dailyRate: number
  totalCost: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  features: string[]
  driverAge: number
  insurance: boolean
}

const TravelBookingPage = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars' | 'search'>('flights')
  const [searchQuery, setSearchQuery] = useState('')

  const flightBookings: FlightBooking[] = [
    {
      id: 'FL001',
      bookingReference: 'ABC123',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      requestId: 'TR-2024-001',
      airline: 'American Airlines',
      flightNumber: 'AA1234',
      departure: {
        airport: 'LAX',
        city: 'Los Angeles',
        date: '2024-03-15',
        time: '08:30'
      },
      arrival: {
        airport: 'JFK',
        city: 'New York',
        date: '2024-03-15',
        time: '16:45'
      },
      class: 'business',
      price: 1250,
      status: 'confirmed',
      bookingDate: '2024-02-20T10:30:00Z',
      seatNumber: '2A',
      mealPreference: 'Vegetarian',
      specialRequests: 'Aisle seat preferred'
    },
    {
      id: 'FL002',
      bookingReference: 'DEF456',
      employeeId: 'EMP002',
      employeeName: 'Emily Davis',
      requestId: 'TR-2024-002',
      airline: 'British Airways',
      flightNumber: 'BA178',
      departure: {
        airport: 'LAX',
        city: 'Los Angeles',
        date: '2024-04-10',
        time: '14:20'
      },
      arrival: {
        airport: 'LHR',
        city: 'London',
        date: '2024-04-11',
        time: '09:30'
      },
      class: 'economy',
      price: 850,
      status: 'confirmed',
      bookingDate: '2024-02-19T14:20:00Z'
    }
  ]

  const hotelBookings: HotelBooking[] = [
    {
      id: 'HT001',
      bookingReference: 'HTL789',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      requestId: 'TR-2024-001',
      hotelName: 'Marriott Marquis Times Square',
      address: '1535 Broadway',
      city: 'New York',
      country: 'United States',
      checkIn: '2024-03-15',
      checkOut: '2024-03-18',
      nights: 3,
      roomType: 'Executive King Room',
      rate: 350,
      totalCost: 1050,
      status: 'confirmed',
      amenities: ['WiFi', 'Gym', 'Business Center', 'Restaurant'],
      rating: 4.5,
      cancellationPolicy: 'Free cancellation until 24 hours before check-in',
      confirmation: 'MQT123456'
    },
    {
      id: 'HT002',
      bookingReference: 'HTL101',
      employeeId: 'EMP002',
      employeeName: 'Emily Davis',
      requestId: 'TR-2024-002',
      hotelName: 'The Langham London',
      address: '1C Portland Place',
      city: 'London',
      country: 'United Kingdom',
      checkIn: '2024-04-10',
      checkOut: '2024-04-13',
      nights: 3,
      roomType: 'Classic Room',
      rate: 280,
      totalCost: 840,
      status: 'confirmed',
      amenities: ['WiFi', 'Spa', 'Fine Dining', 'Concierge'],
      rating: 5.0,
      cancellationPolicy: 'Free cancellation until 48 hours before check-in',
      confirmation: 'LNG789012'
    }
  ]

  const carRentalBookings: CarRentalBooking[] = [
    {
      id: 'CR001',
      bookingReference: 'CAR456',
      employeeId: 'EMP001',
      employeeName: 'John Smith',
      requestId: 'TR-2024-001',
      rentalCompany: 'Enterprise',
      vehicleType: 'Executive',
      model: 'BMW 3 Series',
      pickupLocation: 'JFK Airport',
      dropoffLocation: 'JFK Airport',
      pickupDate: '2024-03-15',
      returnDate: '2024-03-18',
      days: 3,
      dailyRate: 85,
      totalCost: 255,
      status: 'confirmed',
      features: ['GPS', 'Premium Sound', 'Leather Seats'],
      driverAge: 35,
      insurance: true
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'danger'
      case 'completed': return 'info'
      default: return 'outline'
    }
  }

  const renderFlights = () => (
    <div className="space-y-4">
      {flightBookings.map((flight) => (
        <Card key={flight.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plane className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{flight.airline} {flight.flightNumber}</h4>
                  <Badge variant={getStatusColor(flight.status)} className="text-xs">
                    {flight.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {flight.class.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{flight.employeeName}</p>
                <p className="text-xs text-gray-500">Booking Ref: {flight.bookingReference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${flight.price.toLocaleString()}</p>
              {flight.seatNumber && (
                <p className="text-xs text-blue-600">Seat {flight.seatNumber}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{flight.departure.time}</p>
                <p className="text-sm text-gray-600">{flight.departure.airport}</p>
                <p className="text-xs text-gray-500">{flight.departure.city}</p>
                <p className="text-xs text-gray-500">
                  {new Date(flight.departure.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex-1 px-4">
                <div className="relative">
                  <div className="h-0.5 bg-gray-300 w-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1">
                    <Plane className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-1">Direct Flight</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{flight.arrival.time}</p>
                <p className="text-sm text-gray-600">{flight.arrival.airport}</p>
                <p className="text-xs text-gray-500">{flight.arrival.city}</p>
                <p className="text-xs text-gray-500">
                  {new Date(flight.arrival.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {(flight.mealPreference || flight.specialRequests) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              {flight.mealPreference && (
                <div>
                  <p className="text-gray-500">Meal Preference</p>
                  <p className="font-medium">{flight.mealPreference}</p>
                </div>
              )}
              {flight.specialRequests && (
                <div>
                  <p className="text-gray-500">Special Requests</p>
                  <p className="font-medium">{flight.specialRequests}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Modify Booking
            </Button>
            <Button size="sm" variant="outline">
              Check-in Online
            </Button>
            <Button size="sm" variant="danger">
              Cancel Booking
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderHotels = () => (
    <div className="space-y-4">
      {hotelBookings.map((hotel) => (
        <Card key={hotel.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Hotel className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{hotel.hotelName}</h4>
                  <Badge variant={getStatusColor(hotel.status)} className="text-xs">
                    {hotel.status.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    {hotel.rating % 1 !== 0 && (
                      <Star className="w-3 h-3 fill-yellow-400/50 text-yellow-400" />
                    )}
                    <span className="text-xs text-gray-500 ml-1">{hotel.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{hotel.employeeName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">{hotel.address}, {hotel.city}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${hotel.totalCost.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{hotel.nights} nights</p>
              <p className="text-xs text-blue-600">${hotel.rate}/night</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Check-in</p>
                <p className="text-sm text-gray-600">
                  {new Date(hotel.checkIn).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">3:00 PM</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Check-out</p>
                <p className="text-sm text-gray-600">
                  {new Date(hotel.checkOut).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">11:00 AM</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Room Type</p>
                <p className="text-sm text-gray-600">{hotel.roomType}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {hotel.confirmation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Confirmation Number: <strong>{hotel.confirmation}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mb-4">
            <strong>Cancellation Policy:</strong> {hotel.cancellationPolicy}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Modify Booking
            </Button>
            <Button size="sm" variant="outline">
              View Details
            </Button>
            <Button size="sm" variant="danger">
              Cancel Booking
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderCars = () => (
    <div className="space-y-4">
      {carRentalBookings.map((car) => (
        <Card key={car.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Car className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{car.model}</h4>
                  <Badge variant={getStatusColor(car.status)} className="text-xs">
                    {car.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {car.vehicleType}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{car.employeeName} • {car.rentalCompany}</p>
                <p className="text-xs text-gray-500">Booking Ref: {car.bookingReference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${car.totalCost.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{car.days} days</p>
              <p className="text-xs text-blue-600">${car.dailyRate}/day</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Pickup</p>
                <p className="text-sm text-gray-600">{car.pickupLocation}</p>
                <p className="text-xs text-gray-500">
                  {new Date(car.pickupDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Return</p>
                <p className="text-sm text-gray-600">{car.dropoffLocation}</p>
                <p className="text-xs text-gray-500">
                  {new Date(car.returnDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Insurance</p>
              <p className="text-sm font-medium text-gray-900">
                {car.insurance ? 'Full Coverage' : 'Basic Coverage'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Button size="sm" variant="outline">
              <Edit className="w-3 h-3 mr-1" />
              Modify Booking
            </Button>
            <Button size="sm" variant="outline">
              View Rental Agreement
            </Button>
            <Button size="sm" variant="danger">
              Cancel Booking
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderSearch = () => (
    <div className="space-y-6">
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Search className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Search & Book Travel</h3>
            <p className="text-blue-700 mt-1">
              Search and compare flights, hotels, and car rentals to find the best options for your business travel.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 bg-blue-100 rounded-lg inline-block mb-4">
            <Plane className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Flight Search</h4>
          <p className="text-sm text-gray-600 mb-4">
            Search and compare flights from multiple airlines to find the best deals.
          </p>
          <Button className="w-full">Search Flights</Button>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
            <Hotel className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Hotel Search</h4>
          <p className="text-sm text-gray-600 mb-4">
            Find and book hotels that meet your company's travel policies and standards.
          </p>
          <Button className="w-full">Search Hotels</Button>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
            <Car className="w-8 h-8 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Car Rental</h4>
          <p className="text-sm text-gray-600 mb-4">
            Book rental cars from preferred vendors with pre-negotiated corporate rates.
          </p>
          <Button className="w-full">Search Cars</Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Booking Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Corporate Travel Portal',
              description: 'Access your organization\'s preferred booking platform',
              action: 'Launch Portal'
            },
            {
              title: 'Expense Integration',
              description: 'Bookings automatically sync with expense management',
              action: 'View Integration'
            },
            {
              title: 'Travel Alerts',
              description: 'Get notified of flight changes, delays, and cancellations',
              action: 'Setup Alerts'
            },
            {
              title: 'Mobile Check-in',
              description: 'Quick access to mobile boarding passes and hotel keys',
              action: 'Download App'
            }
          ].map((tool, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{tool.title}</h4>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </div>
              <Button size="sm" variant="outline">{tool.action}</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Booking</h1>
          <p className="text-gray-500 mt-1">Manage flight, hotel, and car rental bookings for business travel</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Travel Calendar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 border-b border-gray-200 pb-4 mb-6">
          {[
            { id: 'flights', label: 'Flights', icon: Plane, count: flightBookings.length },
            { id: 'hotels', label: 'Hotels', icon: Hotel, count: hotelBookings.length },
            { id: 'cars', label: 'Car Rentals', icon: Car, count: carRentalBookings.length },
            { id: 'search', label: 'Search & Book', icon: Search }
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
          {activeTab === 'flights' && renderFlights()}
          {activeTab === 'hotels' && renderHotels()}
          {activeTab === 'cars' && renderCars()}
          {activeTab === 'search' && renderSearch()}
        </div>
      </Card>
    </div>
  )
}

export default TravelBookingPage