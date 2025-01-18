package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	Allrooms RoomMap
)

func CreateRoomHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	roomId := Allrooms.CreateRoom()
	type resp struct {
		RoomId string `json:"room_id"`
	}

	json.NewEncoder(w).Encode(resp{
		RoomId: roomId,
	})
}

type broadCastMsg struct {
	Message map[string]interface{}
	client  *websocket.Conn
	RoomId  string
}

var broadcastch = make(chan broadCastMsg)

func broadcast() {
	for {

		msg := <-broadcastch
		for _, client := range Allrooms.RoomParticipantMap[msg.RoomId] {
			if client.Conn == msg.client {
				continue
			}

			if err := client.Conn.WriteJSON(msg.Message); err != nil {
				Allrooms.RemoveFromRoom(msg.RoomId, client.Conn)

				log.Fatal(err)
				client.Conn.Close()
			}

		}
	}
}

func JoinRoomHandler(w http.ResponseWriter, r *http.Request) {
	roomId, ok := r.URL.Query()["roomId"]
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		type resp struct {
			E string `json:"error"`
		}
		json.NewEncoder(w).Encode(resp{
			E: "roomId not found",
		})
		return
	}
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("websocket upgrade error", err)
	}
	Allrooms.InsertIntoRoom(roomId[0], false, ws)

	for {
		var msg broadCastMsg
		err := ws.ReadJSON(&msg.Message)
		if err != nil {
			if err == websocket.ErrCloseSent {
				Allrooms.RemoveFromRoom(roomId[0], ws)
				ws.Close()
				continue
			}
			log.Println("read error :", err)
		}
		msg.client = ws
		msg.RoomId = roomId[0]

		log.Println(msg.Message)

		broadcastch <- msg

	}

}
