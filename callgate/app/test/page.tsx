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
          console.log("Websocket not connected")
          return 
        }
        WebsocketRef.current.send(JSON.stringify({join: true}))
      };       
      WebsocketRef.current.addEventListener("message", (event)=>{
        const message = JSON.parse(event.data)
        if(message.sdp){
          PeerRef.current?.setRemoteDescription(new RTCSessionDescription(message.sdp)).catch(err =>{
            console.log("error while setting remote description " , err)
          })
        }
        if (message.ice){
          PeerRef.current?.addIceCandidate(new RTCIceCandidate(message.ice)).catch(err =>{
            console.log("error while adding ice candidate " , err)
          })
        }
      })
        
        return (()=>{
          WebsocketRef.current?.close()
        })
    },[SERVER])
    
    const initstate = async()=>{
      const stream = await navigator.mediaDevices.getUserMedia({video: true});
      const videoElement = (document.getElementById("video") as HTMLVideoElement)

      videoElement.srcObject = stream;
      videoElement.play()

      PeerRef.current = createPeer()
      stream.getTracks().forEach((track)=>{
        PeerRef.current?.addTrack(track, stream)
      })
      
    }
    const createPeer = ():  (RTCPeerConnection | null)  =>{
      try{

        const peer   = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
        });

        peer.onnegotiationneeded = ()=> handleOnNegotiationNeeded(peer)
        peer.onicecandidate = (e)=>{
          if(e.candidate){
            WebsocketRef.current?.send(JSON.stringify({ice: e.candidate}))
          }
        }

        return peer
      }
      catch(er){
        console.log("error while creating peer " , er)
        return null

      }
      
    }
    const handleOnNegotiationNeeded= async(peer :RTCPeerConnection)=>{
      try{
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        if(WebsocketRef.current){
          console.log("sdp sent", peer.localDescription)
          WebsocketRef.current.send(JSON.stringify({sdp: peer.localDescription }))
        }
        else{
          console.log("error sending sdp")
          return 
        }
      }
      catch(er){
        console.log("error while creating offer " , er)
      }
    }


  return (
    <div>
        <button onClick={initstate}>
            send
        </button>
        <video id = "video"></video>
    </div>

  )
}

export default TestPage