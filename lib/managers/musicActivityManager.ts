import * as DiscordRPC from "@xhayper/discord-rpc";
import type { MusicActivitySet } from "../types/MusicActivitySet.ts";

class MusicActivityManager {
  private constructor() {}
  public static SetMusicActivity(
    client: DiscordRPC.Client,
    activity: MusicActivitySet
  ): Promise<DiscordRPC.SetActivityResponse> {
    return new Promise((resolve, reject) => {
      if (!client.user) {
        return reject("Client not ready");
      }
      const button = {
        label: "Button",
        url: "https://github.com/xhayper/discord-rpc",
      };
      const setActivity: DiscordRPC.SetActivity = {
        details:
          activity.name +
          (activity.like ? " [IN FAVORITES]" : "") +
          (activity.isPlaying ? "" : " [PAUSED]"),
        state: activity.author,
        type: 2,
        largeImageKey: activity.thumbnailUrl,
        smallImageKey: activity.smallImageUrl,
        startTimestamp: activity.startListeningTimestamp,
        endTimestamp: activity.startListeningTimestamp + activity.soundLength,
      };
      client.user.setActivity(setActivity).then(
        (setActivityResult) => {
          console.log("Activity set successfully:", activity);
          resolve(setActivityResult);
        },
        (...args) => {
          console.error("Failed to set activity");
          reject(...args);
        }
      );
    });
  }
}
export { MusicActivityManager, type MusicActivitySet };
