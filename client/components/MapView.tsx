import React, { useEffect, useRef, useState } from "react";
import { Job, User } from "@shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Route,
  User as UserIcon,
  Calendar,
  Navigation,
  Home,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GoogleMapsView } from "./GoogleMapsView";

// Fix for default markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapViewProps {
  jobs: Job[];
  staff: User[];
  selectedStaff?: string;
  selectedDate: Date;
  onJobClick?: (job: Job) => void;
}

// Leaflet Map Fallback Component
function LeafletMapFallback({
  jobs,
  baseLocation,
}: {
  jobs: Job[];
  baseLocation: { lat: number; lng: number; address: string; name: string };
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize Leaflet map
    mapInstance.current = L.map(mapRef.current).setView(
      [baseLocation.lat, baseLocation.lng],
      12,
    );

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    // Add base location marker
    L.marker([baseLocation.lat, baseLocation.lng])
      .addTo(mapInstance.current)
      .bindPopup(`<b>${baseLocation.name}</b><br>${baseLocation.address}`);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [baseLocation]);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) =>
      mapInstance.current?.removeLayer(marker),
    );
    markersRef.current = [];

    // Add job markers with estimated coordinates
    jobs.forEach((job) => {
      // Simple coordinate estimation based on staff base location with random offset
      const baseCoords = baseLocation;
      const randomOffset = 0.05; // ~5km radius
      const coords = {
        lat: baseCoords.lat + (Math.random() - 0.5) * randomOffset,
        lng: baseCoords.lng + (Math.random() - 0.5) * randomOffset,
      };

      if (mapInstance.current) {
        const marker = L.marker([coords.lat, coords.lng]).addTo(
          mapInstance.current,
        ).bindPopup(`
            <b>${job.title}</b><br>
            ${job.insuredName || job.InsuredName || "No client"}<br>
            ${job.riskAddress || job.RiskAddress || job.address || "No address"}
          `);
        markersRef.current.push(marker);
      }
    });
  }, [jobs, baseLocation]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {jobs.length} jobs on fallback map
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Retry Google Maps
        </button>
      </div>
      <div ref={mapRef} className="h-[400px] w-full rounded-lg border" />
    </div>
  );
}

// Staff base locations
const STAFF_BASE_LOCATIONS = {
  "cape town": {
    lat: -33.8567,
    lng: 18.4445,
    address: "98 Marine Dr, Paarden Eiland, Cape Town, 7405",
    name: "Cape Town Base",
  },
  johannesburg: {
    lat: -26.1951,
    lng: 28.034,
    address: "5 Thora Crescent, Johannesburg",
    name: "Johannesburg Base",
  },
};

// Get coordinates from address (simplified geocoding)
function getCoordinatesFromAddress(
  address: string,
): { lat: number; lng: number } | null {
  const capeTownKeywords = ["cape town", "paarden eiland", "marine drive"];
  const jhbKeywords = [
    "johannesburg",
    "joburg",
    "jhb",
    "sandton",
    "roodepoort",
  ];

  const addressLower = address.toLowerCase();

  if (capeTownKeywords.some((keyword) => addressLower.includes(keyword))) {
    return {
      lat: -33.9249 + (Math.random() - 0.5) * 0.1,
      lng: 18.4241 + (Math.random() - 0.5) * 0.1,
    };
  }

  if (jhbKeywords.some((keyword) => addressLower.includes(keyword))) {
    return {
      lat: -26.2041 + (Math.random() - 0.5) * 0.1,
      lng: 28.0473 + (Math.random() - 0.5) * 0.1,
    };
  }

  // Default to Cape Town area if no match
  return {
    lat: -33.9249 + (Math.random() - 0.5) * 0.1,
    lng: 18.4241 + (Math.random() - 0.5) * 0.1,
  };
}

// Check if current time is 8 AM to reset to base location
function shouldResetToBase(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  return hour === 8 && minute === 0;
}

export function MapView({
  jobs,
  staff,
  selectedStaff,
  selectedDate,
  onJobClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  const [mapsError, setMapsError] = useState(false);

  const selectedStaffMember = staff.find((s) => s.id === selectedStaff);
  const staffJobs = jobs.filter((job) => job.assignedTo === selectedStaff);

  // Get staff base location
  const getStaffBaseLocation = () => {
    if (!selectedStaffMember?.location?.city)
      return STAFF_BASE_LOCATIONS["cape town"];

    const city = selectedStaffMember.location.city.toLowerCase();
    if (city.includes("johannesburg") || city.includes("joburg")) {
      return STAFF_BASE_LOCATIONS.johannesburg;
    }
    return STAFF_BASE_LOCATIONS["cape town"];
  };

  const baseLocation = getStaffBaseLocation();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Create map instance
    mapInstance.current = L.map(mapRef.current).setView(
      [baseLocation.lat, baseLocation.lng],
      12,
    );

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    setMapLoaded(true);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [baseLocation.lat, baseLocation.lng]);

  // Update markers when jobs or selected staff changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstance.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add base location marker (always show at 8 AM)
    const now = new Date();
    const isEightAM = now.getHours() === 8;

    if (isEightAM || staffJobs.length === 0) {
      const baseMarker = L.marker([baseLocation.lat, baseLocation.lng]).addTo(
        mapInstance.current,
      ).bindPopup(`
          <div class="text-center">
            <h3 class="font-semibold">${baseLocation.name}</h3>
            <p class="text-sm text-gray-600">${baseLocation.address}</p>
            <p class="text-xs text-blue-600 mt-1">${selectedStaffMember?.name} - Base Location</p>
            ${isEightAM ? '<p class="text-xs text-green-600">Daily 8 AM Check-in</p>' : ""}
          </div>
        `);

      // Different icon for base location
      const homeIcon = L.divIcon({
        html: '<div style="background: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 10px;">🏠</span></div>',
        className: "custom-marker",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      baseMarker.setIcon(homeIcon);
      markersRef.current.push(baseMarker);
    }

    // Add job markers
    staffJobs.forEach((job, index) => {
      const address = job.riskAddress || job.RiskAddress || job.address;
      if (!address) return;

      const coords = getCoordinatesFromAddress(address);
      if (!coords) return;

      const priority = job.priority || "medium";
      const priorityColors = {
        high: "#ef4444",
        medium: "#f59e0b",
        low: "#10b981",
      };

      const marker = L.marker([coords.lat, coords.lng]).addTo(
        mapInstance.current!,
      ).bindPopup(`
          <div class="min-w-[200px]">
            <h3 class="font-semibold text-sm">${job.title}</h3>
            <p class="text-xs text-gray-600 mt-1">${job.insuredName || job.InsuredName || "No client name"}</p>
            <p class="text-xs text-gray-600 flex items-center mt-1">
              <span class="inline-block w-2 h-2 rounded-full mr-1" style="background: ${priorityColors[priority]}"></span>
              ${priority.toUpperCase()} Priority
            </p>
            <p class="text-xs text-gray-600 mt-1">${address}</p>
            ${job.dueDate ? `<p class="text-xs text-blue-600 mt-1">${new Date(job.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>` : ""}
            <button 
              onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}', '_blank')"
              class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Navigate
            </button>
          </div>
        `);

      // Custom icon based on job status and priority
      const markerIcon = L.divIcon({
        html: `<div style="background: ${priorityColors[priority]}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><span style="color: white; font-size: 10px; font-weight: bold;">${index + 1}</span></div>`,
        className: "custom-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      marker.setIcon(markerIcon);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 1) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [staffJobs, mapLoaded, baseLocation, selectedStaffMember]);

  // Check for 8 AM reset every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (shouldResetToBase() && mapInstance.current) {
        // Reset map view to base location at 8 AM
        mapInstance.current.setView([baseLocation.lat, baseLocation.lng], 12);
        setCurrentLocation({ lat: baseLocation.lat, lng: baseLocation.lng });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [baseLocation]);

  // Check if Google Maps API is available and handle errors
  useEffect(() => {
    // Set up a timer to check if Google Maps loads
    const checkGoogleMaps = setTimeout(() => {
      if (typeof window.google === "undefined" || !window.google?.maps) {
        console.warn("Google Maps failed to load, switching to fallback");
        setMapsError(true);
        setUseGoogleMaps(false);
      }
    }, 5000); // Wait 5 seconds for Google Maps to load

    // Listen for Google Maps API errors
    const handleError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes("google") || event.message.includes("maps"))
      ) {
        console.error("Google Maps error:", event.message);
        setMapsError(true);
        setUseGoogleMaps(false);
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      clearTimeout(checkGoogleMaps);
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (!selectedStaffMember) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Staff Member</h3>
            <p className="text-muted-foreground">
              Choose a staff member to view their route map
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Route Details - Show above map */}
      {staffJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Route className="h-5 w-5 mr-2" />
              Job Route Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staffJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onDoubleClick={() => onJobClick?.(job)}
                  title="Double-click to view job details"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{job.title}</h4>
                    {(job.riskAddress || job.RiskAddress || job.address) && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {job.riskAddress || job.RiskAddress || job.address}
                      </p>
                    )}
                    {(job.insuredName || job.InsuredName) && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {job.insuredName || job.InsuredName}
                      </p>
                    )}
                    {job.dueDate && (
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(job.dueDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        job.priority === "high" ? "destructive" : "secondary"
                      }
                    >
                      {job.priority}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const address =
                          job.riskAddress || job.RiskAddress || job.address;
                        if (address) {
                          const encodedAddress = encodeURIComponent(address);
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                          window.open(mapsUrl, "_blank");
                        }
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Route Map - {selectedStaffMember?.name || "Unknown Staff"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Map Controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Home className="h-3 w-3" />
                  <span>Base: {baseLocation.name}</span>
                </Badge>
                {staffJobs.length > 0 && (
                  <Badge variant="default">{staffJobs.length} jobs today</Badge>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (mapInstance.current) {
                      mapInstance.current.setView(
                        [baseLocation.lat, baseLocation.lng],
                        12,
                      );
                    }
                  }}
                >
                  <Home className="h-4 w-4 mr-1" />
                  Go to Base
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const address = baseLocation.address;
                    const encodedAddress = encodeURIComponent(address);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                    window.open(mapsUrl, "_blank");
                  }}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
              </div>
            </div>

            {/* Interactive Map with OpenStreetMap (OSM) Integration */}
            <div>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🌍 Using OpenStreetMap (OSM) - Free and open source mapping
                </p>
              </div>
              <LeafletMapFallback
                jobs={staffJobs}
                baseLocation={baseLocation}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {staffJobs.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Jobs for Selected Date
              </h3>
              <p className="text-muted-foreground">
                {`${selectedStaffMember.name} has no jobs scheduled for ${selectedDate.toLocaleDateString()}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
