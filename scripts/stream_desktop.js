const express = require('express');
const screenshot = require('screenshot-desktop');
const cors = require('cors');
const app = express();

const PORT = 3334;
const FPS = 10;
const INTERVAL = 1000 / FPS;

app.use(cors());

// Health Check
app.get('/health', (req, res) => res.send('OK'));

// MJPEG Stream Endpoint
app.get('/stream', (req, res) => {
    // Set headers for MJPEG stream
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=--matrixframe',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache'
    });

    let active = true;

    const sendFrame = async () => {
        if (!active) return;
        try {
            // Capture full screen as JPEG buffer
            const imgBuffer = await screenshot({ format: 'jpg' });

            // Send frame boundary and content
            res.write(`--matrixframe\nContent-Type: image/jpeg\nContent-Length: ${imgBuffer.length}\n\n`);
            res.write(imgBuffer);
            res.write('\n');

            // Schedule next frame
            setTimeout(sendFrame, INTERVAL);
        } catch (err) {
            console.error('[STREAM] Capture failed:', err.message);
            // Retry after delay on error
            setTimeout(sendFrame, 1000);
        }
    };

    // Start streaming
    sendFrame();

    // Clean up on client disconnect
    req.on('close', () => {
        active = false;
        console.log('[STREAM] Client disconnected');
    });
});

app.listen(PORT, () => {
    console.log(`[DESKTOP_PORTAL] Streaming active at http://localhost:${PORT}/stream`);
});
