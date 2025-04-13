
export const RTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:coturn.snakkaz.com:3478',
      username: 'snakkaz',
      credential: 'snakkaz2023'
    }
  ],
  iceCandidatePoolSize: 10
};
