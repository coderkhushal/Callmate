package main

import (
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
)

type SFU struct {
	Consumers []*webrtc.PeerConnection
	Tracks    []*webrtc.TrackRemote
	mutex     sync.Mutex
}

func CreateNewSFU() *SFU {
	return &SFU{
		Consumers: []*webrtc.PeerConnection{},
		Tracks:    []*webrtc.TrackRemote{},
	}
}

// this function takes track and broadcast it to all consumers in the room
func (s *SFU) TrackBroadCast(track *webrtc.TrackRemote) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.Tracks = append(s.Tracks, track)

	for _, consumer := range s.Consumers {
		if err := s.AddTrackToConsumer(track, consumer); err != nil {

			log.Printf("%s \n", err)
			return err
		}
	}

	return nil
}

// add the track to consumer peerconnection by sending datapackats
// to the consumer websocket peer connection
func (s *SFU) AddTrackToConsumer(track *webrtc.TrackRemote, consumer *webrtc.PeerConnection) error {
	localtrack, err := webrtc.NewTrackLocalStaticRTP(
		track.Codec().RTPCodecCapability,
		track.ID(),
		track.StreamID(),
	)
	if err != nil {
		fmt.Printf("error creating localtrack %s \n", err)
		return err
	}
	_, err = consumer.AddTrack(localtrack)
	if err != nil {

		fmt.Printf("error adding track %s \n", err)
		return err
	}

	// forward packets from broadcaster to consumer
	go func() {
		buffer := make([]byte, 1500)
		n, _, err := track.Read(buffer)
		if err != nil {
			fmt.Printf("error reading track %s \n", err)
			return
		}
		if _, writeErr := localtrack.Write(buffer[:n]); writeErr != nil {
			fmt.Printf("write error to localtrack %s \n", writeErr)
			return

		}

	}()
	return nil

}
func (s *SFU) AddConsumer(consumer *webrtc.PeerConnection) error {
	if s == nil {
		return fmt.Errorf("SFU instance is nil")
	}
	if consumer == nil {
		return fmt.Errorf("consumer is nil ")
	}
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.Consumers = append(s.Consumers, consumer)

	for _, track := range s.Tracks {
		if track == nil {
			fmt.Println("track is nil, skipping ")
			continue
		}
		if err := s.AddTrackToConsumer(track, consumer); err != nil {
			fmt.Printf("error adding track to consumer: %v\n", err)
			return err
		}

	}
	return nil

}

func (s *SFU) RemoveConsumer(consumer *webrtc.PeerConnection) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	temp := []*webrtc.PeerConnection{}
	for _, c := range s.Consumers {
		if c == consumer {
			continue
		}
		temp = append(temp, c)
	}
	s.Consumers = temp
}
