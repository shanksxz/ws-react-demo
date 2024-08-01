import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "@tanstack/react-form"
import { useEffect, useState } from "react"

interface FormValues {
  roomId: string
  name: string
}

interface Message {
  type: 'join' | 'message' | 'leave' | 'error' | 'success';
  room: string;
  message?: string;
}

export default function App() {

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL as string)
    ws.onopen = () => {
      console.log("Connected to server")
    }
    ws.onmessage = (event) => {
      try {
        console.log('Received message:', event.data);
        const data: Message = JSON.parse(event.data);
        switch (data.type) {
          case 'success':
            console.log('Success', data.message);
            break;
          case 'error':
            console.error('Error', data.message);
            break;
          default:
            console.log('Received message:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.log('Raw message:', event.data);
      }
    }
    ws.onclose = () => {
      console.log("Disconnected from server")
    }
    setSocket(ws)
    return () => ws.close()
  }, [])

  const form = useForm<FormValues>({
    defaultValues: {
      roomId: "",
      name: ""
    },
    onSubmit: async ({ value }) => {
      setIsJoining(true);
      setError(null);
      const message: Message = {
        type: "join",
        room: value.roomId,
        message: value.name
      }
      if (socket?.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify(message));
        } catch (err) {
          setError('Failed to send join request');
          console.error(err);
        }
      } else {
        setError('WebSocket is not connected');
      }
      setIsJoining(false);
    }
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-md w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Join a Room</h1>
          <p className="text-muted-foreground">Enter a room ID and your name to join a chat room.</p>
        </div>
        <form
          className="space-y-4 mt-8"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div>
            <Label htmlFor="roomId" className="block text-sm font-medium">
              Room ID
            </Label>
            <form.Field
              name="roomId"
              validators={{
                onChange: ({ value }) => {
                  if (value.length < 3) return "Room ID must be at least 3 characters"
                }
              }}
            >
              {(field) => (
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  id="roomId"
                  type="text"
                  placeholder="Enter room ID"
                  className="mt-1 block w-full"
                />
              )}
            </form.Field>
          </div>
          <div>
            <Label htmlFor="name" className="block text-sm font-medium">
              Your Name
            </Label>
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  if (value.length < 2) return "Name must be at least 2 characters"
                }
              }}
            >
              {(field) => (
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="text"
                  placeholder="Enter your name"
                  className="mt-1 block w-full"
                />
              )}
            </form.Field>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={isJoining}>
            {isJoining ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </div>
    </div>
  )
}