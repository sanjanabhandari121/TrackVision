/**
 * TrackVision Interactive Railway Corridor Map
 * Clean light command-centre map matching Reference Image:
 * - Stable zoom controls with scrollWheelZoom and doubleClickZoom safely controlled
 * - Clean Zoom In (+), Zoom Out (-), and Fit Corridor controls
 * - Prevents wild zooming on click or trackpad swipe
 * - Top control toolbar: Live Map | Network View, Follow Train, Show Sections, Show Trains, Show Conflicts, Scroll Zoom toggle
 * - Bilingual Indian Railway stations (NDLS, GZB, ALJN, TDL, ETW, CNB, PRYJ)
 * - Moving train markers with live delay badges (+8m, +3m, On time)
 * - Top-right map legend overlay
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  ChevronDown,
  Compass,
  Crosshair,
  Eye,
  Layers,
  Maximize2,
  Minus,
  MousePointer,
  Navigation,
  Plus,
  Radio,
  RotateCcw,
  Train as TrainIcon,
  Zap,
} from 'lucide-react';
import { CORRIDOR_POLYLINE } from '../../server/data/corridor.ts';
import { PlatformConflict, Section, Station, Train } from '../types/railway.ts';

interface CorridorMapProps {
  trains: Train[];
  stations: Station[];
  sections: Section[];
  conflicts: PlatformConflict[];
  selectedTrainId: string | null;
  selectedStationId: string | null;
  onSelectTrain: (id: string) => void;
  onSelectStation: (id: string) => void;
  onSelectConflict: (conflict: PlatformConflict) => void;
}

const BILINGUAL_STATION_NAMES: Record<string, { en: string; hi: string }> = {
  NDLS: { en: 'New Delhi (NDLS)', hi: 'नई दिल्ली' },
  GZB: { en: 'Ghaziabad', hi: 'गाज़ियाबाद' },
  ALJN: { en: 'Aligarh', hi: 'अलीगढ़' },
  TDL: { en: 'Tundla', hi: 'टूंडला' },
  ETW: { en: 'Etawah', hi: 'इटावा' },
  CNB: { en: 'Kanpur Central', hi: 'कानपुर सेंट्रल' },
  PRYJ: { en: 'Prayagraj (PRYJ)', hi: 'प्रयागराज' },
};

export const CorridorMap: React.FC<CorridorMapProps> = ({
  trains,
  stations,
  sections,
  conflicts,
  selectedTrainId,
  selectedStationId,
  onSelectTrain,
  onSelectStation,
  onSelectConflict,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const tracksLayerRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerRef = useRef<L.LayerGroup | null>(null);
  const trainsLayerRef = useRef<L.LayerGroup | null>(null);
  const conflictsLayerRef = useRef<L.LayerGroup | null>(null);

  // Map state controls
  const [mapMode, setMapMode] = useState<'LIVE' | 'NETWORK'>('LIVE');
  const [followTrain, setFollowTrain] = useState<boolean>(false); // False by default so map does not jerk/snap on clicks
  const [showSections, setShowSections] = useState<boolean>(true);
  const [showTrains, setShowTrains] = useState<boolean>(true);
  const [showConflicts, setShowConflicts] = useState<boolean>(true);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState<boolean>(false); // Disabled by default to prevent erratic wheel jumps
  const [tileStyle, setTileStyle] = useState<'voyager' | 'osm' | 'light'>('voyager');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);

  // Tile layer ref to swap tile sets
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Defined bounds around the Delhi -> Prayagraj corridor with padding
    const corridorBounds = L.latLngBounds(CORRIDOR_POLYLINE as [number, number][]).pad(0.35);

    // Stable, controlled map configuration that prevents erratic zoom jumps on clicks
    const map = L.map(mapContainerRef.current, {
      center: [27.0, 79.6],
      zoom: 7.5,
      minZoom: 6,
      maxZoom: 13,
      zoomControl: false,
      scrollWheelZoom: false, // Prevents unintended zoom jumps on mousewheel/trackpad clicks
      doubleClickZoom: true, // Controlled double-click zoom enabled
      touchZoom: 'center', // Smooth centered pinch-to-zoom on touch/mobile/tablet devices
      trackResize: true, // Automatically tracks container resize events
      maxBounds: corridorBounds, // Restricts panning and viewing to the Delhi-Prayagraj corridor
      maxBoundsViscosity: 0.85, // Smoothly bounces back if user drags outside corridor bounds
      boxZoom: false, // Prevents accidental shift-drag zoom
      keyboard: false,
      zoomSnap: 0.5, // Smooth 0.5 zoom increments
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 250, // Gentle sensitivity when enabled
      wheelDebounceTime: 120,
    });

    // Light, readable OSM tile layer matching reference image
    const initialTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = initialTile;

    // Initialize layer groups
    tracksLayerRef.current = L.layerGroup().addTo(map);
    stationsLayerRef.current = L.layerGroup().addTo(map);
    trainsLayerRef.current = L.layerGroup().addTo(map);
    conflictsLayerRef.current = L.layerGroup().addTo(map);

    // If the user manually drags the map, gracefully disable followTrain so it doesn't snap back
    map.on('dragstart', () => {
      setFollowTrain(false);
    });

    // ResizeObserver ensures container resizing doesn't corrupt Leaflet coordinate calculations
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    mapInstanceRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer if changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrls = {
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    };

    tileLayerRef.current.setUrl(tileUrls[tileStyle]);
  }, [tileStyle]);

  // Handle scroll zoom toggle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (scrollZoomEnabled) {
      mapInstanceRef.current.scrollWheelZoom.enable();
    } else {
      mapInstanceRef.current.scrollWheelZoom.disable();
    }
  }, [scrollZoomEnabled]);

  // Fit bounds helper
  const fitCorridorBounds = () => {
    if (!mapInstanceRef.current) return;
    const bounds = L.latLngBounds(CORRIDOR_POLYLINE as [number, number][]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8.5 });
  };

  // Safe zoom in
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn(0.5);
  };

  // Safe zoom out
  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut(0.5);
  };

  // Custom zoom reset helper to restore default corridor center and zoom level (7.5)
  const handleResetZoom = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([27.0, 79.6], 7.5, { animate: true });
  };

  // Render Tracks & Block Sections
  useEffect(() => {
    if (!tracksLayerRef.current) return;
    tracksLayerRef.current.clearLayers();

    if (!showSections) return;

    // Outer track casing (clean slate/blue)
    L.polyline(CORRIDOR_POLYLINE as [number, number][], {
      color: '#334155',
      weight: 5,
      opacity: 0.9,
    }).addTo(tracksLayerRef.current);

    // Inner dashed railway track (authentic railway dashed look)
    L.polyline(CORRIDOR_POLYLINE as [number, number][], {
      color: '#94a3b8',
      weight: 2.5,
      dashArray: '6, 6',
      opacity: 1,
    }).addTo(tracksLayerRef.current);

    // Section occupancy & signal restrictions
    sections.forEach((sec) => {
      const fromSt = stations.find((s) => s.id === sec.fromStationId);
      const toSt = stations.find((s) => s.id === sec.toStationId);
      if (!fromSt || !toSt) return;

      const lineCoords: [number, number][] = [
        [fromSt.lat, fromSt.lng],
        [toSt.lat, toSt.lng],
      ];

      if (sec.signalRestriction) {
        L.polyline(lineCoords, {
          color: '#ef4444',
          weight: 6,
          opacity: 0.85,
        }).addTo(tracksLayerRef.current!);
      } else if (sec.currentCongestion > 0.6) {
        L.polyline(lineCoords, {
          color: '#f59e0b',
          weight: 4.5,
          opacity: 0.75,
        }).addTo(tracksLayerRef.current!);
      }
    });
  }, [sections, stations, showSections]);

  // Render Stations
  useEffect(() => {
    if (!stationsLayerRef.current) return;
    stationsLayerRef.current.clearLayers();

    stations.forEach((st) => {
      const isSelected = selectedStationId === st.id;
      const bilingual = BILINGUAL_STATION_NAMES[st.id] || { en: st.name, hi: '' };

      const icon = L.divIcon({
        className: 'station-marker',
        iconSize: [120, 42],
        iconAnchor: [60, 21],
        html: `
          <div class="flex items-center gap-1.5 cursor-pointer select-none">
            <div class="w-4 h-4 rounded-full border-2 ${
              isSelected ? 'bg-blue-600 border-white ring-4 ring-blue-300' : 'bg-white border-[#1e293b] shadow-sm'
            } flex items-center justify-center shrink-0">
              <div class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#1e293b]'}"></div>
            </div>
            <div class="bg-white/95 backdrop-blur-xs border border-slate-300 rounded-md px-2 py-0.5 shadow-sm text-left whitespace-nowrap">
              <span class="text-[11px] font-bold text-slate-900 block leading-tight font-sans">${bilingual.en}</span>
              ${bilingual.hi ? `<span class="text-[9px] text-slate-500 block leading-none font-sans">${bilingual.hi}</span>` : ''}
            </div>
          </div>
        `,
      });

      const marker = L.marker([st.lat, st.lng], { icon });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStation(st.id);
      });
      marker.addTo(stationsLayerRef.current!);
    });
  }, [stations, selectedStationId, onSelectStation]);

  // Render Train Markers
  useEffect(() => {
    if (!trainsLayerRef.current) return;
    trainsLayerRef.current.clearLayers();

    if (!showTrains) return;

    trains.forEach((train) => {
      const isSelected = selectedTrainId === train.id || selectedTrainId === train.number;
      const isDelayed = train.predictedDelayMinutes > 0;
      const isCritical = train.predictedDelayMinutes >= 8 || train.signalRestrictionActive;

      const badgeColor = isCritical
        ? 'bg-rose-600 text-white'
        : isDelayed
        ? 'bg-amber-500 text-white'
        : 'bg-emerald-600 text-white';

      const tagText = isDelayed ? `+${train.predictedDelayMinutes}m` : 'On time';

      const icon = L.divIcon({
        className: 'train-marker',
        iconSize: [100, 36],
        iconAnchor: [50, 18],
        html: `
          <div class="relative cursor-pointer select-none flex items-center justify-center group">
            <div class="flex items-center gap-1 bg-white/95 backdrop-blur-xs border-2 ${
              isSelected ? 'border-blue-600 shadow-md ring-2 ring-blue-300' : 'border-slate-700 shadow-sm'
            } rounded-lg px-2 py-1">
              <span class="text-[10px] font-extrabold text-slate-900 font-mono">${train.number}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded-full ${badgeColor} font-mono">${tagText}</span>
            </div>
            <!-- Direction Indicator Triangle -->
            <div class="absolute -bottom-1.5 w-2 h-2 bg-slate-800 rotate-45"></div>
          </div>
        `,
      });

      const marker = L.marker([train.lat, train.lng], { icon });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectTrain(train.id);
      });
      marker.addTo(trainsLayerRef.current!);
    });

    // Auto center ONLY if explicitly requested via followTrain
    if (followTrain && selectedTrainId && mapInstanceRef.current) {
      const selTrain = trains.find((t) => t.id === selectedTrainId || t.number === selectedTrainId);
      if (selTrain) {
        mapInstanceRef.current.panTo([selTrain.lat, selTrain.lng], { animate: true });
      }
    }
  }, [trains, selectedTrainId, showTrains, followTrain, onSelectTrain]);

  // Render Platform Conflicts
  useEffect(() => {
    if (!conflictsLayerRef.current) return;
    conflictsLayerRef.current.clearLayers();

    if (!showConflicts) return;

    conflicts.forEach((conflict) => {
      const st = stations.find((s) => s.id === conflict.stationId);
      if (!st) return;

      const icon = L.divIcon({
        className: 'conflict-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `
          <div class="w-10 h-10 rounded-full bg-rose-600/30 border-2 border-rose-600 animate-ping absolute"></div>
          <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer relative z-10" title="Platform Conflict: ${conflict.stationName} P${conflict.platformNumber}">
            <span class="font-black text-xs">⚠️</span>
          </div>
        `,
      });

      const marker = L.marker([st.lat, st.lng], { icon });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectConflict(conflict);
      });
      marker.addTo(conflictsLayerRef.current!);
    });
  }, [conflicts, stations, showConflicts, onSelectConflict]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3 flex flex-col relative overflow-hidden">
      {/* 1. TOP TOOLBAR CONTROLS (CLEAN & UNCLUTTERED) */}
      <div className="flex items-center justify-between gap-2.5 mb-2.5 pb-2 border-b border-slate-100 text-xs relative">
        {/* Left: View Mode Pills & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMapMode('LIVE')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                mapMode === 'LIVE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode('NETWORK')}
              className={`px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                mapMode === 'NETWORK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Network View
            </button>
          </div>

          <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
            NDLS ⇄ PRYJ • 7 Stations
          </span>
        </div>

        {/* Right: Consolidated Controls */}
        <div className="flex items-center gap-2">
          {/* Legend Toggle */}
          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
              showLegend
                ? 'bg-slate-100 border-slate-300 text-slate-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Legend</span>
          </button>

          {/* Layers & Settings Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayersMenu((prev) => !prev)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Layers & Filters</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showLayersMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {showLayersMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-[1100] text-xs space-y-2.5 select-none animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-xs">Map Layers & Settings</span>
                  <button
                    type="button"
                    onClick={() => setShowLayersMenu(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 font-medium text-slate-700">
                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <span>Follow Active Train</span>
                    <input
                      type="checkbox"
                      checked={followTrain}
                      onChange={(e) => setFollowTrain(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <span>Show Block Sections</span>
                    <input
                      type="checkbox"
                      checked={showSections}
                      onChange={(e) => setShowSections(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <span>Show Moving Trains</span>
                    <input
                      type="checkbox"
                      checked={showTrains}
                      onChange={(e) => setShowTrains(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <span>Show Platform Conflicts</span>
                    <input
                      type="checkbox"
                      checked={showConflicts}
                      onChange={(e) => setShowConflicts(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <span className="text-[11px]">Mouse Wheel Zoom</span>
                    <input
                      type="checkbox"
                      checked={scrollZoomEnabled}
                      onChange={(e) => setScrollZoomEnabled(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Map Base Layer
                  </span>
                  <select
                    value={tileStyle}
                    onChange={(e) => setTileStyle(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="voyager">OSM Map (Voyager - Clean)</option>
                    <option value="osm">Standard OpenStreetMap</option>
                    <option value="light">CartoDB Minimalist Light</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAP CANVAS CONTAINER */}
      <div className="relative w-full h-[470px] lg:h-[580px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 3. TOP-RIGHT MAP LEGEND OVERLAY */}
        {showLegend && (
          <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-md text-xs space-y-1.5 w-44 select-none">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
              <span className="font-bold text-slate-800 text-[11px]">Map Legend</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-700 text-[11px]">On Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-slate-700 text-[11px]">Slight Delay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-700 text-[11px]">Delayed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              <span className="text-slate-700 text-[11px]">Critical Delay</span>
            </div>

            <div className="h-[1px] bg-slate-100 my-1" />

            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-slate-700 shrink-0 border-t border-dashed" />
              <span className="text-slate-600 text-[10px]">Railway Track</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-700 bg-white shrink-0" />
              <span className="text-slate-600 text-[10px]">Station</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-amber-400 rounded shrink-0" />
              <span className="text-slate-600 text-[10px]">Congestion</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">⚠️</span>
              <span className="text-slate-600 text-[10px]">Signal Restriction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">🚩</span>
              <span className="text-slate-600 text-[10px]">Platform Conflict</span>
            </div>
          </div>
        )}

        {/* Toggle Legend button if closed */}
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute top-3 right-3 z-[1000] bg-white/90 border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm cursor-pointer"
          >
            Show Legend
          </button>
        )}

        {/* 4. BOTTOM-RIGHT CONTROLS: ZOOM IN / ZOOM OUT, RESET ZOOM & FIT CORRIDOR */}
        <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2">
          {/* Explicit Smooth Zoom Buttons */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-r border-slate-200 transition cursor-pointer"
              title="Zoom In (+0.5)"
              aria-label="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              title="Zoom Out (-0.5)"
              aria-label="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Zoom Reset Button */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 border border-slate-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            title="Reset to default zoom level (7.5)"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Reset Zoom</span>
          </button>

          {/* Fit Corridor Button */}
          <button
            type="button"
            onClick={fitCorridorBounds}
            className="bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 border border-slate-300 font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            title="Reset view to full Delhi → Prayagraj corridor"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Fit Corridor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
