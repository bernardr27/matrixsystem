const { execSync } = require('child_process');
const https = require('https');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing in .env');
    process.exit(1);
}

// Get the current Nexus Gate URL usually from environment or user input
// For this script, we'll try to fetch it if possible, or ask user.
// Since we can't easily get the dynamic URL here without running Sentinel, 
// we'll output instructions.

console.log(`
---------------------------------------------------
TELEGRAM WEBHOOK SETUP
---------------------------------------------------

1. Ensure Matrix is running and Nexus Gate is OPEN.
2. Get your public HTTPS URL (e.g., https://happy-otter-42.loca.lt)
3. Run this command:

   curl "https://api.telegram.org/bot${token}/setWebhook?url=YOUR_URL/api/telegram"

---------------------------------------------------
If you want to disable the webhook (to use polling):
   curl "https://api.telegram.org/bot${token}/deleteWebhook"
---------------------------------------------------
`);
