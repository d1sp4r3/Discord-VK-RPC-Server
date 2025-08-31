import DiscordRPC from "@xhayper/discord-rpc";
export type ClientOptions = ConstructorParameters<typeof DiscordRPC.Client>[0];

import ClientConfig from "../config/client.json" with { type: "json" };
export const READY_EVENT_NAME = "ready"

class ClientInitializer {
    private static client: DiscordRPC.Client;
    private static clientOptions: ClientOptions = {
        clientId: ClientConfig.clientId,
    };
    private constructor() {}
    public static getClient(): DiscordRPC.Client {
        if (!this.client) {
            this.client = new DiscordRPC.Client(ClientInitializer.clientOptions);
        }
        return this.client;
    }
}
export { ClientInitializer };
