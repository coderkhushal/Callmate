"use client"
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { prisma } from '@/lib/db'
import { Socket, io } from "socket.io-client"
import { findRoom, finduserinRoom, joinroom } from '@/actions/room'
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@radix-ui/react-toast'
import { useJoinContext } from '@/context/JoinContext'
import { findUser } from '@/actions/user'
import { MessageType } from '@/types'
const SERVER = process.env.NEXT_PUBLIC_SERVER
const WaitingPage = ({ params }: { params: { code: string } }) => {
    const [loading, setloading] = useState<boolean>(true)
    const { isAdmin, checkadmin, currentuser, ValidateJoiningScreen, roomid } = useJoinContext()
    const user = useUser()
    const pathname = usePathname()
    const router = useRouter()

    const WebSocketRef = React.useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!SERVER) return
        console.log("connectig to server")

        // Check room exist, user exists, if user is admin ,update current user and roomid
        ValidateJoiningScreen(params.code).then(() => {

            setloading(false)

        })
        WebSocketRef.current = new WebSocket(SERVER + "/join?roomId=" + params.code)
        WebSocketRef.current.addEventListener("message", (msg: any) => {
            const data: { messageType: MessageType, payload: any } = JSON.parse(msg.data)
            switch (data.messageType) {
                case MessageType.OPERATION:
                    if (data.payload.admit) {
                        handleAdmit(data.payload)

                    }
                    else {
                        handleReject(data.payload)
                    }
            }})
            
            const handleAdmit = async (data: { room: string, email: string, roomid: string }) => {
    
                // if the email is not the same as the user email, return
                if (user.user?.emailAddresses[0].emailAddress != data.email) { return; }
    
                //DATABASE UPDATION TO JOIN USER IN ROOM
                let result = false;
                // todo: minimise this database call using currentuser
                let cuser = await findUser(data.email)
                console.log(cuser)
    
                if (cuser && data.roomid) {
                    result = await joinroom(data.roomid, cuser)
                }
                // if user joined in room updated in database then only user can join the room
                if (result) {
                    // if the user is admitted, disconnect the socket and update the database
                    WebSocketRef.current?.close()
                    router.push("/" + data.room)
                }
                else {
                    alert("Error joining the room , because of database error , maybe you are not authenticated to database")
                }
    
    
            }
    
            const handleReject = (data: { route: string, email: string }) => {
                // if the email is not the same as the user email, return
                if (user.user?.emailAddresses[0].emailAddress != data.email) { return; }
                toast({
                    title: data.email + " was rejected",
                    action: <ToastAction altText="Try again" onClick={requestjoin}>Try again</ToastAction>
                })
            }
        return () => {  
            WebSocketRef.current?.close()
            WebSocketRef.current = null
        }
    }, [SERVER, user.user])


    const requestjoin = async () => {
        if (!currentuser) { alert("current user not found "); return; }
        if (isAdmin) {
            router.push("/" + pathname.split("/")[1])
            return;
        }

        //MAYBE ADMIN HAS ALREADY ADMITTED THE USER
        if (roomid) {

            let exisitingroom = await finduserinRoom(roomid, currentuser)
            if (exisitingroom) {
                router.push("/" + pathname.split("/")[1]);
                return;
            }
        }
        else {
            alert("roomid not found asking admin for permission")
        }
        WebSocketRef.current?.send(JSON.stringify(
            {
                messageType: MessageType.OPERATION,
                payload: { 
                    request: true, 
                    room: pathname.split("/")[1],
                    email: user.user?.emailAddresses[0].emailAddress
                }
             }
        ))
        
    }
    return (
        <div>
            <Button onClick={requestjoin} disabled={loading}>
                Join
            </Button>
        </div>
    )
}

export default WaitingPage