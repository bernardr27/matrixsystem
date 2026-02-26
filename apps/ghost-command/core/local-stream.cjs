const http = require('http');

class LocalStream {
    constructor(port = 3334) {
        this.port = port;
        this.clients = [];
        this.currentFrame = null;
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            if (req.url.startsWith('/stream')) {
                // MJPEG Header
                res.writeHead(200, {
                    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
                    'Cache-Control': 'no-cache',
                    'Connection': 'close',
                    'Pragma': 'no-cache'
                });

                this.clients.push(res);
                console.log(`[STREAM] Client connected. Total: ${this.clients.length}`);

                // Send current frame immediately if available
                if (this.currentFrame) {
                    this.sendFrameToClient(res, this.currentFrame);
                }

                req.on('close', () => {
                    this.clients = this.clients.filter(c => c !== res);
                    console.log(`[STREAM] Client disconnected. Total: ${this.clients.length}`);
                });
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Ghost Stream Active');
            }
        });

        this.server.listen(this.port, () => {
            console.log(`[STREAM] 🎥 Local MJPEG Server running on port ${this.port}`);
        });

        this.server.on('error', (err) => {
            console.error(`[STREAM_ERROR] ${err.message}`);
        });
    }

    broadcast(buffer) {
        this.currentFrame = buffer;
        this.clients.forEach(client => {
            this.sendFrameToClient(client, buffer);
        });
    }

    sendFrameToClient(client, buffer) {
        try {
            client.write(`--myboundary\nContent-Type: image/png\nContent-Length: ${buffer.length}\n\n`);
            client.write(buffer);
            client.write('\n');
        } catch (e) {
            console.error('[STREAM_SEND_FAIL]', e.message);
        }
    }
}

module.exports = LocalStream;
