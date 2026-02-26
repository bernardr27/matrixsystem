# App Validation Checklist

## Overview
Systematic validation of Reflect, Ghost Command, and Nexus apps to ensure:
- ✅ UI renders correctly (with and without Supabase)
- ✅ Data displays properly (mock data when offline)
- ✅ All routes navigate correctly
- ✅ Operations fail gracefully
- ✅ Offline indicators display
- ✅ No console errors

---

## REFLECT App

### With Supabase Connected ✅

#### Core Pages
- [ ] **Home/Dashboard** 
  - [ ] Loads without errors
  - [ ] Sessions list displays
  - [ ] Quick action buttons work
  - [ ] Navigation to other sections works
  
- [ ] **Journal** (`/journal`)
  - [ ] Session list loads
  - [ ] Entries display with full content
  - [ ] Pagination works if many sessions
  - [ ] Search functionality works
  - [ ] Can navigate to individual session
  - [ ] No "SIMULATED" badge visible
  
- [ ] **Journal Detail** (`/journal/[id]`)
  - [ ] Session content displays
  - [ ] Mode badge shows correct mode (free, mirror, etc.)
  - [ ] Timestamp accurate
  - [ ] Can navigate back to list
  - [ ] Edit/delete operations available
  
- [ ] **Insights** (`/insights`)
  - [ ] Patterns section shows real data
  - [ ] Terminal section shows live output
  - [ ] No "SIMULATED" badge
  - [ ] Patterns are clickable
  - [ ] Data refreshes on toggle
  
- [ ] **Patterns** (`/insights/patterns`)
  - [ ] Pattern cards display
  - [ ] Each pattern has details
  - [ ] Blindspots show properly detected
  - [ ] Resonance signals display
  - [ ] No "OFFLINE" indicator
  
- [ ] **Growth** (`/growth`)
  - [ ] Chart renders with real data
  - [ ] Statistics show proper calculations
  - [ ] No mock data indicators
  - [ ] Time period selection works
  
- [ ] **Profile** (`/profile`)
  - [ ] User info displays correctly
  - [ ] Avatar shows/is correct
  - [ ] Badges show with real data
  - [ ] Karma score shows real value
  - [ ] No "OFFLINE" state
  
- [ ] **Search** (`/search`)
  - [ ] Can search sessions by keyword
  - [ ] Results display properly
  - [ ] No "SIMULATED" badge
  - [ ] Navigation to results works
  
- [ ] **Settings** (`/settings`)
  - [ ] Settings load without error
  - [ ] Refractive History shows real data
  - [ ] No "OFFLINE" indicator
  - [ ] Can toggle preferences
  
- [ ] **Export** (`/export`)
  - [ ] Export buttons are enabled
  - [ ] Can export all sessions
  - [ ] Format options work
  - [ ] No "OFFLINE" state shown
  
- [ ] **Developer Page** (`/developer`)
  - [ ] API key generation button is ENABLED
  - [ ] Can copy generated keys
  - [ ] No "OFFLINE" label
  - [ ] Documentation loads
  
- [ ] **Trash** (`/trash`)
  - [ ] Deleted sessions display
  - [ ] Restore buttons enabled
  - [ ] Restore operations work
  - [ ] No "OFFLINE" badge
  
- [ ] **Demo** (`/demo`)
  - [ ] Page loads
  - [ ] SIMULATION label visible (intentional)
  - [ ] Demo data displays

#### Live Features
- [ ] **Real-time Subscriptions**
  - [ ] New sessions appear in list
  - [ ] Pattern updates reflect in real-time
  - [ ] Growth chart updates on new data
  
- [ ] **Telemetry Indicators**
  - [ ] SafeModeBanner not visible
  - [ ] All "Live" indicators show
  - [ ] No "OFFLINE" state in UI

---

### Without Supabase / Safe Mode 🔄

#### Core Pages (Should show mock data with "SIMULATED" labels)
- [ ] **Journal** 
  - [ ] Mock sessions display
  - [ ] "SIMULATED" badge visible on list/detail
  - [ ] Can still navigate entries
  - [ ] No crash/error on navigation
  
- [ ] **Insights**
  - [ ] Mock patterns display
  - [ ] "SIMULATED" label on both sections
  - [ ] Patterns clickable
  - [ ] No subscription errors in console
  
- [ ] **Growth**
  - [ ] Mock chart renders
  - [ ] Statistics display mock values
  - [ ] Responsive and interactive
  
- [ ] **Profile**
  - [ ] Mock user data shows
  - [ ] Badges show with mock values
  - [ ] "OFFLINE" badge on karma/level
  - [ ] Avatar still renders
  
- [ ] **Search**
  - [ ] Search input works
  - [ ] Returns mock results
  - [ ] "SIMULATED" label visible
  
- [ ] **Settings**
  - [ ] Refractive History shows "OFFLINE"
  - [ ] Other settings render
  - [ ] Preferences still toggle
  
- [ ] **Export**
  - [ ] Export buttons DISABLED
  - [ ] Tooltip explains why
  - [ ] No crash when hovering
  
- [ ] **Developer Page**
  - [ ] API key generation DISABLED
  - [ ] "OFFLINE" label visible
  - [ ] Button has disabled styling
  
- [ ] **Trash**
  - [ ] Shows empty or mock state
  - [ ] "OFFLINE" badge visible
  - [ ] No errors in console
  
- [ ] **Demo**
  - [ ] SIMULATION label still visible
  - [ ] Page functions normally

#### Safe Mode Indicators
- [ ] SafeModeBanner displays at top (if implemented)
- [ ] All mock data clearly labeled
- [ ] No silent failures in console
- [ ] Disabled operations show user feedback

---

## GHOST COMMAND App

### With Supabase Connected ✅

#### Core Pages
- [ ] **Console** (`/console` or main tab)
  - [ ] Terminal loads without error
  - [ ] Command history displays
  - [ ] Can type commands
  - [ ] Commands execute properly
  - [ ] No "Telemetry offline" message
  
- [ ] **Architect** (`/architect` or similar)
  - [ ] Loads without error
  - [ ] Displays current system state
  - [ ] Real-time updates visible
  - [ ] No offline indicators
  
- [ ] **Vault** (`/vault`)
  - [ ] Mission board loads
  - [ ] Active missions display
  - [ ] Mission details show real data
  - [ ] "Offline" mission count not shown
  
- [ ] **Matrix Network**
  - [ ] MatrixNetworkLink shows "Live" state
  - [ ] Real telemetry data displays
  - [ ] Connection indicator green
  - [ ] No "Telemetry offline" message

#### Live Features
- [ ] **Telemetry Stream**
  - [ ] v2 Terminal shows live updates
  - [ ] No "SIMULATED" badge
  - [ ] Real-time events stream in
  - [ ] NeuralLog updates live
  
- [ ] **Mission Execution**
  - [ ] Missions appear in MissionBoard
  - [ ] Mission count shows real number
  - [ ] Can execute/complete missions
  - [ ] Status updates in real-time
  
- [ ] **API Gateway**
  - [ ] TriagePanel shows "Online" status
  - [ ] Green indicator visible
  - [ ] No degradation message
  
- [ ] **System HUD**
  - [ ] MatrixDevHUD shows "Live feed"
  - [ ] SystemStatusHUD shows real CPU/RAM
  - [ ] Indicators update frequently
  - [ ] No "OFFLINE" state

---

### Without Supabase / Offline Mode 🔄

#### Core Pages (Should show offline indicators)
- [ ] **Console**
  - [ ] Terminal renders
  - [ ] Can type (commands don't execute)
  - [ ] Shows "Offline" state
  - [ ] No real command execution
  - [ ] Graceful error on attempt
  
- [ ] **Architect**
  - [ ] Page loads with mock/empty state
  - [ ] Shows offline indicator
  - [ ] No real-time updates
  
- [ ] **Vault**
  - [ ] Mission board shows empty/mock state
  - [ ] Mission count shows "Offline"
  - [ ] No live mission fetch
  - [ ] No errors in console
  
- [ ] **Matrix Network**
  - [ ] MatrixNetworkLink shows "Telemetry offline"
  - [ ] Connection indicator red/offline
  - [ ] All telemetry shows degraded state

#### Offline Indicators
- [ ] v2 Terminal shows "SIMULATED" badge
- [ ] NeuralLog shows "OFFLINE" badge
- [ ] MissionBoard shows "Offline" mission count
- [ ] TriagePanel shows API Gateway "Degraded"
- [ ] MatrixDevHUD shows mock/simulated label
- [ ] NeuralChat shows "Offline" vs "Live stream"
- [ ] SystemStatusHUD shows disabled indicators
- [ ] No console errors when attempting operations

#### Graceful Degradation
- [ ] No silent subscription failures
- [ ] Operations show explicit disabled/offline state
- [ ] Buttons remain visible but disabled
- [ ] Toast/log messages explain why offline

---

## NEXUS App

### With Supabase Connected ✅

#### Core Pages
- [ ] **Dashboard** (main view)
  - [ ] Loads without error
  - [ ] Service status shows real data
  - [ ] Monitoring widgets display
  - [ ] No offline indicators
  
- [ ] **Command History**
  - [ ] Previous commands load
  - [ ] CommandHistory shows real data
  - [ ] No "OFFLINE" badge
  - [ ] Can filter/search history
  
- [ ] **Dev Suite** (`/dev` or similar)
  - [ ] Protocols section loads
  - [ ] Queue operations available
  - [ ] Telemetry panel shows real data
  - [ ] No "OFFLINE" state
  
- [ ] **Portal** (`/portal` or portal section)
  - [ ] Streaming enabled
  - [ ] Data flows through
  - [ ] DesktopPortal shows live updates
  - [ ] No "OFFLINE" badge
  
- [ ] **Neural Pulse**
  - [ ] NeuralPulseOverlay animates
  - [ ] Subscriptions update in real-time
  - [ ] Ambient pulse visible
  
- [ ] **Neural Navigator**
  - [ ] Sync pod shows "Live" state
  - [ ] Real-time nav data displays
  - [ ] Status indicators show online

---

### Without Supabase / Offline Mode 🔄

#### Core Pages (Should show offline state)
- [ ] **Dashboard**
  - [ ] Loads without error
  - [ ] Shows empty/offline state
  - [ ] Monitoring disabled
  
- [ ] **Command History**
  - [ ] Shows empty or mock history
  - [ ] "OFFLINE" badge visible
  - [ ] No live queries attempted
  
- [ ] **Dev Suite**
  - [ ] Protocols operations DISABLED
  - [ ] Queue operations DISABLED
  - [ ] Telemetry panel shows "OFFLINE"
  - [ ] No attempts to execute
  
- [ ] **Portal**
  - [ ] Streaming DISABLED
  - [ ] "OFFLINE" badge shown
  - [ ] DesktopPortal grayed out
  - [ ] No live data flow
  
- [ ] **Neural Pulse**
  - [ ] Overlay renders but not animating
  - [ ] Subscriptions skipped
  - [ ] No errors in console
  
- [ ] **Neural Navigator**
  - [ ] Sync pod shows "Offline"
  - [ ] No live nav data
  - [ ] Status shows offline

#### Offline Indicators
- [ ] NeuralNavigator sync pod labeled "Offline"
- [ ] DesktopPortal shows "OFFLINE" badge
- [ ] DevSuite shows disabled state
- [ ] CommandHistory shows "OFFLINE" badge
- [ ] NeuralPulseOverlay subscriptions skipped
- [ ] TelemetryOfflineBanner visible (if implemented)
- [ ] No console errors from subscription attempts

#### Graceful Degradation
- [ ] Refresh button works but returns empty state
- [ ] Dashboard still loads UI structure
- [ ] No silent failures
- [ ] All async operations have error handling

---

## Cross-App Tests

### Error Handling
- [ ] No unhandled promise rejections in console
- [ ] All subscription errors caught
- [ ] API errors show user-friendly messages
- [ ] No "undefined" values in UI

### Navigation
- [ ] All internal routes work
- [ ] Back/forward browser buttons work
- [ ] URL state persists correctly
- [ ] Deep links work

### Performance
- [ ] Pages load quickly (< 2s)
- [ ] Smooth transitions between routes
- [ ] No layout shifts after hydration
- [ ] Animations are smooth

### Data Consistency
- [ ] Offline mock data matches UI expectations
- [ ] Live data displays correctly when available
- [ ] No mixing of mock + live data
- [ ] State persists across navigation

### Accessibility
- [ ] All disabled buttons are marked as such
- [ ] Offline indicators are accessible
- [ ] Focus management works
- [ ] ARIA labels present where needed

---

## Test Execution Plan

### Phase 1: Smoke Tests (Quick Checks)
1. Start each app
2. Verify no immediate errors
3. Check layout renders
4. Confirm offline banners visible

### Phase 2: Offline Mode Testing
1. Disable Supabase by setting `NEXT_PUBLIC_SUPABASE_URL=placeholder`
2. Test each app's offline behavior
3. Verify all offline indicators display
4. Check no console errors

### Phase 3: Online Mode Testing
1. Re-enable Supabase with valid credentials
2. Test each app's live behavior
3. Verify data loads and updates
4. Confirm no offline indicators shown

### Phase 4: Edge Cases
1. Toggle Supabase on/off during app usage
2. Test navigation with/without data
3. Verify error recovery
4. Check state persistence

---

## Status Tracking

### Reflect
- [ ] Smoke tests pass
- [ ] Offline mode validated
- [ ] Online mode validated
- [ ] All pages functional

### Ghost Command
- [ ] Smoke tests pass
- [ ] Offline mode validated
- [ ] Online mode validated
- [ ] All pages functional

### Nexus
- [ ] Smoke tests pass
- [ ] Offline mode validated
- [ ] Online mode validated
- [ ] All pages functional

---

## Issues Found & Resolutions

(To be filled during testing)

### Critical Issues
(None yet)

### Minor Issues
(None yet)

### Verified Working Features
(To be filled as tests pass)

---

## Sign-Off

- [ ] Reflect fully validated
- [ ] Ghost Command fully validated
- [ ] Nexus fully validated
- [ ] Ready for remaining improvements
