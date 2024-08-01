import { createServer } from "http";
import WebSocket, { WebSocketServer } from "ws";

interface Room {
  clients: WebSocket[];
}

interface Message {
  type: 'join' | 'message' | 'leave' | 'error' | 'success';
  room: string;
  message?: string;
}

const server = createServer((req, res) => {
  console.log(`${new Date()} Received request for ${req.url}`);
  res.end('Hello World');
});

const wss = new WebSocketServer({ server });
const rooms = new Map<string, Room>();

wss.on('connection', (ws: WebSocket) => {
  ws.on('error', console.error);

  ws.on('message', (msg: WebSocket.RawData) => {
    console.log('Received message', msg.toString());
    
    let message: Message;
    try {
      message = JSON.parse(msg.toString()) as Message;
    } catch (error) {
      console.error('Failed to parse message:', error);
      return;
    }

    console.log('Parsed message', message);

    switch (message.type) {
      case 'join':
        console.log('Joining room', message.room);
        if (rooms.has(message.room)) {
          rooms.get(message.room)!.clients.push(ws);
          console.log('Room already exists, adding client to room', rooms);
          // ws.send(`Joined room ${message.room}`);
          ws.send(JSON.stringify({
            type: 'success',
            message: `${message.room}`
          }));
        } else {
          rooms.set(message.room, { clients: [ws] });
          console.log('Room does not exist, creating room and adding client to room', rooms);
          // ws.send(`Created and joined room ${message.room}`);
          ws.send(JSON.stringify({
            type: 'success',
            message: `${message.room}`
          }));
        }
        break;

      case 'message':
        if (rooms.has(message.room) && message.message) {
          rooms.get(message.room)!.clients.forEach((client: WebSocket) => {
            //? client !== ws ensures that the sender does not receive their own message (idk if this is necessary) 
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'message',
                message: message.message
              }));
            }
          });
        }
        break;

      case 'leave':
        if (rooms.has(message.room)) {
          const room = rooms.get(message.room)!;
          room.clients = room.clients.filter(client => client !== ws);
          if (room.clients.length === 0) {
            rooms.delete(message.room);
          }
        }
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  });
  // ws.send("Connected to server, message from server");
});

server.listen(8080, () => {
  console.log('Server started on ws://localhost:8080');
});