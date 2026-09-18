/**
 * TrackVision Corridor Simulation & Real-time State Manager
 * Maintains live positions, handles event injection, runs tick engine,
 * and notifies subscribers via WebSockets.
 */

import { WebSocket } from 'ws';
import {
  Alert,
  DelayPropagationNode,
  InterventionOutcome,
  InterventionRequest,
  NetworkRiskSummary,
  PassengerConnection,
  PlatformConflict,
  Section,
  SimulationState,
  Station,
  Train,
} from '../src/types/railway.ts';
import { CORRIDOR_POLYLINE, CORRIDOR_SECTIONS, CORRIDOR_STATIONS } from './data/corridor.ts';
import { INITIAL_TRAINS } from './data/trains.ts';
import {
  calculateDelayPropagation,
  calculateDynamicTrainEta,
  calculatePassengerConnectionRisks,
  detectPlatformConflicts,
  simulateIntervention,
} from './ml/engine.ts';

export class SimulationManager {
  private trains: Train[] = JSON.parse(JSON.stringify(INITIAL_TRAINS));
  private stations: Station[] = JSON.parse(JSON.stringify(CORRIDOR_STATIONS));
  private sections: Section[] = JSON.parse(JSON.stringify(CORRIDOR_SECTIONS));
  private conflicts: PlatformConflict[] = [];
  private propagationNodes: DelayPropagationNode[] = [];
  private passengerConnections: PassengerConnection[] = [];
  private alerts: Alert[] = [];
  private simulationState: SimulationState = {
    isRunning: true,
    speed: 1,
    activeEvents: [],
    lastTick: new Date().toISOString(),
  };

  private timer: NodeJS.Timeout | null = null;
  private wsClients: Set<WebSocket> = new Set();

  constructor() {
    this.recalculateAll();
    this.startTickLoop();
  }

  public registerWebSocket(ws: WebSocket) {
    this.wsClients.add(ws);
    // Send immediate snapshot on connect
    this.sendSnapshotToClient(ws);

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private broadcast(payload: { type: string; data: unknown }) {
    const msg = JSON.stringify(payload);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch {
          // ignore send error
        }
      }
    }
  }

  private sendSnapshotToClient(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'simulation.snapshot',
          data: this.getFullSnapshot(),
        })
      );
    }
  }

  public getFullSnapshot() {
    return {
      trains: this.trains,
      stations: this.stations,
      sections: this.sections,
      conflicts: this.conflicts,
      propagationNodes: this.propagationNodes,
      passengerConnections: this.passengerConnections,
      alerts: this.alerts,
      simulationState: this.simulationState,
      networkRisk: this.getNetworkRiskSummary(),
    };
  }

  public getNetworkRiskSummary(): NetworkRiskSummary {
    const affectedTrainsCount = this.trains.filter((t) => t.predictedDelayMinutes > 3).length;
    const affectedStationsCount = this.stations.filter((s) => s.status !== 'NORMAL').length;
    const predictedAdditionalDelayMinutes = this.trains.reduce((acc, t) => acc + t.predictedDelayMinutes, 0);
    const activePlatformConflictsCount = this.conflicts.filter((c) => c.status === 'ACTIVE').length;
    const connectionRisksCount = this.passengerConnections.filter((c) => c.riskLevel === 'HIGH').length;

    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (activePlatformConflictsCount > 0 || connectionRisksCount > 0) {
      overallRiskLevel = 'CRITICAL';
    } else if (affectedTrainsCount >= 4 || predictedAdditionalDelayMinutes >= 20) {
      overallRiskLevel = 'HIGH';
    } else if (affectedTrainsCount >= 2) {
      overallRiskLevel = 'MEDIUM';
    }

    return {
      affectedTrainsCount,
      affectedStationsCount,
      predictedAdditionalDelayMinutes,
      activePlatformConflictsCount,
      connectionRisksCount,
      overallRiskLevel,
    };
  }

  public startSimulation() {
    this.simulationState.isRunning = true;
    this.broadcast({ type: 'simulation.status.updated', data: this.simulationState });
  }

  public pauseSimulation() {
    this.simulationState.isRunning = false;
    this.broadcast({ type: 'simulation.status.updated', data: this.simulationState });
  }

  public setSpeed(speed: 1 | 2 | 5) {
    this.simulationState.speed = speed;
    this.broadcast({ type: 'simulation.status.updated', data: this.simulationState });
  }

  /**
   * Deterministic SIH Demo Reset (Section 16 & 56 of Prompt)
   */
  public resetDemo() {
    this.trains = JSON.parse(JSON.stringify(INITIAL_TRAINS));
    this.stations = JSON.parse(JSON.stringify(CORRIDOR_STATIONS));
    this.sections = JSON.parse(JSON.stringify(CORRIDOR_SECTIONS));
    this.simulationState = {
      isRunning: true,
      speed: 1,
      activeEvents: [],
      lastTick: new Date().toISOString(),
    };
    this.alerts = [
      {
        id: 'ALERT-INIT-01',
        severity: 'INFO',
        type: 'DATA_QUALITY',
        title: 'Corridor Initialization Complete',
        message: 'Delhi -> Prayagraj main trunk active. 15 coaching trains tracking.',
        timestamp: new Date().toISOString(),
        status: 'NEW',
      },
    ];

    this.recalculateAll();
    this.broadcast({ type: 'simulation.reset', data: this.getFullSnapshot() });
  }

  /**
   * Event Injection Engine
   */
  public injectEvent(eventName: string) {
    if (!this.simulationState.activeEvents.includes(eventName)) {
      this.simulationState.activeEvents.push(eventName);
    } else {
      // Toggle off if already active
      this.simulationState.activeEvents = this.simulationState.activeEvents.filter((e: string) => e !== eventName);
    }

    // Apply specific physical changes to corridor sections and trains
    if (eventName === 'EVENT_SIGNAL_RESTRICTION') {
      const etwSec = this.sections.find((s) => s.id === 'SEC-ETW-CNB');
      const isNowActive = this.simulationState.activeEvents.includes('EVENT_SIGNAL_RESTRICTION');
      if (etwSec) etwSec.signalRestriction = isNowActive;

      const train12951 = this.trains.find((t) => t.number === '12951');
      if (train12951) {
        train12951.signalRestrictionActive = isNowActive;
        train12951.speedKmh = isNowActive ? 35 : 96;
        train12951.currentDelayMinutes = isNowActive ? 8 : 2;
        train12951.status = isNowActive ? 'CRITICAL' : 'ON_TIME';
      }

      if (isNowActive) {
        this.alerts.unshift({
          id: `ALERT-SIG-${Date.now()}`,
          severity: 'CRITICAL',
          type: 'SIGNAL_RESTRICTION',
          trainNumber: '12951',
          stationName: 'Etawah -> Kanpur Central',
          title: 'Signal Restriction Active: Bharthana-Phaphund',
          message: 'Automatic signalling dropped on down main line. Maximum permissible speed restricted to 35 km/h.',
          predictedImpactMinutes: 8,
          timestamp: new Date().toISOString(),
          status: 'NEW',
        });
      }
    } else if (eventName === 'EVENT_CONGESTION_HIGH') {
      const isNowActive = this.simulationState.activeEvents.includes('EVENT_CONGESTION_HIGH');
      const cnbStation = this.stations.find((s) => s.id === 'CNB');
      if (cnbStation) {
        cnbStation.currentCongestion = isNowActive ? 0.92 : 0.78;
        cnbStation.status = isNowActive ? 'CRITICAL' : 'RISK';
      }
    } else if (eventName === 'EVENT_HEAVY_RAIN') {
      const isNowActive = this.simulationState.activeEvents.includes('EVENT_HEAVY_RAIN');
      for (const s of this.sections) {
        s.weatherCondition = isNowActive ? 'HEAVY_RAIN' : 'CLEAR';
      }
    }

    this.recalculateAll();
    this.broadcast({ type: 'simulation.event.injected', data: this.getFullSnapshot() });
  }

  public acknowledgeAlert(alertId: string) {
    const a = this.alerts.find((alt) => alt.id === alertId);
    if (a) {
      a.status = 'ACKNOWLEDGED';
      this.broadcast({ type: 'alert.acknowledged', data: { alertId, alerts: this.alerts } });
    }
  }

  public executeIntervention(req: InterventionRequest): InterventionOutcome {
    const outcome = simulateIntervention(req, this.trains, this.conflicts, this.passengerConnections);

    // Apply the intervention live if it was platform change
    if (req.type === 'CHANGE_PLATFORM' && req.trainNumber) {
      const train = this.trains.find((t) => t.number === req.trainNumber);
      if (train) {
        train.assignedPlatformNextStation = req.targetPlatform || 5;
      }
      // Clear the conflict
      this.conflicts = [];
      this.alerts.unshift({
        id: `ALERT-INT-${Date.now()}`,
        severity: 'INFO',
        type: 'PLATFORM_CONFLICT',
        title: 'Platform Intervention Applied',
        message: `${req.trainNumber} rerouted to Platform ${req.targetPlatform || 5}. Dwell conflict avoided.`,
        timestamp: new Date().toISOString(),
        status: 'NEW',
      });
    }

    this.recalculateAll();
    this.broadcast({ type: 'intervention.completed', data: { outcome, snapshot: this.getFullSnapshot() } });
    return outcome;
  }

  /**
   * Run full operational recalculation pipeline:
   * Dynamic ETA -> Conflicts -> Propagation -> Connection Risks -> Station Status
   */
  private recalculateAll() {
    // 1. Recalculate Dynamic ETAs for each train
    for (const train of this.trains) {
      const prediction = calculateDynamicTrainEta(train, this.sections, this.simulationState.activeEvents);
      train.predictedDelayMinutes = prediction.predictedDelayMinutes;
      train.predictedFinalEta = prediction.predictedFinalEta;
      train.predictionRangeMin = prediction.predictionRangeMin;
      train.predictionRangeMax = prediction.predictionRangeMax;
      train.confidence = prediction.confidence;
      train.multiStationEtas = prediction.multiStationEtas;
      train.delayCauses = prediction.delayCauses;

      // Status determination
      if (train.predictedDelayMinutes >= 12 || train.signalRestrictionActive) {
        train.status = 'CRITICAL';
      } else if (train.predictedDelayMinutes >= 8) {
        train.status = 'DELAYED';
      } else if (train.predictedDelayMinutes >= 3) {
        train.status = 'SLIGHT_DELAY';
      } else {
        train.status = 'ON_TIME';
      }
    }

    // 2. Detect platform conflicts
    this.conflicts = detectPlatformConflicts(this.trains, this.stations);

    // Add alert if conflict detected and not already present
    if (this.conflicts.length > 0 && !this.alerts.some((a) => a.type === 'PLATFORM_CONFLICT' && a.status === 'NEW')) {
      this.alerts.unshift({
        id: `ALERT-CONF-${Date.now()}`,
        severity: 'CRITICAL',
        type: 'PLATFORM_CONFLICT',
        trainNumber: '12951',
        stationName: 'Kanpur Central',
        title: 'Platform Dwell Conflict: Platform 3',
        message: '12951 Rajdhani predicted arrival (18:42) overlaps scheduled occupancy of TV-DEMO-002 (18:45).',
        predictedImpactMinutes: 7,
        timestamp: new Date().toISOString(),
        status: 'NEW',
      });
    }

    // 3. Compute delay propagation
    this.propagationNodes = calculateDelayPropagation(this.trains, this.conflicts);

    // 4. Compute passenger connection risks
    this.passengerConnections = calculatePassengerConnectionRisks(this.trains);

    // 5. Update station status
    for (const st of this.stations) {
      if (st.id === 'CNB' && this.conflicts.length > 0) {
        st.status = 'CRITICAL';
      } else if (st.currentCongestion > 0.6) {
        st.status = 'CONGESTED';
      } else {
        st.status = 'NORMAL';
      }
    }
  }

  /**
   * Real-time physical simulation step
   */
  private startTickLoop() {
    this.timer = setInterval(() => {
      if (!this.simulationState.isRunning) return;

      const deltaSeconds = 2 * this.simulationState.speed;
      let positionsChanged = false;

      // Advance each train slightly along its corridor trajectory
      for (const train of this.trains) {
        if (train.speedKmh > 0) {
          // Progress increment
          const distanceCoveredKm = (train.speedKmh * deltaSeconds) / 3600;
          // Approximate corridor is ~530 km
          const progressDelta = (distanceCoveredKm / 530) * 100;
          train.progressPercent = (train.progressPercent + progressDelta) % 100;

          // Interpolate coordinate along corridor polyline
          const polyIndex = Math.floor((train.progressPercent / 100) * (CORRIDOR_POLYLINE.length - 1));
          const nextPolyIndex = Math.min(polyIndex + 1, CORRIDOR_POLYLINE.length - 1);
          const segmentFraction = (train.progressPercent / 100) * (CORRIDOR_POLYLINE.length - 1) - polyIndex;

          const p1 = CORRIDOR_POLYLINE[polyIndex];
          const p2 = CORRIDOR_POLYLINE[nextPolyIndex];

          train.lat = parseFloat((p1[0] + (p2[0] - p1[0]) * segmentFraction).toFixed(4));
          train.lng = parseFloat((p1[1] + (p2[1] - p1[1]) * segmentFraction).toFixed(4));
          train.lastUpdated = new Date().toISOString();
          positionsChanged = true;
        }
      }

      this.simulationState.lastTick = new Date().toISOString();

      if (positionsChanged) {
        this.broadcast({
          type: 'train.position.updated',
          data: {
            trains: this.trains.map((t) => ({
              id: t.id,
              number: t.number,
              lat: t.lat,
              lng: t.lng,
              speedKmh: t.speedKmh,
              bearing: t.bearing,
              progressPercent: t.progressPercent,
              predictedDelayMinutes: t.predictedDelayMinutes,
              status: t.status,
            })),
          },
        });
      }
    }, 2000);
  }

  public getTrains(): Train[] {
    return this.trains;
  }

  public getTrainById(id: string): Train | undefined {
    return this.trains.find((t) => t.id === id || t.number === id);
  }

  public getStations(): Station[] {
    return this.stations;
  }

  public getStationById(id: string): Station | undefined {
    return this.stations.find((s) => s.id === id || s.code === id);
  }

  public getSections(): Section[] {
    return this.sections;
  }

  public getConflicts(): PlatformConflict[] {
    return this.conflicts;
  }

  public getPropagation(): DelayPropagationNode[] {
    return this.propagationNodes;
  }

  public getPassengerConnections(): PassengerConnection[] {
    return this.passengerConnections;
  }

  public getAlerts(): Alert[] {
    return this.alerts;
  }
}

export const simulationManager = new SimulationManager();
