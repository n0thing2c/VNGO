"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Input } from "@/components/ui/input";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to fly to a new location
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);
  return null;
}

export default function Map({ width = "100%", height = "500px" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [markerLabel, setMarkerLabel] = useState("");
  const [hasSelected, setHasSelected] = useState(false);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!searchQuery || hasSelected) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.slice(0, 5));
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, hasSelected]);

  const handleSelect = (place) => {
    const position = [parseFloat(place.lat), parseFloat(place.lon)];
    setMarkerPosition(position);
    setMarkerLabel(place.display_name);
    setSearchQuery(place.display_name);
    setSuggestions([]);
    setHasSelected(true);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setHasSelected(false);
  };

  return (
    <div style={{ width }}>
      {/* Search Input */}
      <div style={{ width: 300, marginBottom: 16, position: "relative" }}>
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search location..."
          className="w-full"
          ref={inputRef}
        />
        {!hasSelected && suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "white",
              border: "1px solid #ccc",
              maxHeight: 150,
              overflowY: "auto",
              margin: 0,
              padding: 0,
              listStyle: "none",
              zIndex: 1000,
            }}
          >
            {suggestions.map((place, idx) => (
              <li
                key={idx}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(place);
                }}
              >
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Display */}
      <div style={{ width, height }}>
        <MapContainer
          center={[10.762622, 106.660172]}
          zoom={50}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {markerPosition && (
            <>
              <Marker position={markerPosition}>
                <Popup>{markerLabel}</Popup>
              </Marker>
              <FlyToLocation position={markerPosition} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}