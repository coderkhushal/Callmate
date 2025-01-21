"use client"
import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteRoom, findRoom } from '@/actions/room'
import { UserButton, useUser } from '@clerk/nextjs'
import { useJoinContext } from '@/context/JoinContext'
import { IceCream, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import MessageMain from '@/components/Chatting/MessageMain'
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@radix-ui/react-toast'
import { MessageType } from '@/types'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {
  const user = useUser()
  const router = useRouter()

  const pathname = usePathname()



  const { isAdmin, currentuser, roomid, secure, setsecure, setisAdmin } = useJoinContext()
  const [loading, setloading] = useState<boolean>(false)
  const [callmessages, setcallmessages] = useState<{ mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[]>([])


  // VIDEO CALLING SERVICE 
  const userVideo = React.useRef<HTMLVideoElement>(null)
  const userStream = useRef<MediaStream | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const partnerVideo = React.useRef<HTMLVideoElement>(null)
  const WebSocketRef = useRef<WebSocket | null>(null)

  const togglevideo = async () => {
    if (userStream.current) {

      userStream.current.getTracks().forEach((track: any) => track.stop())
      if (userVideo.current) {
        userVideo.current.srcObject = null
      }
      userStream.current = null
    }
    else {
      if (!userVideo.current) return;

      // creating a stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      //rendering user video
      userVideo.current.srcObject = stream
      userStream.current = stream
      callUser()
    }
  }

  const registerChat = (payload: any) => {
    if (payload.join) {
      toast({
        title: payload.email + " joined",
        action: <ToastAction altText="" onClick={() => { }}>Ok</ToastAction>
      })
    }
    if (payload.message) [
      updatechat(payload)
    ]
  }
  const registerOperations = (payload: any) => {
    if (payload.endcall) {

      setsecure(false)
      if (isAdmin) {

      }
      else {
        alert("admin ended the call for everyone")
        router.push("join")
      }
      setisAdmin(false)
    }
    else if (payload.request && isAdmin) {

      alert("user want to join the room")

      let result = confirm("do you want to admit the user" + payload.email + " ?")
      if (result) {
        admit(payload.email)
      }
      else {
        reject(payload.email)

      }
    }
  }
  const registerVideo = (payload: any) => {
    if (payload.join) {
      callUser()
    }
    else if (payload.offer) {
      handleOffer(payload.offer)
    }
    else if (payload.iceCandidate) {

      peerRef.current?.addIceCandidate(new RTCIceCandidate(payload.iceCandidate));
    }
    else if (payload.answer) {

      peerRef.current?.setRemoteDescription(new RTCSessionDescription(payload.answer));
    }
  }
  useEffect(() => {
    // If the use is not admin only then check the admin status

    WebSocketRef.current = new WebSocket(SERVER + "/join?roomId=" + pathname.split("/")[1])

    WebSocketRef.current.addEventListener("message", (msg: any) => {
      console.log(msg.data)
      const data: { messageType: MessageType, payload: any } = JSON.parse(msg.data)
      
      switch (data.messageType) {
        case MessageType.CHAT:
          registerChat(data.payload)
          break;
        case MessageType.VIDEO:
          registerVideo(data.payload)
          break;
        case MessageType.OPERATION:
          registerOperations(data.payload)
      }
    })



    return (() => {
      WebSocketRef.current?.close()
      WebSocketRef.current = null
    })
  },[SERVER])

  useEffect(() => {

    if (!secure) {
      router.push("/" + pathname.split("/")[1] + "/join")
    }
  }, [secure, user.user, roomid])

  // JOINING SOCKER CONNECTIONS
  // admin actions - admit
  const admit = (useremail: string) => {
    console.log(useremail + " admitting")

    WebSocketRef?.current?.send(JSON.stringify({
      messageType: MessageType.OPERATION,
      payload: {
        admit: true,
        room: pathname.split("/")[1],
        email: useremail, roomid: roomid
      }
    }))

  }
  // admin actions - reject
  const reject = (useremail: string) => {

    WebSocketRef?.current?.send(JSON.stringify({
      messageType: MessageType.OPERATION,
      payload: {
        reject: true,
        room: pathname.split("/")[1],
        email: useremail, roomid: roomid
      }
    }))
  }



  // CHATTING 
  const sendmessage = async (message: string) => {
    if (!WebSocketRef.current || message == "") return;

    WebSocketRef.current.send(JSON.stringify(
      {
        messageType: MessageType.CHAT,
        payload: {
          
          room: pathname.split("/")[1],
          id: user.user?.emailAddresses[0].emailAddress,
          message: message,
          imgUrl: user.user?.imageUrl
        }
      }))
    setcallmessages(value => [...value, { mode: "SENDING", message: message, imgUrl: user.user?.imageUrl }])
  }


  async function updatechat(data: { id: string, room: string, message: string, imgUrl?: string }) {
    if (data.id == user.user?.emailAddresses[0].emailAddress) return;
    setcallmessages(prevMessages => [
      ...prevMessages,
      { mode: "RECIEVING", message: data.message, imgUrl: data.imgUrl }
    ]);

  }

  const endCall = async () => {
    if (!WebSocketRef.current) {
      alert("wait for 2-3 seconds , sockets are not initialised")
      return;
    }
    const roomcode = pathname.split("/")[1]

    let result = await deleteRoom(roomcode)
    if (result) {
      WebSocketRef.current.send(JSON.stringify(
        {
          messageType: MessageType.OPERATION,
          payload: {
            endcall: true,
            room: roomcode
          }
        }
      ))
      setsecure(false)
      setisAdmin(false)
      router.push("/main")
    }
    else {
      alert("Error Deleting Room")
    }

  }

  // LEAVING CALL - ANYONE
  const leavecall = () => {
    //sockeet disconnect and redirect to main page
    setsecure(false)
    WebSocketRef.current?.close()
    router.push("/main")

  }

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log("Received Offer, Creating Answer");
    if (!userStream.current) {
      console.log("User Stream not found");
      return
    }
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    await userStream.current?.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, userStream.current!);
    });

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    WebSocketRef.current?.send(JSON.stringify(
      {
        messageType: MessageType.VIDEO,
        payload: {
          offer: true, 
          room: pathname.split("/")[1],
          answer: peerRef.current.localDescription
        }
      }
    ))
  };
  const callUser = async () => {
    console.log("Calling Other User");
    if (userStream.current) {

      peerRef.current = createPeer();

      userStream.current.getTracks().forEach(async (track) => {
        peerRef.current?.addTrack(track, userStream.current!);
      });
    }
    else {
      console.log("User Stream not found");
    }
  };
  const createPeer = () => {
    console.log("Creating Peer Connection");
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onnegotiationneeded = handleNegotiationNeeded;
    peer.onicecandidate = handleIceCandidateEvent;
    peer.ontrack = handleTrackEvent;

    return peer;
  };
  const handleNegotiationNeeded = async () => {
    console.log("Creating Offer");

    try {
      const myOffer = await peerRef.current?.createOffer();
      await peerRef.current?.setLocalDescription(myOffer);
      WebSocketRef?.current?.send(JSON.stringify({
        answer: true, 
        messageType: MessageType.VIDEO,
        payload: {

          offer: peerRef.current?.localDescription
        }
      }))
    } catch (err) { }
  };

  const handleIceCandidateEvent = async (e: RTCPeerConnectionIceEvent) => {
    console.log("Found Ice Candidate");
    if (e.candidate) {
      console.log(e.candidate);

      WebSocketRef?.current?.send(JSON.stringify({

        messageType: MessageType.VIDEO,
        payload: {
          
          iceCandidate: e.candidate
        }
      }))
    }

  };

  const handleTrackEvent = (e: RTCTrackEvent) => {
    console.log("Received Tracks");
    console.log(e.streams)
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = e.streams[0];
    }
  };



  return (
    <div className='flex flex-col   h-screen'>
      <div className="flex justify-between items-center p-4 bg-gray-100">
        <h1 className="text-3xl font-semibold text-gray-800">CallChat</h1>
        <div className="flex space-x-4">
          <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none">
            <UserButton />
          </button>
          {/* Add other buttons */}
        </div>
      </div>

      <div className='flex h-4/5'>


        {/* messages section  */}

        <div className='hidden lg:block'>
          <MessageMain sendmessage={sendmessage} callmessages={callmessages} />

        </div>
        <div className="w-full h-4/6 sm:space-y-4 md:space-y-4 md:grid lg:grid lg:grid-cols-3 md:grid-cols-2 sm:flex justify-center items-center p-5 overflow-y-auto ">

          <video ref={userVideo} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>
          <video ref={partnerVideo} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-blue-200"></video>


        </div>
      </div>






      {/* controls  */}
      <div className='flex absolute bottom-0 justify-between p-5 w-full bg-gray-200  mt-2 space-x-4'>

        {/* Video controls */}

        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
          {!userStream.current?.active ? <VideoOff /> : <Video />}
        </button>

        {/* audio controls  */}
        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
          {userStream.current?.active ? <Mic /> : <MicOff />}
        </button>




        {/* User controls */}

        <button onClick={leavecall} disabled={loading} className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 flex justify-center text-white font-semibold rounded-md focus:outline-none">
          <PhoneOff />
        </button>




        {/* Admin controls */}
        {isAdmin && (

          <button onClick={endCall} disabled={loading} className="w-full py-2 px-4 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-md focus:outline-none text-center">
            End Call
          </button>
        )}


      </div>



    </div>
  )
}

export default CallingPage