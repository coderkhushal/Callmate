package main

import (
	"log"
	"net/http"

	"golang.org/x/net/websocket"
)

func main() {

	server := NewWsServer()
	http.HandleFunc("/create", CreateRoomHandler)
	// http.HandleFunc("/join", JoinRoomHandler)
	http.Handle("/join", websocket.Handler(server.handleWs))
	log.Fatal(http.ListenAndServe(":5000", nil))
}

// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// package main

// import (
// 	"flag"
// 	"log"
// 	"net/http"
// )

// var addr = flag.String("addr", ":8080", "http service address")

// func main() {
// 	flag.Parse()
// 	hub := newHub()
// 	go hub.run()

// 	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
// 		serveWs(hub, w, r)
// 	})
// 	err := http.ListenAndServe(*addr, nil)
// 	if err != nil {
// 		log.Fatal("ListenAndServe: ", err)
// 	}
// }
