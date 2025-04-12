
import { type PeerConnection as IPeerConnection } from './types';

export class PeerConnection implements IPeerConnection {
  constructor(
    public connection: RTCPeerConnection,
    public peerId: string,
    public dataChannel: RTCDataChannel | null = null
  ) {}

  public close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.connection.close();
  }

  public setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
  }
}
