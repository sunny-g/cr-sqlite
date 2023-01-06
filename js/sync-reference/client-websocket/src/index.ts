import { Socket } from "@vlcn.io/client-server-common";
import {
  ReplicatorArgs,
  default as createReplicator,
  Replicator,
} from "@vlcn.io/client-core";

class WebSocketWrapper implements Socket {
  private ws: WebSocket | null = null;

  constructor(
    private readonly uri: string,
    private readonly replicator: Replicator
  ) {}

  start() {
    const ws = (this.ws = new WebSocket(this.uri));
    ws.onerror = (e: Event) => {
      // TODO: retry connection
      this.replicator.stop();
    };

    ws.onopen = async () => {
      ws.onclose = (e: CloseEvent) => {
        if (this.onclose) {
          this.onclose(e.code, e.reason);
        }
      };

      ws.onmessage = (e: MessageEvent<Uint8Array>) => {
        if (this.onmessage) {
          this.onmessage(new Uint8Array(e.data));
        }
      };
      await this.replicator.start(this);
    };
  }

  onclose?: (code: number, reason: any) => void = undefined;
  onmessage?: (data: Uint8Array) => void = undefined;

  send(data: Uint8Array) {
    this.ws?.send(data);
  }

  closeForError(code?: number | undefined, data?: any): void {
    // TODO: retry connection if we've closed due to an error.
    // Exponential backoff.
    // Stop trying after too many closeForErrors
    this.ws?.close(code, data);
  }

  close(code?: number | undefined, data?: any): void {
    this.ws?.close(code, data);
  }

  removeAllListeners(): void {
    this.onclose = undefined;
    this.onmessage = undefined;
  }
}

export default async function startSyncWith(
  uri: string,
  args: ReplicatorArgs
): Promise<Replicator> {
  const replicator = await createReplicator(args);
  const wrapper = new WebSocketWrapper(uri, replicator);
  wrapper.start();
  return replicator;
}
