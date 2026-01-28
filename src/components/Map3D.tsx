import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createPinsLayer } from "../map/customPinLayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

type PinData = { id: string; lng: number; lat: number; place_id?: number | null };
type RouteStepMeta = {
  duration?: number;
  transport?: string;
  walkDuration?: number;
  driveDuration?: number;
};

interface Map3DProps {
  pins: PinData[];
  route?: [number, number][];
  routeMeta?: RouteStepMeta[];
  currentLocation?: { lat: number; lng: number } | null;
  onPinClick?: (pinId: string) => void;
  photosByPinId?: Record<string, string>;
}

export default function Map3D({
  pins,
  route,
  routeMeta,
  currentLocation,
  onPinClick,
  photosByPinId,
}: Map3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const clickMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const photoMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const routeBadgeMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const currentMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const focusedPinIdRef = useRef<string | null>(null);

  const routeData = useMemo(() => route ?? [], [route]);

  const syncPinsLayer = (map: mapboxgl.Map) => {
    if (map.getLayer("three-pins")) {
      map.removeLayer("three-pins");
    }
    map.addLayer(createPinsLayer(pins));
  };

  const syncRoute = (map: mapboxgl.Map) => {
    const hasRoute = routeData.length >= 2;
    if (!hasRoute) {
      if (map.getLayer("route-core")) map.removeLayer("route-core");
      if (map.getLayer("route-glow")) map.removeLayer("route-glow");
      if (map.getSource("route")) map.removeSource("route");
      return;
    }

    const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routeData,
      },
    };

    if (map.getSource("route")) {
      const source = map.getSource("route") as mapboxgl.GeoJSONSource;
      source.setData(routeGeoJson);
      return;
    }

    map.addSource("route", {
      type: "geojson",
      data: routeGeoJson,
    });

    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "route",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#00f6ff",
        "line-width": 10,
        "line-opacity": 0.25,
      },
    });

    map.addLayer({
      id: "route-core",
      type: "line",
      source: "route",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#a9ffff",
        "line-width": 3,
        "line-opacity": 0.95,
      },
    });
  };

  const syncClickMarkers = (map: mapboxgl.Map) => {
    clickMarkersRef.current.forEach((marker) => marker.remove());
    clickMarkersRef.current = [];

    pins.forEach((pin) => {
      const el = document.createElement("button");
      el.type = "button";
      el.style.width = "28px";
      el.style.height = "28px";
      el.style.borderRadius = "999px";
      el.style.border = "none";
      el.style.background = "transparent";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 0 12px rgba(0, 246, 255, 0.35)";
      el.style.pointerEvents = "auto";
      el.addEventListener("click", () => {
        const mapZoom = map.getZoom();
        if (focusedPinIdRef.current !== pin.id) {
          focusedPinIdRef.current = pin.id;
          map.flyTo({
            center: [pin.lng, pin.lat],
            zoom: Math.max(mapZoom + 2.2, 17.2),
            speed: 1.2,
            curve: 1.2,
          });
          return;
        }
        onPinClick?.(pin.id);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      clickMarkersRef.current.push(marker);
    });
  };

  const syncLabelMarkers = (map: mapboxgl.Map) => {
    labelMarkersRef.current.forEach((marker) => marker.remove());
    labelMarkersRef.current = [];

    pins.forEach((pin, index) => {
      const badge = document.createElement("div");
      const isStart = index === 0;
      badge.style.minWidth = "28px";
      badge.style.height = "28px";
      badge.style.borderRadius = "999px";
      badge.style.background = isStart ? "rgba(255, 214, 0, 0.95)" : "rgba(0, 246, 255, 0.9)";
      badge.style.color = isStart ? "#1a1a1a" : "#031a1f";
      badge.style.display = "flex";
      badge.style.alignItems = "center";
      badge.style.justifyContent = "center";
      badge.style.fontSize = "12px";
      badge.style.fontWeight = "700";
      badge.style.boxShadow = isStart
        ? "0 0 16px rgba(255, 214, 0, 0.6)"
        : "0 0 14px rgba(0, 246, 255, 0.5)";
      badge.style.border = "1px solid rgba(255,255,255,0.4)";
      badge.textContent = String(index + 1);

      const marker = new mapboxgl.Marker({ element: badge, anchor: "bottom" })
        .setLngLat([pin.lng, pin.lat])
        .setOffset([0, -36])
        .addTo(map);

      labelMarkersRef.current.push(marker);
    });
  };

  const syncRouteBadges = (map: mapboxgl.Map) => {
    routeBadgeMarkersRef.current.forEach((marker) => marker.remove());
    routeBadgeMarkersRef.current = [];

    if (!routeMeta || routeData.length < 2) return;

    routeMeta.forEach((meta, index) => {
      const start = routeData[index];
      const end = routeData[index + 1];
      if (!start || !end) return;

      const walkMinutes = typeof meta.walkDuration === "number" ? meta.walkDuration : undefined;
      const driveMinutes = typeof meta.driveDuration === "number" ? meta.driveDuration : undefined;
      const labelParts = [];

      if (typeof walkMinutes === "number") labelParts.push(`도보 ${walkMinutes}분`);
      if (typeof driveMinutes === "number") labelParts.push(`차로 ${driveMinutes}분`);

      if (labelParts.length === 0) {
        if (meta.transport) labelParts.push(meta.transport);
        if (typeof meta.duration === "number") labelParts.push(`${meta.duration}분`);
      }

      if (labelParts.length === 0) return;

      const badge = document.createElement("div");
      badge.style.padding = "3px 8px";
      badge.style.borderRadius = "999px";
      badge.style.background = "rgba(8, 16, 24, 0.82)";
      badge.style.border = "1px solid rgba(0, 246, 255, 0.45)";
      badge.style.boxShadow = "0 0 12px rgba(0, 246, 255, 0.25)";
      badge.style.backdropFilter = "blur(6px)";
      badge.style.color = "#d8feff";
      badge.style.fontSize = "10px";
      badge.style.fontWeight = "700";
      badge.style.whiteSpace = "nowrap";
      badge.textContent = labelParts.join(" · ");

      const midLng = (start[0] + end[0]) / 2;
      const midLat = (start[1] + end[1]) / 2;
      const marker = new mapboxgl.Marker({ element: badge, anchor: "center" })
        .setLngLat([midLng, midLat])
        .addTo(map);

      routeBadgeMarkersRef.current.push(marker);
    });
  };

  const syncStartMarker = (map: mapboxgl.Map) => {
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    if (routeData.length === 0) return;
    const [lng, lat] = routeData[0];
    if (typeof lng !== "number" || typeof lat !== "number") return;

    const markerEl = document.createElement("button");
    markerEl.type = "button";
    markerEl.style.width = "18px";
    markerEl.style.height = "18px";
    markerEl.style.borderRadius = "999px";
    markerEl.style.background = "rgba(0, 150, 255, 0.95)";
    markerEl.style.boxShadow = "0 0 16px rgba(0, 150, 255, 0.65)";
    markerEl.style.border = "2px solid rgba(255,255,255,0.6)";
    markerEl.style.cursor = "pointer";

    markerEl.addEventListener("click", () => {
      const mapZoom = map.getZoom();
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(mapZoom + 2.2, 17.2),
        speed: 1.2,
        curve: 1.2,
      });
    });

    startMarkerRef.current = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
      .setLngLat([lng, lat])
      .setOffset([0, -8])
      .addTo(map);
  };

  const syncCurrentMarker = (map: mapboxgl.Map) => {
    if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
      currentMarkerRef.current = null;
    }

    if (!currentLocation) return;
    const { lng, lat } = currentLocation;
    if (typeof lng !== "number" || typeof lat !== "number") return;

    const markerEl = document.createElement("div");
    markerEl.style.width = "16px";
    markerEl.style.height = "16px";
    markerEl.style.borderRadius = "999px";
    markerEl.style.background = "rgba(255, 77, 79, 0.95)";
    markerEl.style.boxShadow = "0 0 16px rgba(255, 77, 79, 0.65)";
    markerEl.style.border = "2px solid rgba(255,255,255,0.7)";

    currentMarkerRef.current = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
      .setLngLat([lng, lat])
      .setOffset([0, -6])
      .addTo(map);
  };

  const syncPhotoMarkers = (map: mapboxgl.Map) => {
    photoMarkersRef.current.forEach((marker) => marker.remove());
    photoMarkersRef.current = [];

    if (!photosByPinId) return;

    pins.forEach((pin) => {
      const key = pin.place_id !== null && pin.place_id !== undefined ? String(pin.place_id) : pin.id;
      const photoUrl = photosByPinId[key];
      if (!photoUrl) return;

      const card = document.createElement("div");
      card.style.width = "88px";
      card.style.height = "88px";
      card.style.background = "rgba(10, 15, 20, 0.9)";
      card.style.border = "1px solid rgba(0, 246, 255, 0.6)";
      card.style.borderRadius = "10px";
      card.style.boxShadow = "0 0 16px rgba(0, 246, 255, 0.35)";
      card.style.overflow = "hidden";

      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "uploaded";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      card.appendChild(img);

      const marker = new mapboxgl.Marker({ element: card, anchor: "left" })
        .setLngLat([pin.lng, pin.lat])
        .setOffset([14, -40])
        .addTo(map);

      photoMarkersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [127.3845, 36.3504], // 대전
      zoom: 15.2,
      pitch: 60,
      bearing: -20,
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      const layers = map.getStyle().layers ?? [];
      const labelLayerId = layers.find(
        (l) => l.type === "symbol" && (l.layout as any)?.["text-field"]
      )?.id;

      syncPinsLayer(map);
      map.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": "#666",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.9,
          },
        },
        labelLayerId
      );

      syncRoute(map);
      syncClickMarkers(map);
      syncLabelMarkers(map);
      syncStartMarker(map);
      syncCurrentMarker(map);
      syncPhotoMarkers(map);
      readyRef.current = true;
    });

    map.on("dragstart", () => {
      focusedPinIdRef.current = null;
    });
    map.on("zoomstart", () => {
      focusedPinIdRef.current = null;
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncPinsLayer(map);
    syncClickMarkers(map);
    syncLabelMarkers(map);
    syncPhotoMarkers(map);
  }, [pins, onPinClick, photosByPinId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncCurrentMarker(map);
  }, [currentLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncRoute(map);
    syncRouteBadges(map);
    syncStartMarker(map);
  }, [routeData, routeMeta]);

  return <div ref={containerRef} className="h-full w-full" />;
}
