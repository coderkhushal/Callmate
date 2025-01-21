"use client"
import React, { useEffect, useRef } from 'react'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const RecieverPage = () => {

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
    WebsocketRef.current.send(JSON.stringify({ recieve: true }));

    };       
    startRecieving()
    return (()=>{
        WebsocketRef.current?.close()
        PeerRef.current?.close()
        document.querySelectorAll("video").forEach((video)=>{
            video.remove()
    })
    })
    },[SERVER])


    const startRecieving = () => {
        const video = document.createElement("video");
        document.body.appendChild(video);

        PeerRef.current = new RTCPeerConnection({
            iceServers: [{ urls: ["stun:stun.l.google.com:19302", 'stun:stun3.l.google.com:19302'] }],
        });

        PeerRef.current.ontrack = (event) => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).addTrack(event.track);
            } else {
                video.srcObject = new MediaStream([event.track]);
            }
            video.play();
        };

        PeerRef.current.onicecandidate = (event) => {
            if(!WebsocketRef.current){
                return
            }
            if (event.candidate && WebsocketRef.current?.readyState === WebSocket.OPEN) {
                WebsocketRef.current.send(JSON.stringify({ iceCandidate: event.candidate }));
            }
        };
    };
  return (
    <div>RecieverPage</div>
  )
}

export default RecieverPage