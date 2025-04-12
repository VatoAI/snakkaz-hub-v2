export class PeerConnection {
  public dataChannel: RTCDataChannel | null = null;
  public connection: RTCPeerConnection;
  public peerId: string;

  constructor(connection: RTCPeerConnection, peerId: string) {
    this.connection = connection;
    this.peerId = peerId;
  }

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