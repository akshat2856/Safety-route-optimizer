import React, { useState, useRef, useEffect } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet"
import L from "leaflet"
import {
  Shield,
  MapPin,
  Route,
  Clock,
  Phone,
  Navigation,
  ArrowLeft
} from "lucide-react"
import "leaflet/dist/leaflet.css"

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
})

// Custom icons for different zones
const createCustomIcon = color => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

const safeIcon = createCustomIcon("#10B981")
const mediumRiskIcon = createCustomIcon("#F59E0B")
const highRiskIcon = createCustomIcon("#EF4444")
const mineIcon = createCustomIcon("#3B82F6")

function MapController({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

function App() {
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [mapCenter, setMapCenter] = useState([40.7128, -74.006])
  const [mapZoom, setMapZoom] = useState(13)
  const [mineLocations, setMineLocations] = useState([])
  const [routes, setRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState("fastest")
  const [showRoutes, setShowRoutes] = useState(false)
  const mapRef = useRef(null)

  // Sample mine and safe zone data - in real implementation, this would come from your AI system
  const generateMineData = (centerLat, centerLng) => {
    // Generate one mine location within 1km of entered coordinates
    const mineOffset = {
      lat: (Math.random() - 0.5) * 0.01, // Random offset within ~1km
      lng: (Math.random() - 0.5) * 0.01
    }

    return [
      {
        id: "mine_1",
        lat: centerLat + mineOffset.lat,
        lng: centerLng + mineOffset.lng,
        name: "Mine Site",
        riskLevel: "mine",
        type: "mine"
      },
      {
        id: "safe_1",
        lat: centerLat + (Math.random() - 0.5) * 0.025 + 0.015,
        lng: centerLng + (Math.random() - 0.5) * 0.025 + 0.018,
        name: "Emergency Assembly Point",
        riskLevel: "safe",
        type: "emergency_assembly"
      },
      {
        id: "safe_2",
        lat: centerLat + (Math.random() - 0.5) * 0.03 - 0.012,
        lng: centerLng + (Math.random() - 0.5) * 0.03 + 0.015,
        name: "Evacuation Center",
        riskLevel: "safe",
        type: "evacuation_center"
      }
    ]
  }

  // Generate routes between mine and safe zones
  const generateRoutes = (mine, safeZones) => {
    const safeZonesList = safeZones.filter(zone => zone.riskLevel === "safe")

    // Generate two routes: one to each safe zone
    const routes = []

    safeZonesList.forEach((zone, index) => {
      const distance = Math.random() * 2 + 1 // Random distance between 1-3 km
      const isFirstRoute = index === 0

      // Create more realistic curved routes
      const midPoint1 = [
        mine.lat + (zone.lat - mine.lat) * 0.3 + (Math.random() - 0.5) * 0.008,
        mine.lng + (zone.lng - mine.lng) * 0.4 + (Math.random() - 0.5) * 0.008
      ]

      const midPoint2 = [
        mine.lat + (zone.lat - mine.lat) * 0.7 + (Math.random() - 0.5) * 0.006,
        mine.lng + (zone.lng - mine.lng) * 0.6 + (Math.random() - 0.5) * 0.006
      ]

      routes.push({
        name: isFirstRoute ? "Fastest Route" : "Safest Route",
        duration: isFirstRoute
          ? `${Math.floor(distance * 2 + 3)} minutes`
          : `${Math.floor(distance * 3 + 5)} minutes`,
        distance: `${distance.toFixed(1)} km`,
        riskLevel: isFirstRoute
          ? "Direct route, medium risk"
          : "Longer route, avoids danger zones",
        coordinates: [
          [mine.lat, mine.lng],
          midPoint1,
          midPoint2,
          [zone.lat, zone.lng]
        ],
        color: isFirstRoute ? "#3B82F6" : "#F59E0B" // Blue for fastest, orange for safest
      })
    })

    return routes
  }

  const handleLocationSubmit = () => {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid latitude and longitude values")
      return
    }

    setMapCenter([lat, lng])
    setMapZoom(15)

    const mines = generateMineData(lat, lng)
    setMineLocations(mines)

    // Use the first mine for route generation
    const mine = mines.find(m => m.type === "mine")
    if (mine) {
      const routeData = generateRoutes(mine, mines)
      setRoutes(routeData)
      setShowRoutes(true)
    }
  }

  const getMarkerIcon = location => {
    switch (location.riskLevel) {
      case "safe":
        return safeIcon
      case "medium":
        return mediumRiskIcon
      case "high":
        return highRiskIcon
      case "mine":
        return mineIcon
      default:
        return safeIcon
    }
  }

  const getCurrentRoute = () => {
    return routes.find(
      r =>
        (selectedRoute === "fastest" && r.name === "Fastest Route") ||
        (selectedRoute === "safest" && r.name === "Safest Route")
    )
  }

  const safeZones = mineLocations.filter(loc => loc.riskLevel === "safe")

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">FALCON</h1>
              <p className="text-sm text-gray-400">
                AI-based Rockfall Prediction System
              </p>
            </div>
          </div>
          {/* Removed Models Info, Test User, and Logout buttons as requested */}
        </div>
      </div>

      {/* Location Input */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Latitude"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              step="any"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Longitude"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              step="any"
            />
          </div>
          <button
            onClick={handleLocationSubmit}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Find Mines</span>
          </button>
        </div>
      </div>

      {/* Removed Start Evacuation line as requested */}

      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Sidebar */}
        {showRoutes && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Routes Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Route className="w-5 h-5 mr-2 text-blue-400" />
                  Routes
                </h2>

                <div className="space-y-3">
                  {routes.map((route, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        setSelectedRoute(
                          route.name === "Fastest Route" ? "fastest" : "safest"
                        )
                      }
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        (selectedRoute === "fastest" &&
                          route.name === "Fastest Route") ||
                        (selectedRoute === "safest" &&
                          route.name === "Safest Route")
                          ? "bg-gray-700 border border-gray-600"
                          : "bg-gray-750 hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{route.name}</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: route.color }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {route.duration}
                          </span>
                          <span>{route.distance}</span>
                        </div>
                        <p className="mt-1">{route.riskLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-red-400" />
                  Emergency
                </h2>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-red-900 rounded-lg">
                    <span>Emergency</span>
                    <span className="font-mono">911</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-900 rounded-lg">
                    <span>Mine Safety</span>
                    <span className="font-mono">555-SAFE</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-900 rounded-lg">
                    <span>Coordinator</span>
                    <span className="font-mono">555-EVAC</span>
                  </div>
                </div>
              </div>

              {/* Directions */}
              <div>
                <h3 className="font-semibold mb-3">Directions</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <div>
                      <p>Head northwest on Mine Access Road</p>
                      <p className="text-gray-500">0.8 km</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <div>
                      <p>Turn left onto Safety Bypass Route</p>
                      <p className="text-gray-500">Continue to safe zone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Section */}
        <div className="flex-1 relative">
          <div className="absolute top-4 left-4 z-[1000] bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center space-x-2 text-green-400">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">Route Map</span>
            </div>
            {getCurrentRoute() && (
              <div className="mt-2 text-sm text-gray-300">
                <p>
                  {getCurrentRoute()?.name} • {getCurrentRoute()?.duration}
                </p>
              </div>
            )}
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full"
            zoomControl={true}
          >
            <MapController center={mapCenter} zoom={mapZoom} />

            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
            />

            {mineLocations.map(location => (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={getMarkerIcon(location)}
              >
                <Popup>
                  <div className="text-gray-900">
                    <h3 className="font-semibold">{location.name}</h3>
                    <p className="text-sm">
                      Type: {location.type.replace("_", " ")}
                    </p>
                    <p className="text-sm">Risk Level: {location.riskLevel}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {showRoutes && getCurrentRoute() && (
              <Polyline
                positions={getCurrentRoute().coordinates}
                color={getCurrentRoute().color}
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>

          <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-black bg-opacity-50 px-2 py-1 rounded">
            <a
              href="https://leafletjs.com"
              title="A JavaScript library for interactive maps"
            >
              Leaflet
            </a>{" "}
            | © Esri
          </div>
        </div>

        {/* Right Sidebar */}
        {showRoutes && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-400" />
                  Safe Zones
                </h2>

                <div className="space-y-4">
                  {safeZones.map(zone => (
                    <div key={zone.id} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-green-400 mb-2">
                        {zone.type === "emergency_assembly"
                          ? "Emergency Assembly"
                          : zone.type === "evacuation_center"
                          ? "Evacuation Center"
                          : "Safe Zone"}
                      </h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p>
                          Dist: {(Math.random() * 8 + 2).toFixed(1)}km | ETA:{" "}
                          {Math.floor(Math.random() * 15 + 8)} minutes
                        </p>
                        {zone.type === "emergency_assembly" && (
                          <>
                            <p className="text-green-400">
                              First Aid Available
                            </p>
                            <p className="text-blue-400">
                              Communication Center
                            </p>
                          </>
                        )}
                        {zone.type === "evacuation_center" && (
                          <>
                            <p className="text-blue-400">Medical Facility</p>
                            <p className="text-purple-400">Shelter Available</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Results</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
