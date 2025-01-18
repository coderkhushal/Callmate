package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Participant struct {
	Host bool
	Conn *websocket.Conn
}

type RoomMap struct {
	Mutex              sync.RWMutex
	RoomParticipantMap map[string][]Participant
	ConnRoomMap        map[*websocket.Conn][]string
}

func NewRoomMap() RoomMap {
	r := RoomMap{
		Mutex:              sync.RWMutex{},
		RoomParticipantMap: make(map[string][]Participant),
		ConnRoomMap:        make(map[*websocket.Conn][]string),
	}
	return r
}

func (r *RoomMap) CreateRoom() string {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	rand.Seed(time.Now().UnixNano())

	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	b := make([]rune, 9)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	roomId := string(b)

	r.RoomParticipantMap[roomId] = []Participant{}
	return roomId

}
func (r *RoomMap) CreateRoomWithRoomId(roomId string) {
	r.RoomParticipantMap[roomId] = []Participant{}
}
func (r *RoomMap) GetParticipants(roomId string) []Participant {
	r.Mutex.RLock()
	defer r.Mutex.RUnlock()

	return r.RoomParticipantMap[roomId]
}

func (r *RoomMap) InsertIntoRoom(roomId string, host bool, conn *websocket.Conn) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()
	p := Participant{
		Conn: conn,
		Host: host,
	}
	if _, ok := r.RoomParticipantMap[roomId]; !ok {
		r.CreateRoomWithRoomId(roomId)

	}
	for _, participant := range r.RoomParticipantMap[roomId] {
		if participant.Conn == conn {

			return
		}
	}

	r.RoomParticipantMap[roomId] = append(r.RoomParticipantMap[roomId], p)
	r.ConnRoomMap[conn] = append(r.ConnRoomMap[conn], roomId)
	fmt.Printf("%s inserted in room %s \n", conn.RemoteAddr().String(), roomId)
	fmt.Printf("length of room is %s is %d \n", roomId, len(r.RoomParticipantMap[roomId]))
}

func (r *RoomMap) RemoveFromRoom(roomId string, conn *websocket.Conn) {
	participants, ok := r.RoomParticipantMap[roomId]
	if !ok {
		fmt.Printf("room (%s) does not exists ", roomId)
		return
	}
	rooms, ok := r.ConnRoomMap[conn]
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
	r.ConnRoomMap[conn] = temp

	tempparticipants := []Participant{}
	for _, participant := range participants {
		if participant.Conn != conn {
			tempparticipants = append(tempparticipants, participant)
		}
	}
	if len(tempparticipants) > 0 {

		r.RoomParticipantMap[roomId] = tempparticipants
	} else {
		fmt.Printf("room %s deletd", roomId)
		r.DeleteRoom(roomId)
	}
}
func (r *RoomMap) DeleteRoom(roomId string) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()
	participants := r.RoomParticipantMap[roomId]
	for _, participant := range participants {
		leftrooms := []string{}

		for _, room := range r.ConnRoomMap[participant.Conn] {
			if room != roomId {
				leftrooms = append(leftrooms, room)
			}
		}

		if (len(leftrooms)) != 0 {
			r.ConnRoomMap[participant.Conn] = leftrooms
		} else {
			delete(r.ConnRoomMap, participant.Conn)
		}
	}

	delete(r.RoomParticipantMap, roomId)
}
