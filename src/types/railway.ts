/**
 * TrackVision Railway ETA & Operational Decision-Support Platform
 * Core Data Models & Types (SIH 2026 Problem 26028)
 */

export type TrainStatus = 'ON_TIME' | 'SLIGHT_DELAY' | 'DELAYED' | 'CRITICAL';

export type StationStatus = 'NORMAL' | 'CONGESTED' | 'RISK' | 'CRITICAL';

export type UserRole = 'ADMIN' | 'CONTROL_ROOM' | 'OPERATOR' | 'PASSENGER';

export interface Station {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  platforms: number;
  status: StationStatus;
  currentCongestion: number; // 0.0 to 1.0
  activeTrainsCount: number;
  platformsOccupancy: PlatformOccupancy[];
}

export interface PlatformOccupancy {
  platformNumber: number;
  trainId: string | null;
  trainNumber: string | null;
  occupiedFrom: string | null;
  occupiedUntil: string | null;
  isConflict: boolean;
}

export interface Section {
  id: string;
  fromStationId: string;
  toStationId: string;
  fromStationName: string;
  toStationName: string;
  distanceKm: number;
  maxSpeedKmh: number;
  currentCongestion: number; // 0.0 to 1.0
  signalRestriction: boolean;
  temporarySpeedRestrictionKmh: number | null;
  weatherCondition: 'CLEAR' | 'LIGHT_RAIN' | 'HEAVY_RAIN' | 'FOG';
  averageRunningMinutes: number;
  averageDelayMinutes: number;
  averageRecoveryMinutes: number;
  modelMaeMinutes: number;
}

export interface ScheduledStop {
  stationId: string;
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  distanceFromStartKm: number;
  platform: number;
}

export interface MultiStationEta {
  stationId: string;
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  predictedArrival: string;
  predictedDelayMinutes: number;
  confidence: number;
  platform: number;
}

export interface DelayContributor {
  cause: string;
  impactMinutes: number; // e.g. +5, -1
  confidence: number;
  description: string;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  type: 'RAJDHANI' | 'VANDE_BHARAT' | 'SUPERFAST' | 'EXPRESS' | 'DEMO';
  isSynthetic: boolean;
  origin: string;
  destination: string;
  currentStationId: string;
  currentStationName: string;
  nextStationId: string;
  nextStationName: string;
  lat: number;
  lng: number;
  speedKmh: number;
  bearing: number;
  currentDelayMinutes: number;
  predictedDelayMinutes: number;
  scheduledFinalEta: string;
  predictedFinalEta: string;
  predictionRangeMin: string;
  predictionRangeMax: string;
  confidence: number;
  status: TrainStatus;
  progressPercent: number; // 0 to 100 on corridor
  signalRestrictionActive: boolean;
  weatherImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  multiStationEtas: MultiStationEta[];
  delayCauses: DelayContributor[];
  assignedPlatformNextStation: number;
  lastUpdated: string;
}

export interface PlatformConflict {
  id: string;
  stationId: string;
  stationName: string;
  platformNumber: number;
  primaryTrainNumber: string;
  primaryTrainEta: string;
  primaryTrainDeparture: string;
  conflictingTrainNumber: string;
  conflictingTrainEta: string;
  conflictProbability: number;
  expectedImpactMinutes: number;
  severity: 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  detectedAt: string;
}

export interface DelayPropagationNode {
  trainNumber: string;
  trainName: string;
  delayMinutes: number;
  stationName: string;
  cause: string;
  confidence: number;
  isSource: boolean;
  affectedTrainNumbers: string[];
}

export interface PassengerConnection {
  id: string;
  incomingTrainNumber: string;
  connectingTrainNumber: string;
  junctionStationName: string;
  incomingPredictedEta: string;
  incomingUncertaintyRange: string;
  connectingScheduledDeparture: string;
  transferWindowMinutes: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  missedConnectionProbability: number;
  reason: string;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'DELAY_PROPAGATION' | 'PLATFORM_CONFLICT' | 'HIGH_CONGESTION' | 'LOW_CONFIDENCE' | 'WEATHER' | 'SIGNAL_RESTRICTION' | 'CONNECTION_RISK' | 'DATA_QUALITY';
  trainNumber?: string;
  stationName?: string;
  title: string;
  message: string;
  predictedImpactMinutes?: number;
  timestamp: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface NetworkRiskSummary {
  affectedTrainsCount: number;
  affectedStationsCount: number;
  predictedAdditionalDelayMinutes: number;
  activePlatformConflictsCount: number;
  connectionRisksCount: number;
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface InterventionRequest {
  type: 'CHANGE_PLATFORM' | 'HOLD_TRAIN' | 'RELEASE_TRAIN' | 'PRIORITIZE_TRAIN' | 'CLEAR_RESTRICTION';
  trainNumber?: string;
  targetPlatform?: number;
  targetStationId?: string;
  holdDurationMinutes?: number;
}

export interface InterventionOutcome {
  id: string;
  interventionType: string;
  description: string;
  before: {
    networkDelayMinutes: number;
    conflictsCount: number;
    affectedTrainsCount: number;
    connectionRisksCount: number;
  };
  after: {
    networkDelayMinutes: number;
    conflictsCount: number;
    affectedTrainsCount: number;
    connectionRisksCount: number;
  };
  delayAvoidedMinutes: number;
  conflictsPreventedCount: number;
  tradeoffs: string[];
  simulatedAt: string;
}

export interface HistoricalEvaluationRecord {
  id: string;
  trainNumber: string;
  section: string;
  scheduledEta: string;
  baselinePredictedEta: string;
  mlPredictedEta: string;
  actualArrival: string;
  baselineErrorMinutes: number;
  mlErrorMinutes: number;
  confidence: number;
  timestamp: string;
}

export interface ModelMetricsSummary {
  version: string;
  recordsCount: number;
  baselineMae: number;
  mlMae: number;
  baselineRmse: number;
  mlRmse: number;
  intervalCoveragePercent: number;
  health: 'GOOD' | 'DEGRADED' | 'INSUFFICIENT_DATA';
  lastEvaluatedAt: string;
}

export interface SimulationState {
  isRunning: boolean;
  speed: 1 | 2 | 5;
  activeEvents: string[];
  lastTick: string;
}

export type AppTab =
  | 'command-center'
  | 'operations'
  | 'ai-insights'
  | 'simulation'
  | 'alerts';

// Segmented sub-view inside the consolidated Operations tab.
export type OperationsSubTab = 'trains' | 'stations' | 'network';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  sectionZone: string;
  badgeId: string;
}

export interface DisruptionEvent {
  id: string;
  type: 'SIGNAL_FAILURE' | 'WEATHER_FOG' | 'FREIGHT_BLOCK' | 'CREW_DELAY';
  targetTrainNumber?: string;
  targetStationId?: string;
  impactDelayMinutes: number;
  durationMinutes: number;
  description: string;
}
