import * as DiscordRPC from "@xhayper/discord-rpc";
import express from "express";
import { makeUrlShorter } from "./localUrlShortener.ts";

const CLIENT_ID: string = "1411353042405691422";
const CLIENT_OPTIONS: DiscordRPC.ClientOptions = {
  clientId: CLIENT_ID,
};

export interface MusicData {
  title: string;
  artist: string;
  thumbnailUrl: string;
  listenStartTimestamp: number;
  listenEndTimestamp: number;
}

const app = express();
const PORT: number = 3000;

var playingMusicKey: string = "";
var lastPlayingEndTimestamp: number = 0;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(express.json());

function getMusicKey(musicData: MusicData): string {
  return `${musicData.title}_${musicData.artist}`;
}

async function updateMusic(musicData: MusicData) {
  const thisMusicKey = getMusicKey(musicData);
  if (
    playingMusicKey === thisMusicKey &&
    lastPlayingEndTimestamp >= musicData.listenEndTimestamp
  ) {
    return;
  }
  playingMusicKey = thisMusicKey;
  lastPlayingEndTimestamp = musicData.listenEndTimestamp;

  var shortenedUrl = await makeUrlShorter(musicData.thumbnailUrl).catch(
    (errorObject) => {
      console.error("Error while shortening URL:", errorObject);
    }
  );
  if (!shortenedUrl || shortenedUrl === "" || shortenedUrl.length >= 256) {
    console.error("Shortened URL is too long or null:", shortenedUrl);
    shortenedUrl = "album_no_logo";
  }

  const remainingTime = Math.max(musicData.listenEndTimestamp - Date.now(), 0);
  console.log("Timeout added:", remainingTime / 1000);
  setTimeout((remainingTime) => {
    client.user?.clearActivity();
    if (playingMusicKey == thisMusicKey) {
      lastPlayingEndTimestamp = 0;
      playingMusicKey = "";
      console.log("Cleared music activity");
    }
  }, remainingTime);

  const activity: DiscordRPC.SetActivity = {
    details: musicData.title,
    state: musicData.artist,
    type: 2,
    largeImageKey: shortenedUrl,
    smallImageKey: "dispare_logo",
    startTimestamp: musicData.listenStartTimestamp,
    endTimestamp: lastPlayingEndTimestamp,
  };
  client.user?.setActivity(activity);
  console.log("Received new music activity:", activity);
}

const client = new DiscordRPC.Client(CLIENT_OPTIONS);
client.on("ready", () => {
  console.log("Discord RPC ready, starting up music activity server");
  app.post("/vk-discord-rpc-music", (req, res) => {
    updateMusic(req.body);
    res.status(200).send("OK");
  });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

client.login().catch((errorObject) => {
  console.error("Could not login: " + errorObject);
});
