/**
 * Custom React Hook for TrackVision Real-time State & REST API
 * Handles WebSocket subscriptions with automatic reconnect, REST fetching,
 * and optimistic action execution.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppTab,
  DelayPropagationNode,
  InterventionOutcome,
  InterventionRequest,
  ModelMetricsSummary,
  NetworkRiskSummary,
  PassengerConnection,
  PlatformConflict,
  Section,
  SimulationState,
  Station,
  Train,
  UserRole,
} from '../types/railway.ts';

export interface TrackVisionState {
  trains: Train[];
  stations: Station[];
  sections: Section[];
  conflicts: PlatformConflict[];
  propagationNodes: DelayPropagationNode[];
  passengerConnections: PassengerConnection[];
  alerts: Alert[];
  simulationState: SimulationState;
  networkRisk: NetworkRiskSummary;
  selectedTrainId: string | null;
  selectedStationId: string | null;
  activeRole: UserRole;
  activeTab: AppTab;
  isConnected: boolean;
  lastUpdated: string;
  isSimulatingIntervention: boolean;
  lastInterventionOutcome: InterventionOutcome | null;
  modelMetrics: ModelMetricsSummary | null;
}

export function useTrackVision() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [conflicts, setConflicts] = useState<PlatformConflict[]>([]);
  const [propagationNodes, setPropagationNodes] = useState<DelayPropagationNode[]>([]);
  const [passengerConnections, setPassengerConnections] = useState<PassengerConnection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: true,
    speed: 1,
    activeEvents: [],
    lastTick: new Date().toISOString(),
  });
  const [networkRisk, setNetworkRisk] = useState<NetworkRiskSummary>({
    affectedTrainsCount: 0,
    affectedStationsCount: 0,
    predictedAdditionalDelayMinutes: 0,
    activePlatformConflictsCount: 0,
    connectionRisksCount: 0,
    overallRiskLevel: 'LOW',
  });
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>('12951');
  const [selectedStationId, setSelectedStationId] = useState<string | null>('CNB');
  const [activeRole, setActiveRole] = useState<UserRole>('CONTROL_ROOM');
  const [activeTab, setActiveTab] = useState<AppTab>('command-center');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [isSimulatingIntervention, setIsSimulatingIntervention] = useState(false);
  const [lastInterventionOutcome, setLastInterventionOutcome] = useState<InterventionOutcome | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsSummary | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial REST data
  const fetchAllData = useCallback(async () => {
    try {
      const [trainsRes, stationsRes, networkRes, alertsRes, metricsRes] = await Promise.all([
        fetch('/api/trains'),
        fetch('/api/stations'),
        fetch('/api/network'),
        fetch('/api/alerts'),
        fetch('/api/analytics/model'),
      ]);

      if (trainsRes.ok) setTrains(await trainsRes.json());
      if (stationsRes.ok) setStations(await stationsRes.json());
      if (networkRes.ok) {
        const net = await networkRes.json();
        setSections(net.sections || []);
        setConflicts(net.conflicts || []);
        setPropagationNodes(net.propagation || []);
        setNetworkRisk(net.riskSummary || networkRisk);
      }
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (metricsRes.ok) setModelMetrics(await metricsRes.json());

      const connRes = await fetch('/api/trains/12951/connections');
      if (connRes.ok) setPassengerConnections(await connRes.json());

      setLastUpdated(new Date().toISOString());
    } catch {
      // Backend error/offline handling
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    fetchAllData();

    let isMounted = true;
    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setIsConnected(true);
        };

        ws.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            if (payload.type === 'simulation.snapshot' || payload.type === 'simulation.reset') {
              const snap = payload.data;
              setTrains(snap.trains);
              setStations(snap.stations);
              setSections(snap.sections);
              setConflicts(snap.conflicts);
              setPropagationNodes(snap.propagationNodes);
              setPassengerConnections(snap.passengerConnections);
              setAlerts(snap.alerts);
              setSimulationState(snap.simulationState);
              setNetworkRisk(snap.networkRisk);
              setLastUpdated(new Date().toISOString());
            } else if (payload.type === 'train.position.updated') {
              // Update train lat/lng positions smoothly
              const updatedList = payload.data.trains;
              setTrains((prev) =>
                prev.map((t) => {
                  const match = updatedList.find((u: { id: string }) => u.id === t.id);
                  return match ? { ...t, ...match } : t;
                })
              );
              setLastUpdated(new Date().toISOString());
            } else if (payload.type === 'simulation.event.injected') {
              const snap = payload.data;
              setTrains(snap.trains);
              setStations(snap.stations);
              setSections(snap.sections);
              setConflicts(snap.conflicts);
              setPropagationNodes(snap.propagationNodes);
              setPassengerConnections(snap.passengerConnections);
              setAlerts(snap.alerts);
              setSimulationState(snap.simulationState);
              setNetworkRisk(snap.networkRisk);
              setLastUpdated(new Date().toISOString());
            } else if (payload.type === 'alert.acknowledged') {
              setAlerts(payload.data.alerts);
            }
          } catch {
            // handle error
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            setIsConnected(false);
            reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        }
      }
    }

    connectWs();

    // Polling fallback every 8 seconds if WebSocket disconnects
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchAllData();
      }
    }, 8000);

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollInterval);
    };
  }, [fetchAllData]);

  // Simulation Actions
  const toggleSimulation = async () => {
    const endpoint = simulationState.isRunning ? '/api/simulation/pause' : '/api/simulation/start';
    await fetch(endpoint, { method: 'POST' });
    setSimulationState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const setSimulationSpeed = async (speed: 1 | 2 | 5) => {
    await fetch('/api/simulation/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
    setSimulationState((prev) => ({ ...prev, speed }));
  };

  const resetDemo = async () => {
    const res = await fetch('/api/simulation/reset', { method: 'POST' });
    if (res.ok) {
      const { snapshot } = await res.json();
      setTrains(snapshot.trains);
      setStations(snapshot.stations);
      setSections(snapshot.sections);
      setConflicts(snapshot.conflicts);
      setPropagationNodes(snapshot.propagationNodes);
      setPassengerConnections(snapshot.passengerConnections);
      setAlerts(snapshot.alerts);
      setSimulationState(snapshot.simulationState);
      setNetworkRisk(snapshot.networkRisk);
      setLastInterventionOutcome(null);
      setSelectedTrainId('12951');
    }
  };

  const injectEvent = async (eventName: string) => {
    const res = await fetch('/api/simulation/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventName }),
    });
    if (res.ok) {
      const { snapshot } = await res.json();
      setTrains(snapshot.trains);
      setStations(snapshot.stations);
      setSections(snapshot.sections);
      setConflicts(snapshot.conflicts);
      setPropagationNodes(snapshot.propagationNodes);
      setPassengerConnections(snapshot.passengerConnections);
      setAlerts(snapshot.alerts);
      setSimulationState(snapshot.simulationState);
      setNetworkRisk(snapshot.networkRisk);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a)));
  };

  const runInterventionSimulation = async (req: InterventionRequest): Promise<InterventionOutcome | null> => {
    setIsSimulatingIntervention(true);
    try {
      const res = await fetch('/api/interventions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        const outcome = await res.json();
        setLastInterventionOutcome(outcome);
        // Refresh local data to show the resolved conflict
        fetchAllData();
        return outcome;
      }
    } finally {
      setIsSimulatingIntervention(false);
    }
    return null;
  };

  const selectedTrain = trains.find((t) => t.id === selectedTrainId || t.number === selectedTrainId) || null;
  const selectedStation = stations.find((s) => s.id === selectedStationId || s.code === selectedStationId) || null;

  const triggerScenarioPreset = async (presetKey: 'SCENARIO_1_CLEAR' | 'SCENARIO_2_SIGNAL' | 'SCENARIO_3_FOG' | 'SCENARIO_4_PEAK') => {
    if (presetKey === 'SCENARIO_1_CLEAR') {
      await resetDemo();
    } else if (presetKey === 'SCENARIO_2_SIGNAL') {
      await injectEvent('EVENT_SIGNAL_RESTRICTION');
    } else if (presetKey === 'SCENARIO_3_FOG') {
      await injectEvent('EVENT_HEAVY_RAIN');
    } else if (presetKey === 'SCENARIO_4_PEAK') {
      await injectEvent('EVENT_CONGESTION_HIGH');
    }
  };

  const activeEventsList = (simulationState.activeEvents || []).map((e, idx) => ({
    id: `evt-${idx}`,
    type: (e.includes('SIGNAL') ? 'SIGNAL_FAILURE' : e.includes('RAIN') ? 'WEATHER_FOG' : 'FREIGHT_BLOCK') as any,
    targetTrainNumber: '12951',
    targetStationId: 'ETW',
    impactDelayMinutes: 8,
    durationMinutes: 15,
    description: e.replace('EVENT_', '').replace('_', ' '),
  }));

  return {
    trains,
    stations,
    sections,
    conflicts,
    propagationNodes,
    passengerConnections,
    alerts,
    simulationState,
    networkRisk,
    selectedTrainId,
    selectedTrain,
    selectedStationId,
    selectedStation,
    activeRole,
    activeTab,
    isConnected,
    lastUpdated,
    isSimulatingIntervention,
    lastInterventionOutcome,
    modelMetrics,
    activeEvents: activeEventsList,
    setSelectedTrainId,
    setSelectedStationId,
    setActiveRole,
    setActiveTab,
    toggleSimulation,
    togglePause: toggleSimulation,
    setSimulationSpeed,
    resetDemo,
    resetSimulation: resetDemo,
    injectEvent,
    injectDisruptionEvent: (e: any) => injectEvent(e.type || 'EVENT_SIGNAL_RESTRICTION'),
    triggerScenarioPreset,
    acknowledgeAlert,
    runInterventionSimulation,
    simulateIntervention: runInterventionSimulation,
    refreshData: fetchAllData,
  };
}
