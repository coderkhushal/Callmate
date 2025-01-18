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
	ConnRoomMap        map[string][]string
}

func NewRoomMap() RoomMap {
	r := RoomMap{
		Mutex:              sync.RWMutex{},
		RoomParticipantMap: make(map[string][]Participant),
		ConnRoomMap:        make(map[string][]string),
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
		return
	}
	for _, participant := range r.RoomParticipantMap[roomId] {
		if participant.Conn.LocalAddr().String() == conn.LocalAddr().String() {

			return
		}
	}

	r.RoomParticipantMap[roomId] = append(r.RoomParticipantMap[roomId], p)
	r.ConnRoomMap[conn.LocalAddr().String()] = append(r.ConnRoomMap[conn.LocalAddr().String()], roomId)
	fmt.Printf("%s inserted in room %s \n", conn.LocalAddr().String(), roomId)
	fmt.Printf("length of room is %s is %d \n", roomId, len(r.RoomParticipantMap[roomId]))
}

func (r *RoomMap) RemoveFromRoom(roomId string, conn *websocket.Conn) {
	participants, ok := r.RoomParticipantMap[roomId]
	if !ok {
		fmt.Printf("room (%s) does not exists ", roomId)
		return
	}
	rooms, ok := r.ConnRoomMap[conn.LocalAddr().String()]
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
	r.ConnRoomMap[conn.LocalAddr().String()] = temp

	tempparticipants := []Participant{}
	for _, participant := range participants {
		if participant.Conn != conn {
			tempparticipants = append(tempparticipants, participant)
		}
	}
	if len(tempparticipants) > 0 {

		r.RoomParticipantMap[roomId] = tempparticipants
	} else {
		r.DeleteRoom(roomId)
	}
}
func (r *RoomMap) DeleteRoom(roomId string) {
	r.Mutex.Lock()
	defer r.Mutex.RUnlock()
	participants := r.RoomParticipantMap[roomId]
	for _, participant := range participants {
		leftrooms := []string{}

		for _, room := range r.ConnRoomMap[participant.Conn.LocalAddr().String()] {
			if room != roomId {
				leftrooms = append(leftrooms, room)
			}
		}

		if (len(leftrooms)) != 0 {
			r.ConnRoomMap[participant.Conn.LocalAddr().String()] = leftrooms
		} else {
			delete(r.ConnRoomMap, participant.Conn.LocalAddr().String())
		}
	}

	delete(r.RoomParticipantMap, roomId)
}
