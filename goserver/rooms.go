package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"sync"
	"time"

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
	ConnServer         map[*websocket.Conn][]string
	broadCastch        chan broadCastMsg
}

func NewWsServer() Server {
	r := Server{
		Mutex:              sync.RWMutex{},
		RoomParticipantMap: make(map[string][]Participant),
		ConnServer:         make(map[*websocket.Conn][]string),
		broadCastch:        make(chan broadCastMsg),
	}
	return r
}

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
	return roomId

}
func (s *Server) CreateRoomWithRoomId(roomId string) {
	s.RoomParticipantMap[roomId] = []Participant{}
}
func (s *Server) GetParticipants(roomId string) []Participant {
	s.Mutex.RLock()
	defer s.Mutex.RUnlock()

	return s.RoomParticipantMap[roomId]
}

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
	s.ConnServer[conn] = append(s.ConnServer[conn], roomId)
	fmt.Printf("%s inserted in room %s \n", conn.RemoteAddr().String(), roomId)
	fmt.Printf("length of room %s is %d \n", roomId, len(s.RoomParticipantMap[roomId]))
}

func (s *Server) RemoveFromRoom(roomId string, conn *websocket.Conn) {
	participants, ok := s.RoomParticipantMap[roomId]
	if !ok {
		fmt.Printf("room (%s) does not exists ", roomId)
		return
	}
	rooms, ok := s.ConnServer[conn]
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
	s.ConnServer[conn] = temp

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
func (s *Server) DeleteRoom(roomId string) {
	s.Mutex.Lock()
	defer s.Mutex.Unlock()
	participants := s.RoomParticipantMap[roomId]
	for _, participant := range participants {
		leftrooms := []string{}

		for _, room := range s.ConnServer[participant.Conn] {
			if room != roomId {
				leftrooms = append(leftrooms, room)
			}
		}

		if (len(leftrooms)) != 0 {
			s.ConnServer[participant.Conn] = leftrooms
		} else {
			delete(s.ConnServer, participant.Conn)
		}
	}

	delete(s.RoomParticipantMap, roomId)
}

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
func (s *Server) readLoop(ws *websocket.Conn, roomId string) {
	buf := make([]byte, 2048)

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
