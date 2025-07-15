import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getSocketServer } from '@/lib/socket-server';

export async function GET(request: NextRequest) {
  // This endpoint is just for Socket.IO handshake
  // The actual socket handling is done in the custom server
  return new Response('Socket.IO endpoint', { status: 200 });
}

// For development, we'll use the built-in Next.js server
// In production, you'd typically use a custom server