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
    };       
        startAccepting()
        WebsocketRef.current.addEventListener("message", async (event)=>{
            const message = JSON.parse(event.data)
            console.log(message)
            if(message.ice){
            console.log("ice candidate recieved")
            PeerRef.current?.addIceCandidate(new RTCIceCandidate(message.ice)).catch(err =>{
            console.log("error while adding ice candidate " , err)
            })
        }
        else if(message.sdp){
            console.log("sdp recieved")
            await PeerRef.current?.setRemoteDescription(new RTCSessionDescription(message.sdp)).catch(err =>{
            console.log("error while setting remote description")
            })
            const ans = await PeerRef.current?.createAnswer()
            await PeerRef.current?.setLocalDescription(ans)
            WebsocketRef.current?.send(JSON.stringify({sdp: ans}))


        }
        })
    return (()=>{
        WebsocketRef.current?.close()
    })
    },[SERVER])

    const startAccepting = async()=>{
        PeerRef.current  = createPeer()
        PeerRef.current?.addTransceiver("video", {direction: "recvonly"})
        
    }
    const createPeer = (): (RTCPeerConnection | null ) =>{
        try{
            const peer = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
            });
            peer.ontrack = handleTrackEvent
            return peer
        }
        catch(er){
            console.log("error while creating peer " , er)
            return null
        }
    }
    const handleTrackEvent= (event : RTCTrackEvent) =>{
        const VideoElement = document.getElementById("incomingvideo") as HTMLVideoElement
        VideoElement.srcObject = new MediaStream([event.track])
        VideoElement.play()
    }
  return (
    <div>
        RecieverPage
        <video id="incomingvideo"></video>
    </div>
  )
}

export default RecieverPage