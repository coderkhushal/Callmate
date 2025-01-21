package main

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

func CreateRoomHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	roomId := CreateRoomCode()
	type resp struct {
		RoomId string `json:"room_id"`
	}

	json.NewEncoder(w).Encode(resp{
		RoomId: roomId,
	})
}

func CreateRoomCode() string {
	rand.Seed(time.Now().UnixNano())

	var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	b := make([]rune, 9)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	roomId := string(b)

	return roomId

}
