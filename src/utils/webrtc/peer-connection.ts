export class PeerConnection {
  public dataChannel: RTCDataChannel | null = null;
  public connection: RTCPeerConnection;

  constructor(connection: RTCPeerConnection, public peerId: string) {
    this.connection = connection;
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