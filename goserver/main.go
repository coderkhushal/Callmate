package main

import (
	"log"
	"net/http"
)

func main() {
	Allrooms = NewRoomMap()
	http.HandleFunc("/create", CreateRoomHandler)
	http.HandleFunc("/join", JoinRoomHandler)
	log.Fatal(http.ListenAndServe(":5000", nil))
}
