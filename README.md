# The Matrix

The Matrix is a unified ecosystem of applications and core services designed for high-performance personal management, reflection, and command control.

## 🌟 Applications

### 1. **Nexus** (`apps/nexus`) — Port 3001
The central command dashboard.
- **Tech Stack**: Next.js 16, TailwindCSS, Framer Motion
- **Features**: System diagnostics, service management, analytics dashboard, gate tunnels

### 2. **Reflect** (`apps/reflect`) — Port 3000
A premium self-reflection and journaling application.
- **Tech Stack**: Next.js 16, React 19, Three.js
- **Top Features**: Neural Weaving, Mood Tracking, Voice/Text Journaling, Sage AI
- **Sync**: Supabase (Cloud) + Local Storage

### 3. **Ghost Command** (`apps/ghost-command`) — Port 5173
A CLI-style interface for system control and specialized tasks.
- **Modules**: Sage Link, System Triage, File Operations, Vision Camera

## 🛠 Core Services

- **Sentinel** (`apps/ghost-command/core/sentinel.cjs`): System monitor and process guardian
- **Ghost Runner** (`apps/ghost-command/core/ghost-runner.cjs`): Task execution engine
- **Triage** (`apps/ghost-command/core/triage.cjs`): Health scanning and code maintenance
- **Deployer** (`apps/ghost-command/core/deployer.cjs`): Multi-target deployment pipeline
- **Backup** (`apps/ghost-command/core/backup.cjs`): Automated local/cloud backup system
- **Analytics** (`apps/ghost-command/core/analytics.cjs`): System telemetry and insights

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account (optional, for sync)

### Setup
```bash
npm install
```

### Running the System
Start the full Matrix ecosystem:
```bash
.\launchers\start.bat
```

Or use the main control menu:
```bash
.\launchers\MASTER_CONTROL.bat
```

### Stopping
```bash
.\launchers\stop.bat
```

## 📊 Dashboards
- **Nexus**: `http://localhost:3001` — System monitoring & analytics
- **Reflect**: `http://localhost:3000` — Journaling & reflection
- **Ghost Command**: `http://localhost:5173` — AI agent interface

## ☁️ Cloud Synchronization
To synchronize the Matrix with the Cloud Bridge, use the following commands:
```bash
git remote add origin https://github.com/bernardr27/matrixsystem.git
git branch -M main
git push -u origin main
```

## 📚 Documentation
See `MASTER/MATRIX_COMPLETE_GUIDE.md` for the full reference.

---
*Last Updated: 2026-02-12*
