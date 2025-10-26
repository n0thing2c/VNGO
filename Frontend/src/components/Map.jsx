"use client";

import React, {useState, useEffect, useRef} from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {Input} from "@/components/ui/input";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import WikiPanel from "@/components/wiki_panel.jsx";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Fly animation for any position
function FlyToLocation({position}) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 15);
    }, [position, map]);
    return null;
}

// Routing stops
function RoutingMachine({waypoints}) {
    const map = useMap();
    useEffect(() => {
        if (!map || waypoints.length < 2) return;

        const controls = [];
        const routeColors = [
            "#e11d48",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#14b8a6",
            "#a16207",
            "#ec4899",
        ];

        for (let i = 0; i < waypoints.length - 1; i++) {
            const control = L.Routing.control({
                waypoints: [
                    L.latLng(waypoints[i].lat, waypoints[i].lon),
                    L.latLng(waypoints[i + 1].lat, waypoints[i + 1].lon),
                ],
                lineOptions: {styles: [{color: routeColors[i % routeColors.length], weight: 5}]},
                show: false,
                addWaypoints: false,
                routeWhileDragging: false,
                fitSelectedRoutes: false,
                createMarker: () => null,
            }).addTo(map);
            const container = control.getContainer();
            if (container) container.style.display = "none";
            controls.push(control);
        }

        return () => {
            controls.forEach((control) => map.removeControl(control));
        };
    }, [map, waypoints]);

    return null;
}

// Custom numbered marker icon
const createNumberedIcon = (number) =>
    L.divIcon({
        className: "custom-numbered-marker",
        html: `<div style="
      background-color: #2563eb;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
    });

export default function Map({className = "", onLocationAdd, addedStops = []}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [markerPosition, setMarkerPosition] = useState(null);
    const [markerLabel, setMarkerLabel] = useState("");
    const [hasSelected, setHasSelected] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [wikiVisible, setWikiVisible] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Get user's location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            (err) => {
                console.error("Error getting user location:", err);
                if (!userLocation) setUserLocation([10.762622, 106.660172]);
            }
        );
    }, []);

    // Fetch suggestions
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

                if (data.length === 0) {
                    // Push a fake "no results" entry
                    setSuggestions([{
                        display_name: "No locations found., search with longtitude and latitude instead",
                        isPlaceholder: true
                    }]);
                } else {
                    setSuggestions(data.slice(0, 5));
                }
            } catch (err) {
                console.show(err);
                setSuggestions([{display_name: "Failed to load locations.", isPlaceholder: true}]);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery, hasSelected]);


    const handleSelect = (place) => {
        const pos = [parseFloat(place.lat), parseFloat(place.lon)];
        setMarkerPosition(pos);
        setMarkerLabel(place.display_name);
        setSearchQuery(place.display_name);
        setSuggestions([]);
        setHasSelected(true);
        setSelectedLocation(place);
        setWikiVisible(true);
    };

    const handleAddToTour = async () => {
        if (!onLocationAdd || !markerPosition || !markerLabel) return;

        const [lat, lon] = markerPosition;

        // Reset UI instantly
        setMarkerPosition(null);
        setMarkerLabel("");
        setSearchQuery("");
        setHasSelected(false);
        setWikiVisible(false);

        // Translate Vietnamese → English using Google Translate endpoint
        let englishName = markerLabel;
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(markerLabel)}`
            );
            const data = await res.json();
            // The translated text is in data[0][0][0]
            englishName = data[0][0][0] || markerLabel;
        } catch (err) {
            console.error("Translation failed, using original name:", err);
        }

        // Add stop after translation
        onLocationAdd({
            name: markerLabel,    // Vietnamese
            name_en: englishName, // English
            lat,
            lon,
        });
    };


    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md relative z-[1001]">
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHasSelected(false);
                        setWikiVisible(false);
                    }}
                    placeholder="Search location..."
                    className="w-full"
                />
                {!hasSelected && suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 max-h-40 overflow-y-auto shadow-lg rounded-b-md">
                        {suggestions.map((place, idx) => (
                            <li
                                key={place.place_id || idx}
                                className={`p-2 text-sm ${
                                    place.isPlaceholder
                                        ? "text-gray-500 italic cursor-default select-none"
                                        : "hover:bg-gray-100 cursor-pointer"
                                }`}
                                onMouseDown={(e) => {
                                    if (place.isPlaceholder) return; // prevent clicking
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

            <div className={`relative overflow-hidden rounded-xl shadow-md ${className} z-0`}>
                <MapContainer
                    center={userLocation || [10.762622, 106.660172]}
                    zoom={13}
                    className="w-full h-full"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    {userLocation && <FlyToLocation position={userLocation}/>}

                    {addedStops.length > 1 && <RoutingMachine waypoints={addedStops}/>}

                    {addedStops.map((stop, idx) => (
                        <Marker
                            key={`${stop.lat}-${stop.lon}-${idx}`}
                            position={[stop.lat, stop.lon]}
                            icon={createNumberedIcon(idx + 1)}
                        >
                            <Popup>{stop.name}</Popup>
                        </Marker>
                    ))}

                    {userLocation && (
                        <CircleMarker
                            center={userLocation}
                            radius={10}
                            pathOptions={{color: "white", fillColor: "#2563eb", fillOpacity: 1}}
                        >
                            <Popup>You are here</Popup>
                        </CircleMarker>
                    )}

                    {markerPosition && (
                        <>
                            <Marker
                                position={markerPosition}
                                eventHandlers={{add: (e) => e.target.openPopup()}}
                            >
                                <Popup className="!max-w-[90vw] text-center">
                                    <div className="space-y-2">
                                        <p className="font-semibold">{markerLabel.split(",")[0]}</p>
                                        <button
                                            onClick={handleAddToTour}
                                            className="px-4 py-2 bg-[#5A74F8] text-white rounded-lg hover:bg-[#6F86F9] hover:text-black"
                                        >
                                            Add to Tour
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                            <FlyToLocation position={markerPosition}/>
                        </>
                    )}
                </MapContainer>
            </div>

            {wikiVisible && selectedLocation && (
                <div className="w-full">
                    <WikiPanel location={selectedLocation}/>
                </div>
            )}
        </div>
    );
}
