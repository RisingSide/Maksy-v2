'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin,
  Navigation,
  Clock,
  Briefcase,
  RefreshCw,
  Loader2,
  Play,
  CheckCircle,
  Car,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Route,
  Timer,
} from 'lucide-react'
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, addDays, subDays } from 'date-fns'

// Types
interface TeamMember {
  id: string
  userId: string | null
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
  status: 'available' | 'on-the-way' | 'at-job' | 'working'
  currentJob: {
    id: string
    jobNumber: string
    customerName: string
    serviceName: string | null
    address: string | null
    city: string | null
    scheduledTime: string
  } | null
  nextJob: {
    id: string
    jobNumber: string
    customerName: string
    serviceName: string | null
    scheduledTime: string
  } | null
  currentLocation: { lat: number; lng: number } | null
  eta: string | null
  todaysJobCount: number
  completedJobCount: number
}

interface TrackingData {
  team: TeamMember[]
  metrics: {
    totalJobs: number
    completedJobs: number
    avgDriveTime: number
    totalMiles: number
    totalJobTime: number
    onTimeRate: number
  }
  date: string
}

// Map styles for dark mode
const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
]

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795, // Center of US
}

// Status badge component
function StatusBadge({ status }: { status: TeamMember['status'] }) {
  const config = {
    available: {
      label: 'Available',
      className:
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    'on-the-way': {
      label: 'On The Way',
      className:
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    'at-job': {
      label: 'At Job',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    working: {
      label: 'Working',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
  }

  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: number
  trendLabel?: string
}) {
  return (
    <Card className="glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs',
                  trend >= 0 ? 'text-green-500' : 'text-red-500'
                )}
              >
                {trend > 0 ? '+' : ''}
                {trend}% {trendLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Main component
export function TimeGPSClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<TrackingData | null>(null)
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)

  // Load Google Maps
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  // Fetch tracking data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tracking?date=${selectedDate}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)

        // Center map on first team member with location
        const memberWithLocation = result.team.find(
          (m: TeamMember) => m.currentLocation
        )
        if (memberWithLocation?.currentLocation) {
          setMapCenter(memberWithLocation.currentLocation)
        }
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error)
      toast.error('Failed to load tracking data')
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Handle tracking action
  const handleTrackingAction = async (
    jobId: string,
    action: 'on-my-way' | 'arrived' | 'started' | 'completed'
  ) => {
    try {
      // Get current location
      let latitude: number | undefined
      let longitude: number | undefined

      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            })
          }
        ).catch(() => null)

        if (position) {
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        }
      }

      const response = await fetch('/api/tracking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action, latitude, longitude }),
      })

      if (response.ok) {
        toast.success(`Status updated: ${action.replace('-', ' ')}`)
        fetchData()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Error updating tracking:', error)
      toast.error('Failed to update status')
    }
  }

  // Date navigation
  const goToDate = (direction: 'prev' | 'next' | 'today') => {
    const current = new Date(selectedDate)
    let newDate: Date

    switch (direction) {
      case 'prev':
        newDate = subDays(current, 1)
        break
      case 'next':
        newDate = addDays(current, 1)
        break
      default:
        newDate = new Date()
    }

    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Time & GPS Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor your team in the field
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToDate('prev')}
            >
              <span className="sr-only">Previous day</span>←
            </Button>
            <Button variant="outline" onClick={() => goToDate('today')}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToDate('next')}
            >
              <span className="sr-only">Next day</span>→
            </Button>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(selectedDate), 'MMM d, yyyy')}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Jobs Today"
              value={`${data?.metrics.completedJobs || 0}/${data?.metrics.totalJobs || 0}`}
              icon={Briefcase}
            />
            <StatCard
              title="Avg Drive Time"
              value={`${data?.metrics.avgDriveTime || 0} min`}
              icon={Car}
              trend={-8}
              trendLabel="vs avg"
            />
            <StatCard
              title="Miles Today"
              value={`${data?.metrics.totalMiles || 0} mi`}
              icon={Route}
            />
            <StatCard
              title="On-Time Rate"
              value={`${data?.metrics.onTimeRate || 0}%`}
              icon={Timer}
              trend={2}
              trendLabel="this week"
            />
          </div>

          {/* Map and Team List */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map */}
            <Card className="glass-card p-4 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Live Map
              </h3>
              <div className="h-[400px] rounded-lg overflow-hidden">
                {mapsLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    options={{
                      styles: darkMapStyles,
                      disableDefaultUI: false,
                      zoomControl: true,
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: true,
                    }}
                  >
                    {data?.team
                      .filter((m) => m.currentLocation)
                      .map((member) => (
                        <Marker
                          key={member.id}
                          position={member.currentLocation!}
                          onClick={() => setSelectedMember(member)}
                          icon={{
                            url: `data:image/svg+xml,${encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="${
                                  member.status === 'working'
                                    ? '#22c55e'
                                    : member.status === 'at-job'
                                      ? '#3b82f6'
                                      : '#f4a125'
                                }" stroke="white" stroke-width="3"/>
                                <text x="20" y="25" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                                  ${member.name.charAt(0)}
                                </text>
                              </svg>
                            `)}`,
                            scaledSize: new google.maps.Size(40, 40),
                          }}
                        />
                      ))}

                    {selectedMember && selectedMember.currentLocation && (
                      <InfoWindow
                        position={selectedMember.currentLocation}
                        onCloseClick={() => setSelectedMember(null)}
                      >
                        <div className="p-2 min-w-[200px]">
                          <p className="font-semibold text-gray-900">
                            {selectedMember.name}
                          </p>
                          <StatusBadge status={selectedMember.status} />
                          {selectedMember.currentJob && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p className="font-medium">
                                {selectedMember.currentJob.serviceName}
                              </p>
                              <p>{selectedMember.currentJob.customerName}</p>
                              {selectedMember.eta && (
                                <p className="text-orange-600">
                                  ETA: {selectedMember.eta}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <div className="h-full bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                          ? 'Loading map...'
                          : 'Google Maps API key not configured'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Team List */}
            <Card className="glass-card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Team Status
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data?.team.map((member) => (
                  <Card
                    key={member.id}
                    className={cn(
                      'p-4 bg-background/60 hover:bg-accent/30 transition-colors cursor-pointer',
                      selectedMember?.id === member.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => {
                      setSelectedMember(member)
                      if (member.currentLocation) {
                        setMapCenter(member.currentLocation)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{member.name}</p>
                          <StatusBadge status={member.status} />
                        </div>

                        {member.currentJob && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {member.currentJob.serviceName || 'Job'} -{' '}
                                {member.currentJob.customerName}
                              </span>
                            </div>
                            {member.status === 'on-the-way' && member.eta && (
                              <div className="flex items-center gap-1 text-xs text-orange-500">
                                <Navigation className="h-3 w-3" />
                                <span>ETA: {member.eta}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {member.nextJob && member.status === 'available' && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span>
                              Next: {member.nextJob.scheduledTime} -{' '}
                              {member.nextJob.customerName}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-muted-foreground">
                          {member.completedJobCount}/{member.todaysJobCount}{' '}
                          jobs completed
                        </div>

                        {/* Quick Actions */}
                        {member.currentJob && member.status !== 'available' && (
                          <div className="mt-3 flex gap-2">
                            {member.status === 'on-the-way' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTrackingAction(
                                    member.currentJob!.id,
                                    'arrived'
                                  )
                                }}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Arrived
                              </Button>
                            )}
                            {member.status === 'at-job' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTrackingAction(
                                    member.currentJob!.id,
                                    'started'
                                  )
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {member.status === 'working' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTrackingAction(
                                    member.currentJob!.id,
                                    'completed'
                                  )
                                }}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                {(!data?.team || data.team.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No team members found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
