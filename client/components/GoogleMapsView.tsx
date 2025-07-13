import React, { useEffect, useRef, useState } from "react";
import { Job, User } from "@shared/types";

interface GoogleMapsViewProps {
  jobs: Job[];
  selectedStaffMember: User;
  baseLocation: {
    lat: number;
    lng: number;
    address: string;
    name: string;
  };
}

// Load Google Maps API script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps API"));
    document.head.appendChild(script);
  });
};

export function GoogleMapsView({
  jobs,
  selectedStaffMember,
  baseLocation,
}: GoogleMapsViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [trafficVisible, setTrafficVisible] = useState(true);
  const trafficLayer = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Get API key from environment variable (using import.meta.env for Vite)
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
          "AIzaSyBKexCR1IZEIn4uHhvXQ0BKFaTCJWd-FpU";

        await loadGoogleMapsScript(apiKey);

        if (!mapRef.current) return;

        // Initialize map
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: baseLocation.lat, lng: baseLocation.lng },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        // Initialize directions service and renderer
        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          draggable: true,
          panel: null,
        });
        directionsRenderer.current.setMap(mapInstance.current);

        // Initialize traffic layer
        trafficLayer.current = new google.maps.TrafficLayer();
        if (trafficVisible) {
          trafficLayer.current.setMap(mapInstance.current);
        }

        // Add base location marker
        new google.maps.Marker({
          position: { lat: baseLocation.lat, lng: baseLocation.lng },
          map: mapInstance.current,
          title: baseLocation.name,
          icon: {
            url:
              "data:image/svg+xml;base64," +
              btoa(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#22c55e"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">🏠</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
          },
        });

        // Add job markers and calculate route
        if (jobs.length > 0) {
          await addJobMarkersAndRoute();
        }

        setIsLoaded(true);
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
      }
    };

    initializeMap();
  }, [jobs, baseLocation, selectedStaffMember]);

  const addJobMarkersAndRoute = async () => {
    if (
      !mapInstance.current ||
      !directionsService.current ||
      !directionsRenderer.current
    )
      return;

    // Create waypoints for jobs
    const waypoints: google.maps.DirectionsWaypoint[] = [];
    const markers: google.maps.Marker[] = [];

    jobs.forEach((job, index) => {
      const address = job.riskAddress || job.RiskAddress || job.address;
      if (address) {
        waypoints.push({
          location: address,
          stopover: true,
        });

        // Geocode and add marker
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const position = results[0].geometry.location;

            const marker = new google.maps.Marker({
              position,
              map: mapInstance.current,
              title: job.title,
              label: {
                text: (index + 1).toString(),
                color: "white",
                fontWeight: "bold",
              },
              icon: {
                url: `data:image/svg+xml;base64,${btoa(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="${getPriorityColor(job.priority)}" stroke="white" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(32, 32),
              },
            });

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${job.title}</h3>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">${job.insuredName || job.InsuredName || "No client name"}</p>
                  <p style="margin: 4px 0; font-size: 12px; color: #666;">${address}</p>
                  ${job.dueDate ? `<p style="margin: 4px 0; font-size: 12px; color: #0066cc;">${new Date(job.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>` : ""}
                  <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}', '_blank')" 
                          style="margin-top: 8px; padding: 4px 8px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Navigate
                  </button>
                </div>
              `,
            });

            marker.addListener("click", () => {
              infoWindow.open(mapInstance.current, marker);
            });

            markers.push(marker);
          }
        });
      }
    });

    // Calculate route with traffic
    if (waypoints.length > 0) {
      const request: google.maps.DirectionsRequest = {
        origin: { lat: baseLocation.lat, lng: baseLocation.lng },
        destination: waypoints[waypoints.length - 1].location as string,
        waypoints: waypoints.slice(0, -1),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
      };

      directionsService.current.route(request, (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.current?.setDirections(result);

          // Display route info
          const route = result.routes[0];
          const leg = route.legs[0];
          console.log("Route calculated:", {
            distance: leg.distance?.text,
            duration: leg.duration?.text,
            durationInTraffic: leg.duration_in_traffic?.text,
          });
        } else {
          console.error("Error calculating route:", status);
        }
      });
    }
  };

  const getPriorityColor = (priority: string = "medium") => {
    const colors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const toggleTraffic = () => {
    if (trafficLayer.current && mapInstance.current) {
      if (trafficVisible) {
        trafficLayer.current.setMap(null);
      } else {
        trafficLayer.current.setMap(mapInstance.current);
      }
      setTrafficVisible(!trafficVisible);
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {`${jobs.length} jobs • Traffic: ${trafficVisible ? "ON" : "OFF"}`}
        </div>
        <button
          onClick={toggleTraffic}
          className={`px-3 py-1 rounded text-sm font-medium ${
            trafficVisible
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
        >
          Traffic {trafficVisible ? "ON" : "OFF"}
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} className="h-[400px] w-full rounded-lg border" />
    </div>
  );
}

// Extend window interface for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
