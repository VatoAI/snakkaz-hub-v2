
import { PeerConnection } from './types';

export class PeerConnection implements PeerConnection {
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
