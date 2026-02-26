# 📱 Nexus Mobile Access Guide

## Quick Start

Run this command:
```powershell
launchers\nexus_mobile.bat
```

This will:
1. Display your local IP address
2. Show a QR code to scan with your phone
3. Start Nexus on your local network

---

## Manual Setup

If you prefer to do it manually:

### Step 1: Get Your Local IP
```powershell
node scripts\mobile_access.js
```

### Step 2: Start Nexus for Network Access
```powershell
cd apps\nexus
npm run dev -- --host 0.0.0.0
```

### Step 3: Access from Phone
- Connect your phone to the **SAME WiFi network**
- Open browser on phone
- Scan QR code OR type: `http://YOUR-IP:3000`

---

## Your Connection Info

**Local IP:** `192.168.12.112`  
**Port:** `3000`  
**Full URL:** `http://192.168.12.112:3000`

---

## Troubleshooting

### ❌ "Can't connect" or "Connection refused"

**Check 1: Firewall**
Windows Firewall may be blocking Node.js:
1. Search "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Find "Node.js" and check both Private and Public boxes
4. If not listed, click "Allow another app" and add `node.exe`

**Check 2: Same Network**
- Phone and PC must be on the SAME WiFi
- Check WiFi name on both devices
- Corporate/University networks may block device-to-device communication

**Check 3: Nexus is Running**
- Make sure you started Nexus with `--host 0.0.0.0`
- Regular `npm run dev` only binds to localhost (won't work)

### ❌ QR Code Won't Scan

Type the URL manually in your phone's browser:
```
http://192.168.12.112:3000
```

### ❌ IP Address Changed

Your local IP can change after restart. Re-run to get updated QR:
```powershell
node scripts\mobile_access.js
```

---

## Testing Guide

Once connected, test these features:

### 1. Infrastructure Tab
- Check real-time system metrics
- View CPU/RAM predictions
- See Ghost Runner status

### 1b. Diagnostics Autopilot (NEW)
- Open `/diagnostics`
- Use **Run Quick Heal** for remote fast recovery
- Use **Run Full Heal** for deeper lint/readiness remediation
- Use **Start Maintenance** for pause/heal/verify/restart cycle
- Use **Stop Maintenance** to force maintenance mode off
- Review run score and failed checks in panel history

### 2. Hive Tab (NEW!)
- View 3 registered instances
- Check collective intelligence feed
- Monitor cross-instance activity

### 3. Integrations Tab (NEW!)
- See 5 available integrations
- View health status
- Check event log

### 4. Terminal Tab
- Send Sage commands
- View conversation history
- Test AI responses

---

## Advanced: Port Forwarding (Access from Anywhere)

> ⚠️ **Security Warning:** Only do this if you understand the risks!

To access Nexus from outside your local network:

1. **Router Configuration:**
   - Login to your router (usually `192.168.1.1`)
   - Find "Port Forwarding" settings
   - Forward external port `3000` to `192.168.12.112:3000`

2. **Get Public IP:**
   ```powershell
   curl ifconfig.me
   ```

3. **Access:**
   - From anywhere: `http://YOUR-PUBLIC-IP:3000`

**Security Considerations:**
- Nexus has no authentication (anyone can access)
- Consider using a VPN instead
- Don't expose production systems

---

## Quick Commands

```powershell
# Show QR code and IP
node scripts\mobile_access.js

# Start mobile-accessible Nexus
launchers\nexus_mobile.bat

# Manual start (from apps/nexus)
npm run dev -- --host 0.0.0.0
```

---

## FAQ

**Q: Why do I need `--host 0.0.0.0`?**  
A: By default, Next.js only accepts connections from `localhost`. The `--host 0.0.0.0` flag tells it to accept connections from any IP address on your network.

**Q: Is this secure?**  
A: On your local network, yes. Anyone on your WiFi can access it, but that's usually just your devices. Don't expose it to the internet without authentication.

**Q: Will this work with Vercel?**  
A: No, this is only for local testing. Tomorrow when you update Vercel, you'll have the public URL.

**Q: Can I access this from work/school?**  
A: Only if your phone and PC are on the same network. Most public/corporate WiFi blocks device-to-device connections for security.

---

Enjoy testing Nexus on your phone! 🚀
