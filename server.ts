/**
 * TrackVision Full-Stack Express & WebSocket Server (Port 3000)
 * Delhi -> Prayagraj Railway Corridor Operations Support Engine
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { CORRIDOR_SECTIONS, CORRIDOR_STATIONS } from './server/data/corridor.ts';
import {
  computeModelMetrics,
  HISTORICAL_EVALUATIONS,
} from './server/ml/engine.ts';
import { simulationManager } from './server/simulation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory sessions / users for RBAC
const DEMO_USERS = [
  { id: 'usr-01', name: 'R. K. Sharma (Chief Controller)', email: 'controller@railnet.gov.in', role: 'CONTROL_ROOM' },
  { id: 'usr-02', name: 'Ananya Verma (Dy. Train Controller)', email: 'operator@railnet.gov.in', role: 'OPERATOR' },
  { id: 'usr-03', name: 'SysAdmin TrackVision', email: 'admin@trackvision.internal', role: 'ADMIN' },
  { id: 'usr-04', name: 'Arjun Sen (Commuter)', email: 'passenger@example.com', role: 'PASSENGER' },
];

/* -------------------------------------------------------------------------- */
/*                                AUTH ROUTES                                 */
/* -------------------------------------------------------------------------- */

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const user = DEMO_USERS.find((u) => u.email === email || u.role === role) || {
    id: `usr-${Date.now()}`,
    name: email ? email.split('@')[0] : 'Authorized Officer',
    email: email || 'controller@railnet.gov.in',
    role: role || 'CONTROL_ROOM',
  };

  res.json({
    token: `tv-jwt-${user.id}-${Date.now()}`,
    refreshToken: `tv-refresh-${user.id}-${Date.now()}`,
    user,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  const newUser = {
    id: `usr-${Date.now()}`,
    name: name || 'Station Officer',
    email: email || 'officer@railnet.gov.in',
    role: role || 'OPERATOR',
  };
  DEMO_USERS.push(newUser);
  res.json({
    token: `tv-jwt-${newUser.id}-${Date.now()}`,
    user: newUser,
  });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({ token: `tv-jwt-refreshed-${Date.now()}` });
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/me', (_req, res) => {
  res.json({ user: DEMO_USERS[0] });
});

/* -------------------------------------------------------------------------- */
/*                               TRAIN ROUTES                                 */
/* -------------------------------------------------------------------------- */

app.get('/api/trains', (_req, res) => {
  res.json(simulationManager.getTrains());
});

app.get('/api/trains/:id', (req, res) => {
  const train = simulationManager.getTrainById(req.params.id);
  if (!train) return res.status(404).json({ error: 'Train not found' });
  res.json(train);
});

app.get('/api/trains/:id/position', (req, res) => {
  const train = simulationManager.getTrainById(req.params.id);
  if (!train) return res.status(404).json({ error: 'Train not found' });
  res.json({
    lat: train.lat,
    lng: train.lng,
    speedKmh: train.speedKmh,
    bearing: train.bearing,
    progressPercent: train.progressPercent,
    currentStationId: train.currentStationId,
    nextStationId: train.nextStationId,
  });
});

app.get('/api/trains/:id/eta', (req, res) => {
  const train = simulationManager.getTrainById(req.params.id);
  if (!train) return res.status(404).json({ error: 'Train not found' });
  res.json({
    scheduledFinalEta: train.scheduledFinalEta,
    predictedFinalEta: train.predictedFinalEta,
    predictedDelayMinutes: train.predictedDelayMinutes,
    predictionRangeMin: train.predictionRangeMin,
    predictionRangeMax: train.predictionRangeMax,
    confidence: train.confidence,
    multiStationEtas: train.multiStationEtas,
    delayCauses: train.delayCauses,
  });
});

app.get('/api/trains/:id/propagation', (req, res) => {
  res.json(simulationManager.getPropagation());
});

app.get('/api/trains/:id/connections', (_req, res) => {
  res.json(simulationManager.getPassengerConnections());
});

/* -------------------------------------------------------------------------- */
/*                               STATION ROUTES                               */
/* -------------------------------------------------------------------------- */

app.get('/api/stations', (_req, res) => {
  res.json(simulationManager.getStations());
});

app.get('/api/stations/:id', (req, res) => {
  const station = simulationManager.getStationById(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json(station);
});

/* -------------------------------------------------------------------------- */
/*                               NETWORK ROUTES                               */
/* -------------------------------------------------------------------------- */

app.get('/api/network', (_req, res) => {
  res.json({
    stations: simulationManager.getStations(),
    sections: simulationManager.getSections(),
    conflicts: simulationManager.getConflicts(),
    propagation: simulationManager.getPropagation(),
    riskSummary: simulationManager.getNetworkRiskSummary(),
  });
});

app.get('/api/network/propagation', (_req, res) => {
  res.json(simulationManager.getPropagation());
});

/* -------------------------------------------------------------------------- */
/*                                ALERTS ROUTES                               */
/* -------------------------------------------------------------------------- */

app.get('/api/alerts', (_req, res) => {
  res.json(simulationManager.getAlerts());
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  simulationManager.acknowledgeAlert(req.params.id);
  res.json({ success: true, alerts: simulationManager.getAlerts() });
});

/* -------------------------------------------------------------------------- */
/*                             ANALYTICS ROUTES                               */
/* -------------------------------------------------------------------------- */

app.get('/api/analytics', (_req, res) => {
  const metrics = computeModelMetrics(HISTORICAL_EVALUATIONS);
  res.json({
    metrics,
    recentEvaluations: HISTORICAL_EVALUATIONS.slice(0, 50),
    sections: simulationManager.getSections(),
  });
});

app.get('/api/analytics/model', (_req, res) => {
  const metrics = computeModelMetrics(HISTORICAL_EVALUATIONS);
  res.json(metrics);
});

app.get('/api/analytics/sections', (_req, res) => {
  res.json(simulationManager.getSections());
});

app.get('/api/analytics/history', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  res.json(HISTORICAL_EVALUATIONS.slice(0, limit));
});

/* -------------------------------------------------------------------------- */
/*                             SIMULATION ROUTES                              */
/* -------------------------------------------------------------------------- */

app.post('/api/simulation/start', (_req, res) => {
  simulationManager.startSimulation();
  res.json({ success: true });
});

app.post('/api/simulation/pause', (_req, res) => {
  simulationManager.pauseSimulation();
  res.json({ success: true });
});

app.post('/api/simulation/speed', (req, res) => {
  const { speed } = req.body;
  if (speed === 1 || speed === 2 || speed === 5) {
    simulationManager.setSpeed(speed);
  }
  res.json({ success: true });
});

app.post('/api/simulation/reset', (_req, res) => {
  simulationManager.resetDemo();
  res.json({ success: true, snapshot: simulationManager.getFullSnapshot() });
});

app.post('/api/simulation/events', (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ error: 'Missing event name' });
  simulationManager.injectEvent(event);
  res.json({ success: true, snapshot: simulationManager.getFullSnapshot() });
});

/* -------------------------------------------------------------------------- */
/*                            INTERVENTIONS ROUTE                             */
/* -------------------------------------------------------------------------- */

app.post('/api/interventions/simulate', (req, res) => {
  const outcome = simulationManager.executeIntervention(req.body);
  res.json(outcome);
});

/* -------------------------------------------------------------------------- */
/*                          AI OPERATIONAL INSIGHTS                           */
/* -------------------------------------------------------------------------- */

app.get('/api/ai/insights', (_req, res) => {
  const trains = simulationManager.getTrains();
  const heroTrain = trains.find((t) => t.number === '12951');
  const conflicts = simulationManager.getConflicts();
  const risk = simulationManager.getNetworkRiskSummary();

  const heroDelay = heroTrain ? heroTrain.predictedDelayMinutes : 2;
  const isRestricted = heroTrain ? heroTrain.signalRestrictionActive : false;

  let headline = `Normal corridor flow maintained. Network delay cumulative at ${risk.predictedAdditionalDelayMinutes} min.`;
  let primaryContributor = 'Schedule cushions active on Kanpur-Prayagraj trunk.';
  let downstreamImpact = 'No platform conflicts detected across 7 corridor junctions.';
  let recommendedAction = 'Maintain standard section headway of 5 minutes.';

  if (isRestricted || heroDelay >= 6) {
    headline = `12951 Mumbai Rajdhani predicted to arrive at Prayagraj ${heroDelay} minutes late.`;
    primaryContributor = 'Signal restriction active between Bharthana and Phaphund (Block Sec 4). Line speed restricted to 35 km/h.';
    downstreamImpact = conflicts.length > 0
      ? `Platform 3 occupancy overlap at Kanpur Central with TV-DEMO-002; cascading delay predicted to impact 2 connecting rakes.`
      : `Minor ripple delay absorbed along subsequent block sections.`;
    recommendedAction = conflicts.length > 0
      ? 'Execute What-If Intervention: Reassign TV-DEMO-002 from Platform 3 to Platform 5 to eliminate 12 minutes of cascading delay.'
      : 'Maintain dispatch priority for Rajdhani to minimize secondary rake hold-ups.';
  }

  res.json({
    timestamp: new Date().toISOString(),
    headline,
    primaryContributor,
    downstreamImpact,
    recommendedAction,
    confidenceScore: heroTrain ? heroTrain.confidence : 88,
    affectedTrainsCount: risk.affectedTrainsCount,
  });
});

/* -------------------------------------------------------------------------- */
/*                       BOOTSTRAP & VITE MIDDLEWARE                          */
/* -------------------------------------------------------------------------- */

async function startServer() {
  const server = http.createServer(app);

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    simulationManager.registerWebSocket(ws);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[TrackVision] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
