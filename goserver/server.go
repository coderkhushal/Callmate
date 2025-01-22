package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/pion/webrtc/v3"
	"golang.org/x/net/websocket"
)

type broadCastMsg struct {
	Message []byte
	client  *websocket.Conn
	RoomId  string
}
type Participant struct {
	Host bool
	Conn *websocket.Conn
}
type Server struct {
	Mutex              sync.RWMutex
	RoomParticipantMap map[string][]Participant
	ConnServerMap      map[*websocket.Conn][]string
	RoomStreamMap      map[string]*SFU
	broadCastch        chan broadCastMsg
}

// returns a new Server
func NewWsServer() *Server {
	r := &Server{
		Mutex:              sync.RWMutex{},
		RoomParticipantMap: make(map[string][]Participant),
		ConnServerMap:      make(map[*websocket.Conn][]string),
		RoomStreamMap:      make(map[string]*SFU),
		broadCastch:        make(chan broadCastMsg),
	}
	return r
}

// creates a room by generating a random 9 character unique
// roomId and initialise empty participants list in the room
func (s *Server) CreateRoom() string {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()

	rand.Seed(time.Now().UnixNano())

	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	b := make([]rune, 9)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	roomId := string(b)

	s.RoomParticipantMap[roomId] = []Participant{}
	s.RoomStreamMap[roomId] = CreateNewSFU()
	return roomId

}

// creates a room with given roomId and initialise
// room as a empty list of participants
func (s *Server) CreateRoomWithRoomId(roomId string) {
	s.RoomParticipantMap[roomId] = []Participant{}
	s.RoomStreamMap[roomId] = CreateNewSFU()
}

// returns the participants inside room
func (s *Server) GetParticipants(roomId string) []Participant {
	s.Mutex.RLock()
	defer s.Mutex.RUnlock()

	return s.RoomParticipantMap[roomId]
}

// inserts the user into room with given roomId , if room does
// not exists create the room and then inserts the participants
func (s *Server) InsertIntoRoom(roomId string, host bool, conn *websocket.Conn) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	p := Participant{
		Conn: conn,
		Host: host,
	}
	if _, ok := s.RoomParticipantMap[roomId]; !ok {
		s.CreateRoomWithRoomId(roomId)

	}
	for _, participant := range s.RoomParticipantMap[roomId] {
		if participant.Conn == conn {

			return
		}
	}

	s.RoomParticipantMap[roomId] = append(s.RoomParticipantMap[roomId], p)
	s.ConnServerMap[conn] = append(s.ConnServerMap[conn], roomId)
	fmt.Printf("%s inserted in room %s \n", conn.RemoteAddr().String(), roomId)
	fmt.Printf("length of room %s is %d \n", roomId, len(s.RoomParticipantMap[roomId]))
}

// remove the participant from room with given roomId
func (s *Server) RemoveFromRoom(roomId string, conn *websocket.Conn) {
	participants, ok := s.RoomParticipantMap[roomId]
	if !ok {
		fmt.Printf("room (%s) does not exists ", roomId)
		return
	}
	rooms, ok := s.ConnServerMap[conn]
	if !ok {
		fmt.Printf(" (%s) is not joined in any room ", conn.LocalAddr().String())
		return
	}

	temp := []string{}
	for _, room := range rooms {
		if room != roomId {
			temp = append(temp, room)
		}
	}
	s.ConnServerMap[conn] = temp

	tempparticipants := []Participant{}
	for _, participant := range participants {
		if participant.Conn != conn {
			tempparticipants = append(tempparticipants, participant)
		}
	}
	if len(tempparticipants) > 0 {

		s.RoomParticipantMap[roomId] = tempparticipants
	} else {
		fmt.Printf("room %s deletd", roomId)
		s.DeleteRoom(roomId)
	}
}

// delete the room with given roomId
func (s *Server) DeleteRoom(roomId string) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	participants := s.RoomParticipantMap[roomId]
	go func() {
		fmt.Println("database called to delete the room \n ")
	}()
	for _, participant := range participants {
		leftrooms := []string{}

		for _, room := range s.ConnServerMap[participant.Conn] {
			if room != roomId {
				leftrooms = append(leftrooms, room)
			}
		}

		if (len(leftrooms)) != 0 {
			s.ConnServerMap[participant.Conn] = leftrooms
		} else {
			delete(s.ConnServerMap, participant.Conn)

		}

	}

	delete(s.RoomParticipantMap, roomId)
	delete(s.RoomStreamMap, roomId)
}

// broadcast the message to all users inside the message.room
func (s *Server) broadcaster() {
	for {
		msg := <-s.broadCastch

		for _, client := range s.RoomParticipantMap[msg.RoomId] {
			if client.Conn == msg.client {
				fmt.Println("samee client")
				continue
			}

			// if err != nil {
			// 	fmt.Println("error serialising message to json \n")
			// 	continue
			// }

			if _, err := client.Conn.Write(msg.Message); err != nil {
				log.Println("write error", err)

				s.RemoveFromRoom(msg.RoomId, client.Conn)
				client.Conn.Close()
				break
			}

		}
	}
}

// handler for websocket endopint
func (s *Server) handleWs(ws *websocket.Conn) {
	fmt.Println("new incoming connection from client ", ws.RemoteAddr())
	request := ws.Request()
	query := request.URL.Query()
	roomId := query.Get("roomId")

	if len(roomId) == 0 {
		fmt.Println("no room id round")
		return
	}
	s.InsertIntoRoom(roomId, false, ws)
	s.readLoop(ws, roomId)

	defer func() {
		fmt.Printf("(%s) left \n", ws.RemoteAddr())
		s.RemoveFromRoom(roomId, ws)
		ws.Close()
	}()
}

// reads the websocket messages and pushes them into
// broadcasting channel for broadcaster to pick up
func (s *Server) readLoop(ws *websocket.Conn, roomId string) {
	buf := make([]byte, 100000000)

	go s.broadcaster()
	for {
		var msg broadCastMsg
		n, err := ws.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("read error \n", err)
			continue
		}
		message := buf[:n]
		msg.Message = message
		msg.client = ws
		msg.RoomId = roomId
		a := make(map[string]interface{})
		json.Unmarshal(message, &a)
		msg.Message, _ = json.Marshal(a)
		s.broadCastch <- msg

	}
}

// create a new webrtc peer connection
func (s *Server) createPeerConnection() (*webrtc.PeerConnection, error) {
	peerConnection, err := webrtc.NewPeerConnection(peerConnectionConfig)

	if err != nil {
		return nil, err
	}
	peerConnection.OnICECandidate(func(i *webrtc.ICECandidate) {
		if i == nil {
			return
		}
		fmt.Println("ice candidate found \n")
		sendIceCandidateToRemotePeer(i.ToJSON())
	})
	handleIncomingICECandidates(peerConnection)
	return peerConnection, nil
}

func sendIceCandidateToRemotePeer(candidate webrtc.ICECandidateInit) {

}
func handleIncomingICECandidates(peerConnection *webrtc.PeerConnection) {

}

// set the incoming sdp offer as peer remote description , then creates
// answer to the sdp offer and return the answer
func (s *Server) ExchangeSDP(offer webrtc.SessionDescription, peerConnection *webrtc.PeerConnection) (*webrtc.SessionDescription, error) {
	if err := peerConnection.SetRemoteDescription(offer); err != nil {
		fmt.Printf("error setting remote description %s \n", err)
		return nil, err
	}

	answer, err := peerConnection.CreateAnswer(nil)
	if err != nil {
		fmt.Printf("error while creating answer %s \n", err)
		return nil, err
	}
	if err = peerConnection.SetLocalDescription(answer); err != nil {
		return nil, err
	}
	return &answer, nil

}

// insert peerconnection track to room tracks
func (s *Server) InsertBroadcastingTrack(peerConnection *webrtc.PeerConnection, roomId string) {

	peerConnection.OnTrack(func(track *webrtc.TrackRemote, reciever *webrtc.RTPReceiver) {
		fmt.Println("added track to consumers")
		s.RoomStreamMap[roomId].TrackBroadCast(track)
	})

}

func (s *Server) RemoveWebRTCPeer(roomId string, conn *webrtc.PeerConnection) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	s.RoomStreamMap[roomId].RemoveConsumer(conn)
}
