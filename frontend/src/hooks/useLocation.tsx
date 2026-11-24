"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface LocationItem {
  id: string;
  name: string;
  shortName: string;
  area: string;
  latitude: number;
  longitude: number;
}

export const POPULAR_LOCATIONS: LocationItem[] = [
  {
    id: "hauz_khas",
    name: "Hauz Khas & Green Park, South Delhi",
    shortName: "Hauz Khas",
    area: "South Delhi",
    latitude: 28.5494,
    longitude: 77.2001,
  },
  {
    id: "cp",
    name: "Connaught Place, Central Delhi",
    shortName: "Connaught Place",
    area: "Central Delhi",
    latitude: 28.6328,
    longitude: 77.2197,
  },
  {
    id: "chanakyapuri",
    name: "Diplomatic Enclave, Chanakyapuri",
    shortName: "Chanakyapuri",
    area: "South Delhi",
    latitude: 28.5976,
    longitude: 77.1741,
  },
  {
    id: "khan_market",
    name: "Khan Market & Lodhi Colony",
    shortName: "Khan Market",
    area: "Central-South Delhi",
    latitude: 28.5998,
    longitude: 77.2270,
  },
  {
    id: "paharganj",
    name: "Paharganj & New Delhi Station",
    shortName: "Paharganj",
    area: "Central Delhi",
    latitude: 28.6432,
    longitude: 77.2148,
  },
  {
    id: "civil_lines",
    name: "Civil Lines & North Campus",
    shortName: "Civil Lines",
    area: "North Delhi",
    latitude: 28.6811,
    longitude: 77.2228,
  },
  {
    id: "gurugram",
    name: "DLF Cyber City & Phase 2",
    shortName: "Cyber City",
    area: "Gurugram / NCR",
    latitude: 28.4907,
    longitude: 77.0894,
  },
  {
    id: "noida",
    name: "Sector 18 & Atta Market",
    shortName: "Sector 18",
    area: "Noida / NCR",
    latitude: 28.5708,
    longitude: 77.3271,
  },
];

interface LocationContextType {
  currentLocation: LocationItem;
  setLocation: (loc: LocationItem) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  detectGPSLocation: () => Promise<void>;
  isDetectingGPS: boolean;
  gpsError: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = "foodloop_user_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(POPULAR_LOCATIONS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Load persisted location from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.latitude && parsed?.longitude) {
          setCurrentLocation(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSetLocation = (loc: LocationItem) => {
    setCurrentLocation(loc);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // Ignore
    }
    setIsModalOpen(false);
    setGpsError(null);
  };

  const detectGPSLocation = async () => {
    setIsDetectingGPS(true);
    setGpsError(null);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsDetectingGPS(false);
          const newLoc: LocationItem = {
            id: "gps",
            name: "My Live Location (GPS)",
            shortName: "My Location",
            area: "Detected Location",
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          };
          handleSetLocation(newLoc);
        },
        async () => {
          // If browser GPS times out or lacks hardware, gracefully detect via CORS-friendly IP geolocation
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch("https://ipwho.is/", { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude && data.success !== false) {
                const ipLoc: LocationItem = {
                  id: "ip_location",
                  name: `${data.city || "Delhi"}, ${data.region || "NCR"}`,
                  shortName: data.city || "Hauz Khas Hub",
                  area: data.region || "Delhi NCR",
                  latitude: parseFloat(Number(data.latitude).toFixed(4)),
                  longitude: parseFloat(Number(data.longitude).toFixed(4)),
                };
                setIsDetectingGPS(false);
                handleSetLocation(ipLoc);
                return;
              }
            }
          } catch {
            // Ignore IP fetch failure
          }

          setIsDetectingGPS(false);
          // Seamlessly default to Hauz Khas without jarring error
          handleSetLocation(POPULAR_LOCATIONS[0]);
          setGpsError("Set to Hauz Khas, South Delhi Hub.");
        },
        { timeout: 4500, enableHighAccuracy: false, maximumAge: 300000 }
      );
    } else {
      setIsDetectingGPS(false);
      handleSetLocation(POPULAR_LOCATIONS[0]);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setLocation: handleSetLocation,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        detectGPSLocation,
        isDetectingGPS,
        gpsError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
