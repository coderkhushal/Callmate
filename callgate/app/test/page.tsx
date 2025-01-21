// "use client";
// import { useEffect, useRef } from "react";

// const SERVER = process.env.NEXT_PUBLIC_SERVER || "localhost";

// const Room = () => {
//   const userVideo = useRef<HTMLVideoElement>(null);
//   const partnerVideo = useRef<HTMLVideoElement>(null);
//   const userStream = useRef<MediaStream | null>(null);
//   const peerRef = useRef<RTCPeerConnection | null>(null);
//   const webSocketRef = useRef<WebSocket | null>(null);

//   const openCamera = async () => {
//     const constraints = { video: true, audio: true };
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       if (userVideo.current) {
//         userVideo.current.srcObject = stream;
//       }
//       userStream.current = stream;
//     } catch (err) {
//       console.error("Error accessing camera/microphone:", err);
//     }
//   };

//   useEffect(() => {
//     const roomID = "abcdefghi";
//     const url = `${SERVER}/join?roomId=${roomID}`;
    
    
//     webSocketRef.current = new WebSocket(url);

//     webSocketRef.current.onopen = () => {
//       console.log("WebSocket connected");
//       webSocketRef.current?.send(JSON.stringify({ join: true }));
//     };

//     webSocketRef.current.onmessage = (e) => {
//       console.log("WebSocket message received:", e.data);
//       try {
//         const message = JSON.parse(e.data);

//         if (message.join) {
//           callUser();
//         }

//         if (message.offer) {
//           handleOffer(message.offer);
//         }

//         if (message.answer) {
//           console.log("Receiving Answer");
//           peerRef.current?.setRemoteDescription(
//             new RTCSessionDescription(message.answer)
//           );
//         }

//         if (message.iceCandidate) {
//           console.log("Receiving and Adding ICE Candidate");
//           peerRef.current?.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
//         }
//       } catch (err) {
//         console.error("Error parsing WebSocket message:", err);
//       }
//     };

//     webSocketRef.current.onerror = (err) => {
//       console.error("WebSocket error:", err);
//     };

//     webSocketRef.current.onclose = () => {
//       console.log("WebSocket disconnected");
//     };

//     openCamera();

//     return () => {
//       webSocketRef.current?.close();
//       userStream.current?.getTracks().forEach((track) => track.stop());
//     };
//   }, []);

//   const handleOffer = async (offer: RTCSessionDescriptionInit) => {
//     try {
//       console.log("Received Offer, Creating Answer");
//       peerRef.current = createPeer();
  
//       // Ensure the remote offer is set
//       if (peerRef.current?.signalingState === "stable") {
//         await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
//         console.log("Remote offer set successfully.");
//       } else {
//         console.error("Cannot set remote offer in state:", peerRef.current?.signalingState);
//         return;
//       }
  
//       // Add local tracks to the peer connection
//       userStream.current?.getTracks().forEach((track) => {
//         peerRef.current?.addTrack(track, userStream.current!);
//         console.log("Track added to peer connection:", track.kind);
//       });
  
//       // Create and set the local answer
//       const answer = await peerRef.current?.createAnswer();
//       await peerRef.current?.setLocalDescription(answer);
//       console.log("Local answer set successfully.");
  
//       // Send the answer back to the remote peer
//       webSocketRef.current?.send(JSON.stringify({ answer: peerRef.current.localDescription }));
//     } catch (error) {
//       console.error("Error handling offer:", error);
//     }
//   };
  
//   const callUser = async () => {
//     console.log("Calling Other User");
//     peerRef.current = createPeer();

//     userStream.current?.getTracks().forEach((track) => {
//       peerRef.current?.addTrack(track, userStream.current!);
//     });

//     const offer = await peerRef.current?.createOffer();
//     await peerRef.current?.setLocalDescription(offer);

//     webSocketRef.current?.send(JSON.stringify({ offer: peerRef.current?.localDescription }));
//   };

//   const createPeer = () => {
//     console.log("Creating Peer Connection");
//     const peer = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

//     peer.onicecandidate = handleIceCandidateEvent;
//     peer.ontrack = handleTrackEvent;

//     return peer;
//   };

//   const handleIceCandidateEvent = (e: RTCPeerConnectionIceEvent) => {
//     if (e.candidate) {
//       console.log("Found ICE Candidate:", e.candidate);
//       webSocketRef.current?.send(JSON.stringify({ iceCandidate: e.candidate }));
//     }
//   };

//   const handleTrackEvent = (e: RTCTrackEvent) => {
//     console.log("Received ontrack event:", e.streams);
//     if (partnerVideo.current && e.streams[0]) {
//       partnerVideo.current.srcObject = e.streams[0];
//       console.log("Partner video stream set");
//   };}

//   return (
//     <div>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           color: "whitesmoke",
//           height: "200px",
//           width: "100%",
//         }}
//       >
//         <h1>Golang {"&"} React</h1>
//       </div>

//       <div
//         style={{
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           top: "100px",
//           right: "100px",
//           borderRadius: "10px",
//           overflow: "hidden",
//         }}
//       >
//         <video playsInline autoPlay muted controls ref={userVideo} />
//         <video playsInline autoPlay controls ref={partnerVideo} />
//       </div>
//     </div>
//   );
// };

// export default Room;
"use client"
import { PcCase } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const TestPage = () => {
    const WebsocketRef = useRef<WebSocket | null>(null)
    const PeerRef = useRef<RTCPeerConnection | null>(null)
    useEffect(()=>{
        const roomId = "defaultroom"
WebsocketRef.current = new WebSocket(SERVER + "/join?roomId=" + roomId)
WebsocketRef.current.onopen = () => {
    console.log("WebSocket connected");
    if(!WebsocketRef.current){
        return
    }
    WebsocketRef.current.send(JSON.stringify({ join: true }));
    };       
    },[SERVER])
    
    const initiate = ()=>{
        if(!WebsocketRef.current){
            alert("socket not found")
return
        }
        WebsocketRef.current.addEventListener("message",async (e) => {
            console.log("WebSocket message received:", e.data);
            try {
              const message = JSON.parse(e.data);
                if(message.createAnswer){

                      await PeerRef.current?.setRemoteDescription(message.sdp)
                }
                else if(message.iceCandidate){
                    
                    PeerRef.current?.addIceCandidate(message.candidate)
                }
            } catch (err) {
              console.error("Error parsing WebSocket message:", err);
            }
          })

          PeerRef.current = new RTCPeerConnection(
            {
            iceServers: [{ urls: ["stun:stun.l.google.com:19302", 'stun:stun3.l.google.com:19302'] }],
          }
        );

          PeerRef.current.onicecandidate = (event) =>{
            if(event.candidate) {
                WebsocketRef.current?.send(JSON.stringify({iceCandidate: true, candidate:  event.candidate}))
            }
          }

          PeerRef.current.onnegotiationneeded = async()=>{
            console.log("onnegotiation needed")
            const offer = await PeerRef.current?.createOffer()
            if(!offer){
                console.log("offer not found")
                return
            }
            await PeerRef.current?.setLocalDescription(offer)
            WebsocketRef.current?.send(JSON.stringify({createOffer: true, sdp: PeerRef.current?.localDescription}))
          }

          getCameraStreamAndSend()
    }
    const getCameraStreamAndSend = ()=>{
        navigator.mediaDevices.getUserMedia({video: true}).then((stream)=>{
            const video = document.createElement("video")
            video.srcObject = stream
            video.play()

            document.body.appendChild(video)
            stream.getTracks().forEach(track=>{
                console.error("track added")
                console.log(track)
                console.log(PeerRef.current)
                PeerRef.current?.addTrack(track, stream)
                
            })

        })
    }
  return (
    <div>
        <button onClick={initiate}>
            send
        </button>
    </div>

  )
}

export default TestPage