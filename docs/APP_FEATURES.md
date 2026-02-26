# Matrix Application Features

> Complete feature reference for all Matrix applications

---

## REFLECT (Port 3000)

### Core Features

| Feature | Route | Description |
|---------|-------|-------------|
| Landing Page | `/` | Boot sequence, mood selector, quick navigation |
| Session | `/session` | Main reflection interface with AI feedback |
| Journal | `/journal` | Reflection history and search |
| Insights | `/insights` | Analytics and pattern visualization |
| Patterns | `/patterns` | Cognitive pattern detection display |
| Voice Journal | `/voice` | Voice-to-text recording |
| Weather | `/weather` | Emotional state tracking |
| Growth | `/growth` | Personal growth metrics |
| Sage | `/sage` | AI companion chat |
| Settings | `/settings` | User preferences |
| Universe | `/universe` | 3D constellation visualization |

### Components (`g:\matrix\apps\reflect\src\components\`)

| Directory | Count | Purpose |
|-----------|-------|---------|
| `marketing/` | 10+ | Landing page components |
| `ui/` | 30+ | Reusable UI elements |
| `settings/` | 5+ | Settings interface |
| `MiniGames/` | 3+ | Interactive mini-games |

### Key Technologies
- Next.js 16 with React 19
- Framer Motion for animations
- Three.js for 3D visualization
- PWA with offline support
- Supabase for database

---

## NEXUS (Port 3001)

### Core Features

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/` | Main system overview |
| Diagnostics | `/diagnostics` | System health monitoring |
| Gate | `/gate` | Public URL management |

### Components (`g:\matrix\apps\nexus\src\components\`)

| Directory | Purpose |
|-----------|---------|
| `providers/` | TelemetryProvider (global state) |
| `diagnostics/` | NexusGate, DiagnosticSuite, MatrixDashboard |
| `management/` | ServerManager |
| `ui/` | NexusShell, NeuralNavigator, ConstellationRing |
| `hubs/` | IntegrationHub |

### Gate System

**NexusGate Component** (`src/components/diagnostics/NexusGate.tsx`)

States:
- **Igniting**: Cyan theme, Zap icon bouncing, "Ignition Sequence"
- **Terminating**: Rose theme, X icon, "Termination Sequence"
- **Online**: Shows active URLs with QR codes
- **Offline**: Default dark state

Actions:
- `Ignite All` - Opens tunnels for all 3 apps
- `Kill All` - Closes all tunnels
- Toggle gates individually

### Telemetry System

**TelemetryProvider** (`src/components/providers/TelemetryProvider.tsx`)

Provides:
```typescript
{
  services: { SENTINEL, RUNNER, REFLECT, NEXUS, GHOST },
  gateUrls: { nexus, reflect, ghost },
  isGateOpen: boolean,
  setGateOpen: function,
  lastHeartbeat: Date
}
```

---

## GHOST-COMMAND (Port 5173)

### Core Features

| Feature | Route | Description |
|---------|-------|-------------|
| Main | `/` | Command interface |
| Sage Link | - | File upload integration |

### Components (`g:\matrix\apps\ghost-command\src\components\`)

| Item | Purpose |
|------|---------|
| SageLink | File upload and AI processing |
| CommandConsole | Terminal-style interface |
| MatrixDevHUD | Diagnostic overlay |

---

## Shared Features

### Environment Variables

All apps use these `.env.development.local`:
```env
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=512
```

### NPM Scripts (All Apps)

```json
{
  "dev": "next dev -p [port]",
  "dev:turbo": "next dev -p [port] --turbopack",
  "build": "next build",
  "clean": "rimraf .next .turbo node_modules/.cache"
}
```

### Performance Settings (All Apps)

```javascript
// next.config.js / next.config.ts
{
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  logging: { fetches: { fullUrl: false } }
}
```

---

## Authentication

**Provider**: Supabase Auth
**Method**: Magic link (email)
**Flow**:
1. User enters email
2. Magic link sent
3. Click link → authenticated session
4. JWT stored in cookies

---

## Data Flow

```
User Action → React Component → API Route → Supabase
                                    ↓
                              ghost_bridge (commands)
                                    ↓
                              Sentinel.cjs (processes)
                                    ↓
                              Service Manager (executes)
```

---

*Last Updated: 2026-01-27*
