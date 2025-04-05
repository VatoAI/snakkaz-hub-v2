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
  const isIce кандидатеAddеd = useRef(false);

  // Configuration for the peer connection
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

  // Function to handle errors during peer connection setup
  const handlePeerError = useCallback((error: any) => {
    console.error('Peer connection error:', error);
    setPeerState(prevState => ({ ...prevState, error: 'Failed to establish peer connection', connecting: false }));
  }, []);

  // Function to handle ICE candidate errors
  const handleIceCandidateError = useCallback((event: RTCPeerConnectionIceErrorEvent) => {
    console.error('ICE candidate error:', event);
  }, []);

  // Function to handle ICE gathering state changes
  const handleIceGatheringStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`ICE gathering state changed: ${peerConnection.current.iceGatheringState}`);
    }
  }, []);

  // Function to handle ICE connection state changes
  const handleIceConnectionStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`ICE connection state changed: ${peerConnection.current.iceConnectionState}`);
    }
  }, []);

  // Function to handle peer connection state changes
  const handlePeerConnectionStateChange = useCallback(() => {
    if (peerConnection.current) {
      console.log(`Peer connection state changed: ${peerConnection.current.connectionState}`);
    }
  }, []);

  // Function to handle track events (incoming media streams)
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

  // Function to handle the peer channel error
  const handlePeerChannelError = useCallback(() => {
    console.error('Peer channel error occurred');
    setPeerState(prevState => ({ ...prevState, connected: false, connecting: false, error: 'Peer channel error' }));
    closePeerConnection();
    
    // Attempt to reconnect if max attempts not reached
    if (connectionAttempts < maxConnectionAttempts) {
      const reconnectDelay = Math.min(Math.pow(2, connectionAttempts) * 1000, 30000); // Capped at 30 seconds
      console.log(`Attempting to reconnect in ${reconnectDelay}ms`);
      setTimeout(startPeerConnection, reconnectDelay);
    } else {
      console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
    }
  }, [connectionAttempts, maxConnectionAttempts, closePeerConnection, startPeerConnection]);

  // Function to handle ICE candidates
  const handleIceCandidate = useCallback(async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      console.log('Sending ICE candidate to peer:', event.candidate);
      
      // Queue the ICE candidate if the channel is not yet ready
      if (peerChannel.current?.state !== 'SUBSCRIBED') {
        iceCandidateQueue.current.push(event.candidate);
        console.log('ICE candidate queued, channel not ready yet');
        return;
      }
      
      // Send the ICE candidate immediately if the channel is ready
      try {
        const { error } = await supabase
          .from('webrtc_signals')
          .insert({
            sender_id: userId,
            receiver_id: friendId,
            signal_type: 'ice-candidate',
            signal_data: event.candidate,
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
      console.log('ICE gathering complete');
    }
  }, [userId, friendId]);

  // Function to start the peer connection
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

    // Check if we've exceeded the max connection attempts
    if (connectionAttempts >= maxConnectionAttempts) {
      console.error(`Max connection attempts reached (${maxConnectionAttempts}). Giving up.`);
      setPeerState(prevState => ({ ...prevState, connecting: false, error: 'Max connection attempts reached' }));
      return;
    }

    setPeerState(prevState => ({ ...prevState, connecting: true, error: null }));
    setConnectionAttempts(prevAttempts => prevAttempts + 1);
    console.log(`Starting peer connection attempt ${connectionAttempts + 1} of ${maxConnectionAttempts}`);

    // Clear any existing timeout
    if (peerTimeout.current) {
      clearTimeout(peerTimeout.current);
    }

    // Set a timeout to handle connection failure
    peerTimeout.current = setTimeout(() => {
      console.error('Peer connection timed out');
      handlePeerChannelError();
    }, 15000); // 15 seconds

    try {
      // Create a new peer connection
      peerConnection.current = new RTCPeerConnection(peerConfig);
      console.log('Peer connection created');

      // Register event listeners
      peerConnection.current.addEventListener('icecandidateerror', handleIceCandidateError);
      peerConnection.current.addEventListener('icegatheringstatechange', handleIceGatheringStateChange);
      peerConnection.current.addEventListener('iceconnectionstatechange', handleIceConnectionStateChange);
      peerConnection.current.addEventListener('connectionstatechange', handlePeerConnectionStateChange);
      peerConnection.current.addEventListener('track', handleTrack);
      peerConnection.current.addEventListener('icecandidate', handleIceCandidate);
      console.log('Event listeners registered');

      // Create a data channel
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

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('User media obtained');

      // Add tracks to the peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      console.log('Tracks added to peer connection');

      // Create offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Offer created and set as local description');

      // Send offer to peer
      const { error: offerError } = await supabase
        .from('webrtc_signals')
        .insert({
          sender_id: userId,
          receiver_id: friendId,
          signal_type: 'offer',
          signal_data: offer,
        });

      if (offerError) {
        console.error('Error sending offer:', offerError);
        handlePeerError(offerError);
        return;
      }
      console.log('Offer sent to peer');

      // Set up Supabase channel for signaling
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
        // Subscribe to the channel and handle subscription status
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to peer stream!');
          
          // Set connection status to 'connected'
          setPeerState(prevState => ({ ...prevState, connected: true, connecting: false }));
          
          // Reset connection attempts on successful subscription
          setConnectionAttempts(0);
        }
        
        // Check for subscription errors using the enum values correctly
        if (
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
          status === REALTIME_SUBSCRIBE_STATES.CLOSED ||
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
        ) {
          console.error('Subscription failed:', status);
          
          // Handle reconnection similar to our presence connection
          handlePeerChannelError();
        }
      });
    } catch (error: any) {
      console.error('Error during peer connection setup:', error);
      handlePeerError(error);
    }
  }, [userId, friendId, handlePeerError, handleIceCandidate, handleTrack, handleIceCandidateError, handleIceGatheringStateChange, handleIceConnectionStateChange, handlePeerConnectionStateChange, handlePeerChannelError, connectionAttempts, maxConnectionAttempts]);

  // Function to close the peer connection
  const closePeerConnection = useCallback(() => {
    console.log('Closing peer connection');
    
    // Clear the timeout
    if (peerTimeout.current) {
      clearTimeout(peerTimeout.current);
      peerTimeout.current = null;
    }

    // Close the data channel
    if (sendChannel.current) {
      sendChannel.current.close();
      sendChannel.current = null;
    }

    // Close the peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Unsubscribe from the Supabase channel
    if (peerChannel.current) {
      peerChannel.current.unsubscribe();
      peerChannel.current = null;
    }

    // Reset the peer state
    setPeerState({ connected: false, connecting: false, error: null, stream: null });
  }, []);

  // Effect to handle incoming signals and start the connection
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
          // Clear the timeout when offer is received
          if (peerTimeout.current) {
            clearTimeout(peerTimeout.current);
            peerTimeout.current = null;
          }
          
          // Create a new peer connection if one doesn't exist
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
              .from('webrtc_signals')
              .insert({
                sender_id: userId,
                receiver_id: friendId,
                signal_type: 'answer',
                signal_data: answer,
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

    // Clean up on unmount
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
