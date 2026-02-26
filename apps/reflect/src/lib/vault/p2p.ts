import { encryptVault, decryptVault } from './crypto';

export interface SyncMessage {
    type: 'sync_request' | 'sync_response' | 'neural_key_share';
    payload: any;
    iv?: string;
}

type DataConnection = {
    peer: string;
    on: (event: string, cb: (data?: any) => void) => void;
    send: (data: any) => void;
};

export class VaultSyncManager {
    private peer: any = null;
    private connections: DataConnection[] = [];
    private neuralKey: string | null = null;

    constructor(myPeerId?: string) {
        if (typeof window === 'undefined') return;
        this.bootstrapPeer(myPeerId);
    }

    private async bootstrapPeer(myPeerId?: string) {
        const PeerCtor = (window as any).Peer;
        if (!PeerCtor) {
            console.warn('[P2P] Peer runtime unavailable: window.Peer missing');
            this.peer = null;
            return;
        }

        this.peer = myPeerId ? new PeerCtor(myPeerId) : new PeerCtor();
        this.peer.on('connection', (conn: DataConnection) => this.handleConnection(conn));
    }

    setNeuralKey(key: string) {
        this.neuralKey = key;
    }

    private handleConnection(conn: DataConnection) {
        conn.on('data', async (data: any) => {
            const message = data as SyncMessage;
            

            if (message.type === 'sync_request' && this.neuralKey) {
                // Here we would fetch local data, encrypt it, and send back
                // For now, simple handshake
                conn.send({ type: 'sync_response', payload: 'READY' });
            }
        });
        this.connections.push(conn);
    }

    async connectToDevice(targetPeerId: string): Promise<DataConnection> {
        if (!this.peer) throw new Error("Peer not initialized");
        const conn = this.peer.connect(targetPeerId);
        return new Promise((resolve, reject) => {
            conn.on('open', () => {
                this.handleConnection(conn);
                resolve(conn);
            });
            conn.on('error', reject);
        });
    }

    async syncData(conn: DataConnection, data: any) {
        if (!this.neuralKey) throw new Error("Neural Key missing");
        const encrypted = await encryptVault(data, this.neuralKey);
        conn.send({
            type: 'sync_request',
            payload: encrypted.ciphertext,
            iv: encrypted.iv
        });
    }
}

export const syncManager = typeof window !== 'undefined' ? new VaultSyncManager() : null;
