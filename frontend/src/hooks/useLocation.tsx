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
    id: "hauz_khas",
    name: "Hauz Khas & Green Park",
    shortName: "Hauz Khas",
    area: "South Delhi",
    latitude: 28.5494,
    longitude: 77.2001,
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
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGPS(false);
        const newLoc: LocationItem = {
          id: "gps",
          name: "My Live GPS Location",
          shortName: "Live GPS",
          area: "Detected Location",
          latitude: parseFloat(pos.coords.latitude.toFixed(4)),
          longitude: parseFloat(pos.coords.longitude.toFixed(4)),
        };
        handleSetLocation(newLoc);
      },
      (err) => {
        setIsDetectingGPS(false);
        setGpsError(`Unable to retrieve GPS: ${err.message}. Using default location.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
