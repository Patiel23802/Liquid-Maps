/**
 * Minimal label map:
 * - Hide POIs/landmarks (schools, businesses, etc.)
 * - Keep only administrative names (city/state/country)
 * - Emphasize country + state boundaries (as provided by Google basemap)
 */
export const googleDarkMapStyle = [
  // Base
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },

  // Hide *all* labels by default, then selectively re-enable admin labels.
  { elementType: "labels", stylers: [{ visibility: "off" }] },

  // Re-enable administrative labels (names only).
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#a8a3ff" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#67e8f9" }],
  },

  // Ensure state/province names show up clearly.
  {
    featureType: "administrative.province",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#f5d0fe" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ visibility: "on" }, { color: "#e9e6f7" }],
  },

  // Boundaries (strokes) — country + province/state outlines.
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "on" }, { color: "#67e8f9" }, { weight: 2 }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "on" }, { color: "#a78bfa" }, { weight: 1.5 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "on" }, { color: "#334155" }, { weight: 0.6 }],
  },

  // Hide POIs completely (schools, landmarks, businesses, etc.)
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "off" }] },

  // Hide transit and road labels (keeps the map clean).
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },

  // Keep roads geometry (subtle) so the map isn't empty.
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  // Optional: water labels off (we're keeping only admin names).
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
];
