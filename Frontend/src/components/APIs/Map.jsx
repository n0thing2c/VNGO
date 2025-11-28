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
import {Input} from "@/components/ui/input.jsx";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import WikiPanel from "@/components/APIs/wiki_panel.jsx";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert.jsx";

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
    const [focusPos, setFocusPos] = useState(null);

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
                const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&q=${encodeURIComponent(
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

    function parseCityProvinceFromLabel(label) {
        if (!label) return {city_vi: "Không rõ", province_vi: "Không rõ"};

        const parts = label.split(",").map(p => p.trim());

        let province_vi = "Không rõ";
        let city_vi = "Không rõ";

        // Scan from right to left for a postal code (3-6 digits)
        let postalIndex = -1;
        for (let i = parts.length - 1; i >= 0; i--) {
            if (/^\d{3,6}$/.test(parts[i])) {
                postalIndex = i;
                break;
            }
        }

        if (postalIndex >= 0) {
            province_vi = parts[postalIndex - 1] || "Không rõ";
            city_vi = parts[postalIndex - 2] || province_vi;

            // Duplicate province to city if it contains "Thành phố"
            if (province_vi.includes("Thành phố") && !city_vi.includes("Thành phố")) {
                city_vi = province_vi;
            }
        } else {
            // Fallback if no postal code
            province_vi = parts[parts.length - 2] || "Không rõ";
            city_vi = parts[parts.length - 3] || province_vi;

            if (province_vi.includes("Thành phố")) {
                city_vi = province_vi;
            }
        }

        return {city_vi, province_vi};
    }


    const handleAddToTour = async () => {
        if (!onLocationAdd || !markerPosition || !markerLabel || !selectedLocation)
            return;

        const [lat, lon] = markerPosition;

        // Parse city/province/postal from markerLabel
        const {city_vi, province_vi} = parseCityProvinceFromLabel(markerLabel);

        // Reset UI instantly
        setMarkerPosition(null);
        setMarkerLabel("");
        setSearchQuery("");
        setHasSelected(false);
        setWikiVisible(false);

        // Translate Vietnamese → English
        const translate = async (text) => {
            if (!text) return "";
            try {
                const res = await fetch(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(
                        text
                    )}`
                );
                const data = await res.json();
                return data?.[0]?.[0]?.[0] || text;
            } catch {
                return text;
            }
        };

        const [name_en, city_en, province_en] = await Promise.all([
            translate(markerLabel.split(",")[0]),
            translate(city_vi),
            translate(province_vi),
        ]);

        // Send parsed & translated data to parent
        onLocationAdd({
            name: markerLabel.split(",")[0],
            name_en,
            lat,
            lon,
            city: city_vi,
            city_en,
            province: province_vi,
            province_en,
        });
    };


    return (
        <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md relative z-10">
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
                    className="w-full z-0"
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
                            eventHandlers={{
                                click: () => setFocusPos([stop.lat, stop.lon]), // 👈 this focuses
                            }}
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
                                            className="px-4 py-2 bg-[#23C491] text-white rounded-lg hover:bg-emerald-300 hover:border-black hover:text-black"
                                        >
                                            Add to Tour
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                            <FlyToLocation position={markerPosition}/>
                        </>
                    )}
                    {focusPos && <FlyToLocation position={focusPos}/>}

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

export function TourRoute({Stops = []}) {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [flyTo, setFlyTo] = useState(null);

    // --- 3. Add state to hold the map instance ---
    const [map, setMap] = useState(null);

    // --- 4. This new useEffect fixes the problem ---
    useEffect(() => {
        // Run this only when the map instance is ready
        if (map) {
            // Wait 100ms for the dialog animation to finish
            const timer = setTimeout(() => {
                // A. Fixes the "offset" gray box issue
                map.invalidateSize();

                // B. Fixes the focus by running fitBounds *after* the map is visible
                if (Stops.length > 0) {
                    const bounds = L.latLngBounds(Stops.map((s) => [s.lat, s.lon]));
                    map.fitBounds(bounds, {padding: [30, 30]});
                }
            }, 100); // 100ms is usually enough

            return () => clearTimeout(timer);
        }
    }, [map, Stops]); // Re-run if the map or stops change

    // ... (your handleMarkerClick function is fine) ...
    const handleMarkerClick = async (stop) => {
        setFlyTo([stop.lat, stop.lon]);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
                    stop.name
                )}&countrycodes=VN`
            );
            const data = await res.json();
            setSelectedLocation(data?.[0] || null);
        } catch {
            setSelectedLocation(null);
        }
    };


    if (Stops.length === 0)
        return (
            <p className="text-center text-gray-500 italic">No stops added yet</p>
        );

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Map container trimmed to preview height */}
            <div className="w-full h-90 rounded-lg shadow-md overflow-hidden z-0">
                <MapContainer
                    center={[Stops[0].lat, Stops[0].lon]}
                    zoom={13}
                    style={{width: "100%", height: "100%"}} // fill parent
                    className="rounded-lg"
                    whenCreated={setMap}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    <RoutingMachine waypoints={Stops}/>
                    {flyTo && <FlyToLocation position={flyTo}/>}
                    {Stops.map((stop, idx) => (
                        <Marker
                            key={`${stop.lat}-${stop.lon}-${idx}`}
                            position={[stop.lat, stop.lon]}
                            icon={createNumberedIcon(idx + 1)}
                            eventHandlers={{click: () => handleMarkerClick(stop)}}
                        >
                            <Popup>{stop.name_en}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Wiki panel */}
            <WikiPanel location={selectedLocation}/>
        </div>


    );
}