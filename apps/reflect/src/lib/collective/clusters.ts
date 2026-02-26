import { generateNeuralKey, encryptVault, decryptVault } from '../vault/crypto';

export interface ClusterMessage {
    type: 'cluster_join' | 'cluster_accepted' | 'synapse_push' | 'heartbeat';
    sender: string;
    payload: any;
    iv?: string;
}

type DataConnection = {
    peer: string;
    on: (event: string, cb: (data?: any) => void) => void;
    send: (data: any) => void;
};

export class ClusterManager {
    private peer: any = null;
    private clusterId: string | null = null;
    private members: Map<string, DataConnection> = new Map();
    private clusterKey: string | null = null;
    private onMessage?: (msg: ClusterMessage) => void;

    constructor(myId?: string, onMessage?: (msg: ClusterMessage) => void) {
        if (typeof window === 'undefined') return;
        this.onMessage = onMessage;
        this.bootstrapPeer(myId);
    }

    private async bootstrapPeer(myId?: string) {
        const PeerCtor = (window as any).Peer;
        if (!PeerCtor) {
            console.warn('[Cluster] Peer runtime unavailable: window.Peer missing');
            this.peer = null;
            return;
        }

        this.peer = myId ? new PeerCtor(myId) : new PeerCtor();
        this.peer.on('connection', (conn: DataConnection) => this.setupConnection(conn));
    }

    async createCluster() {
        this.clusterKey = await generateNeuralKey();
        this.clusterId = this.peer?.id || null;
        
        return { clusterId: this.clusterId, clusterKey: this.clusterKey };
    }

    async joinCluster(hostId: string, providedKey: string) {
        if (!this.peer) return;
        this.clusterKey = providedKey;
        const conn = this.peer.connect(hostId);
        this.setupConnection(conn);
    }

    private setupConnection(conn: DataConnection) {
        conn.on('open', () => {
            this.members.set(conn.peer, conn);
            
            conn.send({ type: 'cluster_join', sender: this.peer?.id, payload: 'HELLO' });
        });

        conn.on('data', async (data: any) => {
            const msg = data as ClusterMessage;
            if (this.onMessage) this.onMessage(msg);

            if (msg.type === 'synapse_push' && this.clusterKey) {
                try {
                    const decrypted = await decryptVault(msg.payload, msg.iv!, this.clusterKey);
                    
                } catch (e) {
                    console.error("[Cluster] Decryption failed");
                }
            }
        });

        conn.on('close', () => {
            this.members.delete(conn.peer);
        });
    }

    async broadcastSynapse(data: any) {
        if (!this.clusterKey) return;
        const encrypted = await encryptVault(data, this.clusterKey);
        const msg: ClusterMessage = {
            type: 'synapse_push',
            sender: this.peer?.id || 'unknown',
            payload: encrypted.ciphertext,
            iv: encrypted.iv
        };

        this.members.forEach(conn => conn.send(msg));
    }

    getClusterStatus() {
        return {
            id: this.clusterId,
            memberCount: this.members.size,
            active: !!this.clusterKey
        };
    }
}
