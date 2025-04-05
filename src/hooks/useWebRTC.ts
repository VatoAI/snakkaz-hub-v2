
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

interface PeerState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  stream: MediaStream | null;
}

interface WebRTCHook {
  peerState: PeerState;
  startPeerConnection: () => Promise<void>;
  closePeerConnection: () => void;
  connectionAttempts: number;
  maxConnectionAttempts: number;
}

export const useWebRTC = (userId: string | undefined, friendId: string | undefined): WebRTCHook => {
  const [peerState, setPeerState] = useState<PeerState>(
    { connected: false, connecting: false, error: null, stream: null }
  );
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 5;
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const sendChannel = useRef<RTCDataChannel | null>(null);
  const peerChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerTimeout = useRef<NodeJS.Timeout | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidate[]>([]);
  const isIceCandidateAdded = useRef(false);

  const peerConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  };

  const handlePeerError = useCallback((error: any) => {
    console.error('Peer connection error:', error);
    setPeerState(prevState => ({ ...prevState, error: 'Failed to establish peer connection', connecting: false }));
  }, []);

  const handleIceCandidateError = useCallback((event: RTCPeerConnectionIceErrorEvent) => {
    console.error('ICE candidate error:', event);
  }, []);

  const handleIceGatheringStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`ICE gathering state changed: ${peerConnection.current.iceGatheringState}`);
    }
  }, []);

  const handleIceConnectionStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`ICE connection state changed: ${peerConnection.current.iceConnectionState}`);
    }
  }, []);

  const handlePeerConnectionStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`Peer connection state changed: ${peerConnection.current.connectionState}`);
    }
  }, []);

  const handleTrack = useCallback((event: RTCTrackEvent) => {
    console.log('Track event received:', event);
    if (event.streams && event.streams[0]) {
      setPeerState(prevState => ({ ...prevState, stream: event.streams[0] }));
    } else {
      console.log('No stream attached to the track, creating a stream');
      const stream = new MediaStream([event.track]);
      setPeerState(prevState => ({ ...prevState, stream: stream }));
    }
  }, []);

  const closePeerConnection = useCallback(() => {
    console.log('Closing peer connection');
    
    if (peerTimeout.current) {
      clearTimeout(peerTimeout.current);
      peerTimeout.current = null;
    }

    if (sendChannel.current) {
      sendChannel.current.close();
      sendChannel.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (peerChannel.current) {
      peerChannel.current.unsubscribe();
      peerChannel.current = null;
    }

    setPeerState({ connected: false, connecting: false, error: null, stream: null });
  }, []);

  const handlePeerChannelError = useCallback(() => {
    console.error('Peer channel error occurred');
    setPeerState(prevState => ({ ...prevState, connected: false, connecting: false, error: 'Peer channel error' }));
    closePeerConnection();
    
    if (connectionAttempts < maxConnectionAttempts) {
      const reconnectDelay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000);
      console.log(`Attempting to reconnect in ${reconnectDelay}ms`);
      setTimeout(() => startPeerConnection(), reconnectDelay);
    } else {
      console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
    }
  }, [connectionAttempts, maxConnectionAttempts, closePeerConnection]);

  const handleIceCandidate = useCallback(async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      console.log('Sending ICE candidate to peer:', event.candidate);
      
      if (peerChannel.current?.state === 'SUBSCRIBED') {
        try {
          const { error } = await supabase
            .from('signaling')
            .insert({
              sender_id: userId,
              receiver_id: friendId,
              signal_data: JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate
              })
            });
          
          if (error) {
            console.error('Error sending ICE candidate:', error);
          } else {
            console.log('ICE candidate sent successfully');
          }
        } catch (error) {
          console.error('Failed to send ICE candidate:', error);
        }
      } else {
        iceCandidateQueue.current.push(event.candidate);
        console.log('ICE candidate queued, channel not ready yet');
      }
    } else {
      console.log('ICE gathering complete');
    }
  }, [userId, friendId]);

  const startPeerConnection = useCallback(async () => {
    if (!userId || !friendId) {
      console.error('User or friend ID is missing');
      setPeerState(prevState => ({ ...prevState, error: 'Missing user or friend ID', connecting: false }));
      return;
    }

    if (peerState.connecting || peerState.connected) {
      console.log('Peer connection already in progress');
      return;
    }

    if (connectionAttempts >= maxConnectionAttempts) {
      console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
      setPeerState(prevState => ({ ...prevState, connecting: false, error: 'Max connection attempts reached' }));
      return;
    }

    setPeerState(prevState => ({ ...prevState, connecting: true, error: null }));
    setConnectionAttempts(prevAttempts => prevAttempts + 1);
    console.log(`Starting peer connection attempt ${connectionAttempts + 1} of ${maxConnectionAttempts}`);

    if (peerTimeout.current) {
      clearTimeout(peerTimeout.current);
    }

    peerTimeout.current = setTimeout(() => {
      console.error('Peer connection timed out');
      handlePeerChannelError();
    }, 15000);

    try {
      peerConnection.current = new RTCPeerConnection(peerConfig);
      console.log('Peer connection created');

      peerConnection.current.addEventListener('icecandidateerror', handleIceCandidateError);
      peerConnection.current.addEventListener('icegatheringstatechange', handleIceGatheringStateChange);
      peerConnection.current.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
      peerConnection.current.addEventListener('connectionstatechange', handlePeerConnectionStateChange);
      peerConnection.current.addEventListener('track', handleTrack);
      peerConnection.current.addEventListener('icecandidate', handleIceCandidate);
      console.log('Event listeners registered');

      sendChannel.current = peerConnection.current.createDataChannel('sendDataChannel');
      console.log('Data channel created');

      sendChannel.current.onopen = () => {
        console.log('Data channel is now open and ready to use');
      };

      sendChannel.current.onclose = () => {
        console.log('Data channel is closed');
      };

      peerConnection.current.ondatachannel = (event) => {
        console.log('Data channel received:', event.channel);
      };

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('User media obtained');

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      console.log('Tracks added to peer connection');

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Offer created and set as local description');

      const { error: offerError } = await supabase
        .from('signaling')
        .insert({
          sender_id: userId,
          receiver_id: friendId,
          signal_data: JSON.stringify({
            type: 'offer',
            sdp: offer
          })
        });

      if (offerError) {
        console.error('Error sending offer:', offerError);
        handlePeerError(offerError);
        return;
      }
      console.log('Offer sent to peer');

      peerChannel.current = supabase.channel(`peer_stream:${userId}:${friendId}`, {
        config: {
          broadcast: {
            self: false,
          },
        },
      });
      console.log('Supabase channel created');

      peerChannel.current
        .on('broadcast', { event: 'webrtc_signal' }, async (payload) => {
          if (payload.payload.sender_id === userId) {
            return;
          }

          const signal = payload.payload.signal_data;
          const type = payload.payload.signal_type;

          console.log(`Received ${type} from peer`);

          if (type === 'answer') {
            const answer = new RTCSessionDescription(signal);
            await peerConnection.current?.setRemoteDescription(answer);
            console.log('Answer set as remote description');
          } else if (type === 'ice-candidate') {
            try {
              if (peerConnection.current?.remoteDescription) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(signal));
                console.log('ICE candidate added');
              } else {
                console.log('Remote description not set yet, ICE candidate queued');
                iceCandidateQueue.current.push(new RTCIceCandidate(signal));
              }
            } catch (e) {
              console.error('Error adding ICE candidate:', e);
              handlePeerError(e);
            }
          }
        })
        .subscribe(async (status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to peer stream!');
            
            setPeerState(prevState => ({ ...prevState, connected: true, connecting: false }));
            setConnectionAttempts(0);
          }
          
          if (
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
            status === REALTIME_SUBSCRIBE_STATES.CLOSED ||
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
          ) {
            console.error('Subscription failed:', status);
            
            handlePeerChannelError();
          }
        });
    } catch (error: any) {
      console.error('Error during peer connection setup:', error);
      handlePeerError(error);
    }
  }, [userId, friendId, handlePeerError, handleIceCandidate, handleTrack, handleIceCandidateError, handleIceGatheringStateChange, handleIceConnectionStateChange, handlePeerConnectionStateChange, connectionAttempts, maxConnectionAttempts, handlePeerChannelError, peerState.connected, peerState.connecting]);

  useEffect(() => {
    if (!userId || !friendId) {
      return;
    }

    const webrtcChannel = supabase
      .channel(`webrtc_signals:${userId}:${friendId}`, {
        config: {
          broadcast: {
            self: false,
          },
        },
      })
      .on('broadcast', { event: 'webrtc_signal' }, async (payload) => {
        if (payload.payload.sender_id === userId) {
          return;
        }

        const signal = payload.payload.signal_data;
        const type = payload.payload.signal_type;

        console.log(`Received ${type} from peer`);

        if (type === 'offer') {
          if (peerTimeout.current) {
            clearTimeout(peerTimeout.current);
            peerTimeout.current = null;
          }
          
          if (!peerConnection.current) {
            peerConnection.current = new RTCPeerConnection(peerConfig);

            peerConnection.current.addEventListener('icecandidateerror', handleIceCandidateError);
            peerConnection.current.addEventListener('icegatheringstatechange', handleIceGatheringStateChange);
            peerConnection.current.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
            peerConnection.current.addEventListener('connectionstatechange', handlePeerConnectionStateChange);
            peerConnection.current.addEventListener('track', handleTrack);
            peerConnection.current.addEventListener('icecandidate', handleIceCandidate);

            peerConnection.current.ondatachannel = (event) => {
              console.log('Data channel received:', event.channel);
            };
          }

          try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
            console.log('Offer set as remote description');

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => {
              peerConnection.current?.addTrack(track, stream);
            });
            console.log('Tracks added to peer connection');

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            console.log('Answer created and set as local description');

            const { error: answerError } = await supabase
              .from('signaling')
              .insert({
                sender_id: userId,
                receiver_id: friendId,
                signal_data: JSON.stringify({
                  type: 'answer',
                  sdp: answer
                })
              });

            if (answerError) {
              console.error('Error sending answer:', answerError);
              handlePeerError(answerError);
              return;
            }
            console.log('Answer sent to peer');
          } catch (e) {
            console.error('Error handling offer:', e);
            handlePeerError(e);
          }
        }
      })
      .subscribe();

    return () => {
      console.log('Unsubscribing from webrtc_signals channel');
      webrtcChannel.unsubscribe();
      closePeerConnection();
    };
  }, [userId, friendId, closePeerConnection, handlePeerError, handleIceCandidate, handleTrack, handleIceCandidateError, handleIceGatheringStateChange, handleIceConnectionStateChange, handlePeerConnectionStateChange]);

  return {
    peerState,
    startPeerConnection,
    closePeerConnection,
    connectionAttempts,
    maxConnectionAttempts
  };
};
