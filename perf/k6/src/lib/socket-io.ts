/**
 * Socket.IO EIO4/SIO protocol handler for k6.
 *
 * k6 has native WebSocket support but NOT Socket.IO.
 * This module implements the minimal protocol needed to:
 *   1. Complete EIO4 handshake
 *   2. Connect to the SIO "/" namespace
 *   3. Encode/decode 42[...] events
 *   4. Respond to pings (server sends "2", client responds "3")
 */

// --- Types ---

export interface EIOOpenData {
  sid: string;
  pingInterval: number;
  pingTimeout: number;
}

export type DecodedMessage =
  | { type: 'open'; data: EIOOpenData }
  | { type: 'connected'; data: { sid: string } }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'event'; name: string; data: unknown }
  | { type: 'disconnect' }
  | { type: 'unknown'; raw: string };

// --- EIO4 Packet Types ---
// 0 = open, 1 = close, 2 = ping, 3 = pong, 4 = message
// SIO on top of EIO message (type 4):
//   40 = CONNECT, 41 = DISCONNECT, 42 = EVENT

// --- Decode ---

export function decode(raw: string): DecodedMessage {
  if (raw === '2') return { type: 'ping' };
  if (raw === '3') return { type: 'pong' };

  // EIO open packet
  if (raw.startsWith('0')) {
    try {
      return { type: 'open', data: JSON.parse(raw.slice(1)) };
    } catch (e) {
      console.error(`[socket-io] Failed to parse EIO open packet: ${raw.substring(0, 100)}`);
      return { type: 'unknown', raw };
    }
  }

  // SIO disconnect
  if (raw === '41') return { type: 'disconnect' };

  // SIO connect (namespace ack)
  if (raw.startsWith('40')) {
    const payload = raw.slice(2);
    if (payload) {
      try {
        return { type: 'connected', data: JSON.parse(payload) };
      } catch (e) {
        console.error(`[socket-io] Failed to parse SIO connect payload: ${payload.substring(0, 100)}`);
        return { type: 'connected', data: { sid: '' } };
      }
    }
    return { type: 'connected', data: { sid: '' } };
  }

  // SIO event
  if (raw.startsWith('42')) {
    try {
      const arr = JSON.parse(raw.slice(2));
      return { type: 'event', name: arr[0], data: arr[1] };
    } catch (e) {
      console.error(`[socket-io] Failed to parse SIO event: ${raw.substring(0, 200)}`);
      return { type: 'unknown', raw };
    }
  }

  // SIO error (44)
  if (raw.startsWith('44')) {
    console.error(`[socket-io] Server sent SIO error packet: ${raw.substring(0, 200)}`);
    return { type: 'unknown', raw };
  }

  return { type: 'unknown', raw };
}

// --- Encode ---

/** Encode a Socket.IO event: 42["eventName", { ...data }] */
export function encodeEvent(name: string, data: unknown): string {
  return '42' + JSON.stringify([name, data]);
}

/** SIO namespace connect packet */
export function connectPacket(): string {
  return '40';
}

/** EIO pong response */
export function pongPacket(): string {
  return '3';
}

// --- Helpers ---

/** Returns true if the message was a ping and was handled (pong sent). */
export function handlePing(
  socket: { send(data: string): void },
  raw: string,
): boolean {
  if (raw === '2') {
    socket.send('3');
    return true;
  }
  return false;
}

/**
 * Returns true if the message is a SIO namespace connect ack.
 * When received, the connection is fully ready for events.
 */
export function isConnected(msg: DecodedMessage): boolean {
  return msg.type === 'connected';
}

/**
 * Extract an event by name from a decoded message.
 * Returns the event data if matched, null otherwise.
 */
export function matchEvent<T = unknown>(
  msg: DecodedMessage,
  eventName: string,
): T | null {
  if (msg.type === 'event' && msg.name === eventName) {
    return msg.data as T;
  }
  return null;
}
