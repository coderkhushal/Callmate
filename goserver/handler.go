package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/pion/webrtc/v3"
)

type ErrResponse struct {
	Error string `json:"error"`
}

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
func BroadCastStreamHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	query := r.URL.Query()
	roomId := query.Get("roomId")
	if len(roomId) != 9 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrResponse{
			Error: "incorrect or missing roomId",
		})
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(
			ErrResponse{
				Error: " error reading request body ",
			})
		return
	}
	var a map[string]webrtc.SessionDescription
	err = json.Unmarshal(body, &a)

	if err != nil {

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(
			ErrResponse{
				Error: " error reading request body ",
			})
		return
	}

	peerConnection, err := server.createPeerConnection()

	if err != nil {
		response := ErrResponse{
			Error: fmt.Sprintf(" error inititalising peerconnection %s", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		fmt.Printf(response.Error)
		return
	}
	answer, err := server.ExchangeSDP(a["sdp"], peerConnection)
	if err != nil {

		response := ErrResponse{
			Error: fmt.Sprintf(" error creating answer %s", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		fmt.Printf(response.Error)
		return
	}
	server.InsertBroadcastingTrack(peerConnection, roomId)
	w.WriteHeader(http.StatusAccepted)

	json.NewEncoder(w).Encode(answer)
	return
}
func RecieveStreamHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	query := r.URL.Query()
	roomId := query.Get("roomId")
	if len(roomId) != 9 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrResponse{
			Error: "incorrect or missing roomId",
		})
		fmt.Println("incorrect or missing roomid \n")
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(
			ErrResponse{
				Error: " error reading request body ",
			})
		fmt.Printf("reading error %s \n", err)

		return
	}
	var a map[string]webrtc.SessionDescription

	err = json.Unmarshal(body, &a)

	if err != nil {

		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(
			ErrResponse{
				Error: " error reading request body ",
			})

		fmt.Printf("marshaling error %s \n", err)
		return
	}

	// fmt.Printf("%+v \n", a["sdp"]["sdp"])
	peerConnection, err := server.createPeerConnection()

	if err != nil {
		response := ErrResponse{
			Error: fmt.Sprintf(" error inititalising peerconnection %s", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		fmt.Printf(response.Error)
		return
	}
	answer, err := server.ExchangeSDP(a["sdp"], peerConnection)
	if err != nil {

		response := ErrResponse{
			Error: fmt.Sprintf(" error creating answer %s", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		fmt.Printf(response.Error)
		return
	}

	if err := server.RoomStreamMap[roomId].AddConsumer(peerConnection); err != nil {

		response := ErrResponse{
			Error: fmt.Sprintf(" error adding consumer: %s ", err),
		}
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		fmt.Printf("%s \n", response.Error)
		return
	}

	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(answer)

	return
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
