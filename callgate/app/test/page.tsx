"use client"
const SERVER = process.env.NEXT_PUBLIC_SERVER
import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

const Room = () => {
    // const userVideo = useRef<HTMLVideoElement>(null);
    // const userStream = useRef<MediaStream | null>(null);
    // const partnerVideo = useRef<HTMLVideoElement>(null);
    // const peerRef = useRef<RTCPeerConnection | null>(null);
    // const webSocketRef = useRef<Socket | null>(null);

    // const openCamera = async () => {
    //     const constraints = {
    //         video: true,
    //         audio: true,
    //     };
    //     try {
    //         const stream = await navigator.mediaDevices.getUserMedia(constraints);
    //         if (userVideo.current) {
    //             userVideo.current.srcObject = stream;
    //         }
    //         userStream.current = stream;
    //     } catch (error) {
    //         console.error('Error accessing media devices.', error);
    //     }
    // };

    // useEffect(() => {
    //     const setupWebSocket = async () => {
    //         const roomID = location.pathname.split("/")[2];
    //         webSocketRef.current = io(SERVER + "/video")

    //         webSocketRef.current.emit("JOIN", { room:"abc", email:"a@gmail.com" });
    //         webSocketRef.current.emit("JOINROOM", { room: roomID }) ;

    //         webSocketRef.current.addEventListener("message", async (e) => {
    //             const message = JSON.parse(e.data);
    //             // Handle the message
    //         });
    //     };

    //     openCamera().then(setupWebSocket);

    //     return () => {
    //         webSocketRef.current?.close();
    //         userStream.current?.getTracks().forEach(track => track.stop());
    //     };
    // }, []);

    // return (
    //     <div>
    //         user

    //         <video ref={userVideo} autoPlay playsInline />
    //         partener
    //         <video ref={partnerVideo} autoPlay playsInline />
    //     </div>
    // );
    return (
        <div>
            
        </div>
    )
};

export default Room;