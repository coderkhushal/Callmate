package main

import (
	"log"
	"net/http"

	"github.com/pion/webrtc/v3"
	"golang.org/x/net/websocket"
)

var (
	server               *Server
	peerConnectionConfig = webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.stunprotocol.org"},
			},
		},
	}
)

func main() {

	server = NewWsServer()
	http.HandleFunc("/create", CreateRoomHandler)
	http.Handle("/join", websocket.Handler(server.handleWs))
	http.HandleFunc("/broadcast", BroadCastStreamHandler)
	http.HandleFunc("/recieve", RecieveStreamHandler)
	log.Fatal(http.ListenAndServe(":5000", nil))
}
