"use client"
import React, { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteRoom, findRoom } from '@/actions/room'
import { Socket, io } from "socket.io-client"
import { UserButton, useUser } from '@clerk/nextjs'
import { useJoinContext } from '@/context/JoinContext'
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import MessageMain from '@/components/Chatting/MessageMain'
<<<<<<< HEAD

const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {


  const user = useUser()
=======
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@radix-ui/react-toast'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const CallingPage = () => {
  const user = useUser()
  const router = useRouter()

  const pathname = usePathname()
>>>>>>> 44f1823 (webrtc changes)



  const { isAdmin, currentuser, roomid, secure, setsecure, setisAdmin } = useJoinContext()
  const [socket_chat, setsocket_chat] = useState<Socket | null>(null)
  const [socket_video, setsocket_video] = useState<Socket | null>(null)
  const [socket_join_admin, setsocket_join_admin] = useState<Socket | null>(null)
  const [loading, setloading] = useState<boolean>(false)
<<<<<<< HEAD
  const [mediastream, setmediastream] = useState<MediaStream | null>(null)
  const [callmessages, setcallmessages] = useState<{ mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[]>([])
  const [mediarec, setmediarec] = useState<MediaRecorder | null>(null)
  const [mymediasource, setmymediasource] = useState<MediaSource>(new MediaSource())
  const [videosource, setvideosource] = useState<SourceBuffer>()
  // VIDEO CALLING SERVICE 
  const videoref = React.useRef<HTMLVideoElement>(null)
  const incomingvideoref = React.useRef<HTMLVideoElement>(null)


  const togglevideo = async () => {
    if (mediastream) {

      mediastream.getTracks().forEach((track: any) => track.stop())
      if (videoref.current) {
        videoref.current.srcObject = null
      }
      setmediastream(null)

      setmediarec(null)
    }
    else {
      if (!videoref.current) return;

      // creating a stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setmediastream(value => stream)
      //showing it to user
      videoref.current.srcObject = stream
      // recording media
      const mediarectemp = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000

      })

      mediarectemp.ondataavailable = (e) => {
        socket_video?.emit("STREAM", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress, stream: e.data })

      }
      mediarectemp.start(2000)
      setmediarec(value => mediarectemp)
    }
  }

  const router = useRouter()
  const pathname = usePathname()


=======
  const [callmessages, setcallmessages] = useState<{ mode: "RECIEVING" | "SENDING", message: string, imgUrl?: string }[]>([])

  
  // VIDEO CALLING SERVICE 
  const userVideo = React.useRef<HTMLVideoElement>(null)
  const userStream = useRef<MediaStream | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const partnerVideo = React.useRef<HTMLVideoElement>(null)


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

>>>>>>> 44f1823 (webrtc changes)

  useEffect(() => {
    // If the use is not admin only then check the admin status

    if (!secure) {
      router.push("/" + pathname.split("/")[1] + "/join")
    }

    const _socket_chat = io(SERVER + "/chat")
<<<<<<< HEAD
    const _socket_join_admin = io(SERVER + "/join")
    const _socket_video = io(SERVER + "/video")

    if (!incomingvideoref.current) {
      return;
    }
    incomingvideoref.current.src = URL.createObjectURL(mymediasource);

    mymediasource.onsourceopen = () => {

      let videosourcetemp = mymediasource.addSourceBuffer("video/mp4; codecs=avc1.42E01E, mp4a.40.2")
      setvideosource((value) => videosourcetemp)
      
         // VIDEO ROOM SOCKETS FOR EVERYONE 
    _socket_video.on("STREAM", (data: {stream : ArrayBuffer})=>{
      if(mymediasource.readyState=="closed" || mymediasource.readyState=="ended") return;
      console.log("streaming recieving", data.stream)
      // videosource?.appendBuffer(data.stream)
      mymediasource.addSourceBuffer('video/webm; codecs="vorbis,vp8"')
      
       
    })



    }

 

    _socket_chat.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    setsocket_join_admin(_socket_join_admin)
    _socket_video.emit("JOIN", { email: user.user?.emailAddresses[0].emailAddress, room: pathname.split("/")[1] })
    setsocket_video(value => _socket_video)



    // CHATTING ROOM SOCKETS FOR EVERYONE
    _socket_chat.on("JOINED", (data: any) => {
      if (data.email != user.user?.emailAddresses[0].emailAddress) {
        // alert("user joined the room")
=======
    const _socket_video= io(SERVER + "/video")
    const _socket_join_admin = io(SERVER + "/join")


    _socket_video.emit("JOINROOM", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    _socket_video.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })

    _socket_video.on("JOIN", (data: { room: string,  email: string }) => {
      // if (data.email == user.user?.emailAddresses[0].emailAddress) {
        callUser()
      // }
    })
  _socket_video.on("OFFER", (data: { offer: RTCSessionDescriptionInit }) => {
    console.log("Received Offer, Creating Answer");
    handleOffer(data.offer)
  });
  _socket_video.on("ICECANDIDATE", (data: { iceCandidate: RTCIceCandidate }) => {
    console.log("Received Ice Candidate");
    peerRef.current?.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
  })
  _socket_video.on("ANSWER", (data: { answer: RTCSessionDescriptionInit }) => { 
    console.log("Received Answer");
    peerRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
  })
    setsocket_video(_socket_video)
  

    _socket_chat.emit("JOIN", { room: pathname.split("/")[1], email: user.user?.emailAddresses[0].emailAddress })
    setsocket_join_admin(_socket_join_admin)
    // CHATTING ROOM SOCKETS FOR EVERYONE

    _socket_chat.on("JOINED", (data: any) => {
      if (data.email != user.user?.emailAddresses[0].emailAddress) {

            toast({
                title: data.email + " joined",
                action: <ToastAction altText="" onClick={()=>{}}>Ok</ToastAction>
            })
>>>>>>> 44f1823 (webrtc changes)
      }
    })

    // END CALL FOR EVERYONE BY ADMIN
    _socket_chat.on("ENDCALL", () => {
      setsecure(false)
      if (isAdmin) {

      }
      else {
        alert("admin ended the call for everyone")
        router.push("join")
      }
      setisAdmin(false)
    })

<<<<<<< HEAD


    //JOINING CHAT ROOM - FOR ALL
    joinChatSocket()

    //RECIEVING MESSAGE
    _socket_chat.on("MESSAGE", (data) => updatechat(data))

=======
    //RECIEVING MESSAGE
    _socket_chat.on("MESSAGE", (data) => updatechat(data))
    //JOINING CHAT ROOM - FOR ALL
    joinChatSocket()
>>>>>>> 44f1823 (webrtc changes)
    setsocket_chat(_socket_chat)



    // JOINING ROOM FOR ADMIN SOCKETS
    if (isAdmin) {
<<<<<<< HEAD

      // for admin only - to admit user
      _socket_join_admin.emit("JOINROOM", { room: pathname.split("/")[1] })
    }

=======
      // for admin only - to admit user
      _socket_join_admin.emit("JOINROOM", { room: pathname.split("/")[1] })
    }
>>>>>>> 44f1823 (webrtc changes)
    // admin actions - REQUEST
    _socket_join_admin.on("REQUEST", (data: { room: string, email: string }) => {

      alert("user want to join the room")

      let result = confirm("do you want to admit the user" + data.email + " ?")
      if (result) {
        admit(_socket_join_admin, data.email)
      }
      else {
        reject(_socket_join_admin, data.email)

      }
    }
    )


    return (() => {
      _socket_chat.disconnect()
      _socket_join_admin.disconnect()
<<<<<<< HEAD

      _socket_video.disconnect()

    })
  }, [SERVER, user.user, currentuser,incomingvideoref, roomid, secure])
=======
    })
  }, [SERVER, user.user, currentuser,userVideo.current,  roomid, secure])
>>>>>>> 44f1823 (webrtc changes)

  // JOINING SOCKER CONNECTIONS
  // admin actions - admit
  const admit = (_socket_join_admin: Socket, useremail: string) => {
    console.log(useremail + " admitting")

    _socket_join_admin.emit("APPROVE", { room: pathname.split("/")[1], email: useremail, roomid: roomid })

  }
  // admin actions - reject
  const reject = (_socket_join_admin: Socket, useremail: string) => {
    _socket_join_admin.emit("REJECT", { room: pathname.split("/")[1], email: useremail })
  }


  //CHATTING SOCKET CONNECIONS

  // CHAT SOCKET JOINING 
  const joinChatSocket = async () => {
    if (!socket_chat) return;
    socket_chat.emit("JOIN", { room: pathname.split("/")[1] });
  }

  // CHATTING 
  const sendmessage = async (message: string) => {
    if (!socket_chat || message == "") return;

    socket_chat.emit("MESSAGE", { room: pathname.split("/")[1], id: user.user?.emailAddresses[0].emailAddress, message: message, imgUrl: user.user?.imageUrl })
    setcallmessages(value => [...value, { mode: "SENDING", message: message, imgUrl: user.user?.imageUrl }])
<<<<<<< HEAD


=======
>>>>>>> 44f1823 (webrtc changes)
  }


  async function updatechat(data: { id: string, room: string, message: string, imgUrl?: string }) {
<<<<<<< HEAD

    if (data.id == user.user?.emailAddresses[0].emailAddress) return;


=======
    if (data.id == user.user?.emailAddresses[0].emailAddress) return;
>>>>>>> 44f1823 (webrtc changes)
    setcallmessages(prevMessages => [
      ...prevMessages,
      { mode: "RECIEVING", message: data.message, imgUrl: data.imgUrl }
    ]);

  }

  // END CALL - ADMIN ONLY
  const endCall = async () => {
    if (!socket_chat) {
      alert("wait for 2-3 seconds , sockets are not initialised")
      return;
    }
    const roomcode = pathname.split("/")[1]

    let result = await deleteRoom(roomcode)
    if (result) {
      socket_chat?.emit("ENDCALL", { room: roomcode })
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
    socket_chat?.disconnect()
    socket_join_admin?.disconnect()
    router.push("/main")

  }
<<<<<<< HEAD
=======
  const handleOffer = async (offer:    RTCSessionDescriptionInit) => {
    console.log("Received Offer, Creating Answer");
    if(!userStream.current){
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

     socket_chat?.emit("ANSWER", { answer: answer });
};
  const callUser = async () => {
    console.log("Calling Other User");
    if(userStream.current){

      peerRef.current = createPeer();
      
      userStream.current.getTracks().forEach(async (track) => {
         peerRef.current?.addTrack(track, userStream.current!);
      });
    }
    else{
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

      socket_video?.emit("OFFER",{ offer: peerRef.current?.localDescription })
  } catch (err) {}
};

const handleIceCandidateEvent = async (e: RTCPeerConnectionIceEvent) => {
  console.log("Found Ice Candidate");
  if (e.candidate) {
      console.log(e.candidate);
       socket_video?.emit( "ICECANDIDATE",{iceCandidate: e.candidate}) 
  }
};

const handleTrackEvent = (e:RTCTrackEvent) => {
  console.log("Received Tracks");
  console.log(e.streams)
  if(partnerVideo.current){
    partnerVideo.current.srcObject = e.streams[0];
  }
};



>>>>>>> 44f1823 (webrtc changes)
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

<<<<<<< HEAD
          <video ref={incomingvideoref} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>
          <video ref={videoref} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>
=======
          <video ref={userVideo} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-black"></video>
          <video ref={partnerVideo} autoPlay muted className="w-60 shadow-xl  h-46 border-4 border-blue-200"></video>
>>>>>>> 44f1823 (webrtc changes)


        </div>
      </div>






      {/* controls  */}
      <div className='flex absolute bottom-0 justify-between p-5 w-full bg-gray-200  mt-2 space-x-4'>

        {/* Video controls */}

        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
<<<<<<< HEAD
          {mediastream ? <VideoOff /> : <Video />}
=======
          {!userStream.current?.active ? <VideoOff /> : <Video />}
>>>>>>> 44f1823 (webrtc changes)
        </button>

        {/* audio controls  */}
        <button onClick={togglevideo} className="w-full py-2 px-4 bg-green-500 hover:bg-green-400 text-white  flex justify-center font-semibold rounded-md focus:outline-none">
<<<<<<< HEAD
          {mediastream ? <Mic /> : <MicOff />}
=======
          {userStream.current?.active  ? <Mic /> : <MicOff />}
>>>>>>> 44f1823 (webrtc changes)
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