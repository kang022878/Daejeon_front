import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createPinsLayer } from "../map/customPinLayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

type PinData = { id: string; lng: number; lat: number };

interface Map3DProps {
  pins: PinData[];
  route?: [number, number][];
  onPinClick?: (pinId: string) => void;
  photosByPinId?: Record<string, string>;
}

export default function Map3D({ pins, route, onPinClick, photosByPinId }: Map3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const clickMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const photoMarkersRef = useRef<mapboxgl.Marker[]>([]);

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
      el.addEventListener("click", () => onPinClick?.(pin.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      clickMarkersRef.current.push(marker);
    });
  };

  const syncPhotoMarkers = (map: mapboxgl.Map) => {
    photoMarkersRef.current.forEach((marker) => marker.remove());
    photoMarkersRef.current = [];

    if (!photosByPinId) return;

    pins.forEach((pin) => {
      const photoUrl = photosByPinId[pin.id];
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
      syncPhotoMarkers(map);
      readyRef.current = true;
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
    syncPhotoMarkers(map);
  }, [pins, onPinClick, photosByPinId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    syncRoute(map);
  }, [routeData]);

  return <div ref={containerRef} className="h-full w-full" />;
}
