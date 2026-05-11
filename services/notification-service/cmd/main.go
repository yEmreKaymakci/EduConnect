package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	amqp "github.com/rabbitmq/amqp091-go"
)

// ─── WebSocket Hub ───────────────────────────────────────────
type Hub struct {
	mu      sync.RWMutex
	clients map[string]*websocket.Conn // userID → ws conn
}

func NewHub() *Hub { return &Hub{clients: make(map[string]*websocket.Conn)} }

func (h *Hub) Register(userID string, conn *websocket.Conn) {
	h.mu.Lock(); defer h.mu.Unlock()
	h.clients[userID] = conn
}

func (h *Hub) Unregister(userID string) {
	h.mu.Lock(); defer h.mu.Unlock()
	delete(h.clients, userID)
}

func (h *Hub) Send(userID string, payload any) bool {
	h.mu.RLock(); defer h.mu.RUnlock()
	conn, ok := h.clients[userID]
	if !ok { return false }
	data, _ := json.Marshal(payload)
	return conn.WriteMessage(websocket.TextMessage, data) == nil
}

func (h *Hub) Broadcast(payload any) {
	h.mu.RLock(); defer h.mu.RUnlock()
	data, _ := json.Marshal(payload)
	for _, conn := range h.clients {
		_ = conn.WriteMessage(websocket.TextMessage, data)
	}
}

// ─── RabbitMQ Consumer + RPC ─────────────────────────────────
type NotificationService struct {
	hub     *Hub
	conn    *amqp.Connection
	channel *amqp.Channel
}

func connectRabbitMQ() (*amqp.Connection, error) {
	url := fmt.Sprintf("amqp://%s:%s@rabbitmq:5672/",
		os.Getenv("RABBITMQ_USER"), os.Getenv("RABBITMQ_PASSWORD"))

	for i := 1; i <= 10; i++ {
		conn, err := amqp.Dial(url)
		if err == nil { return conn, nil }
		log.Printf("[RabbitMQ] Attempt %d/10 failed: %v", i, err)
		time.Sleep(5 * time.Second)
	}
	return nil, fmt.Errorf("failed to connect to RabbitMQ")
}

func (s *NotificationService) Start(ctx context.Context) error {
	var err error
	s.conn, err = connectRabbitMQ()
	if err != nil { return err }

	s.channel, err = s.conn.Channel()
	if err != nil { return err }

	if err = s.channel.Qos(10, 0, false); err != nil { return err }

	// Consume notification.rpc queue (RPC pattern)
	msgs, err := s.channel.Consume("notification.rpc", "", false, false, false, false, nil)
	if err != nil { return err }

	log.Println("[RabbitMQ] Consuming notification.rpc queue (RPC mode)")

	go func() {
		for {
			select {
			case <-ctx.Done(): return
			case msg, ok := <-msgs:
				if !ok { return }
				s.handleMessage(msg)
			}
		}
	}()

	// Consume fanout queues for broadcast
	broadcastQueues := []string{"internship.approved", "permission.changed"}
	for _, q := range broadcastQueues {
		qMsgs, err := s.channel.Consume(q, "", false, false, false, false, nil)
		if err != nil { log.Printf("[RabbitMQ] Failed to consume %s: %v", q, err); continue }
		go func(queue string, ch <-chan amqp.Delivery) {
			for msg := range ch {
				s.handleBroadcast(msg, queue)
			}
		}(q, qMsgs)
	}

	return nil
}

func (s *NotificationService) handleMessage(msg amqp.Delivery) {
	defer msg.Ack(false)

	var payload map[string]any
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		log.Printf("[Consumer] Invalid JSON: %v", err)
		s.rpcReply(msg, map[string]any{"success": false, "error": "invalid payload"})
		return
	}

	log.Printf("[Consumer] Received: %v", payload)

	// Send WebSocket notification if target_user_id present
	success := false
	if userID, ok := payload["target_user_id"].(string); ok {
		notification := map[string]any{
			"type":      payload["event"],
			"message":   payload["message"],
			"timestamp": time.Now().Format(time.RFC3339),
		}
		success = s.hub.Send(userID, notification)
	}

	// RPC reply
	if msg.ReplyTo != "" && msg.CorrelationId != "" {
		s.rpcReply(msg, map[string]any{"success": true, "delivered": success})
	}
}

func (s *NotificationService) handleBroadcast(msg amqp.Delivery, queue string) {
	defer msg.Ack(false)
	var payload map[string]any
	if err := json.Unmarshal(msg.Body, &payload); err != nil { return }

	log.Printf("[Broadcast:%s] %v", queue, payload)
	s.hub.Broadcast(map[string]any{"type": queue, "data": payload, "timestamp": time.Now().Format(time.RFC3339)})
}

func (s *NotificationService) rpcReply(msg amqp.Delivery, response any) {
	if msg.ReplyTo == "" { return }
	data, _ := json.Marshal(response)
	_ = s.channel.PublishWithContext(context.Background(), "", msg.ReplyTo, false, false,
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: msg.CorrelationId,
			Body:          data,
		},
	)
}

// ─── WebSocket Handler ────────────────────────────────────────
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func wsHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			http.Error(w, "user_id required", http.StatusBadRequest)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil { log.Printf("[WS] Upgrade error: %v", err); return }
		hub.Register(userID, conn)
		log.Printf("[WS] User %s connected", userID)
		defer func() {
			hub.Unregister(userID)
			conn.Close()
			log.Printf("[WS] User %s disconnected", userID)
		}()
		for {
			if _, _, err := conn.ReadMessage(); err != nil { break }
		}
	}
}

// ─── Main ─────────────────────────────────────────────────────
func main() {
	log.Println("🚀 Notification Service starting...")
	hub := NewHub()
	svc := &NotificationService{hub: hub}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := svc.Start(ctx); err != nil {
		log.Fatalf("❌ Failed to start: %v", err)
	}

	port := os.Getenv("SERVICE_PORT")
	if port == "" { port = "8006" }

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHandler(hub))
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"service":"notification-service","status":"running"}`)
	})

	log.Printf("✅ Notification Service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}
