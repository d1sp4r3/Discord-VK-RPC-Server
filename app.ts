import express, { type Express, type Request, type Response } from "express";

import {
  ClientInitializer,
  READY_EVENT_NAME,
} from "./lib/clients/clientInitializer.ts";
import {
  MusicActivityManager,
  type MusicActivitySet,
} from "./lib/managers/musicActivityManager.ts";
import {
  ServicesUrlShortener,
  type URLShortenerMultiServiceRequest,
  DEFAULT_CHARACTERS_LIMIT,
} from "./lib/utils/ServicesUrlShortener.ts";
import ApplicationConfig from "./lib/config/application.json" with { type: "json" };
import type { MusicData } from "./lib/types/MusicData.ts";

const MINIMUM_PLAY_LENGTH = 1000;

const app: Express = express();
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  const origin = (req.headers.origin as string) ?? "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

async function tryShortenUrl(url: string): Promise<string> {
  try {
    const shortenerMultiRequest: URLShortenerMultiServiceRequest = { url };
    const shortened = await ServicesUrlShortener.tryShorterWithServicesAndLimit(
      shortenerMultiRequest,
      DEFAULT_CHARACTERS_LIMIT
    );
    return shortened ?? url;
  } catch (err) {
    console.error("URL shortener failed", err);
    return url;
  }
}
app.use((req, _res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.url}`);
  next();
});
async function onPost(request: Request, response: Response) {
  try {
    const body: MusicData = request.body ?? {};
    const thumbnail = body.thumbnailUrl;
    const finalThumbnailUrl = thumbnail ? await tryShortenUrl(thumbnail) : thumbnail;
    console.log("Final thumbnail url:", finalThumbnailUrl);

    const listenProgress =
      typeof body.listenProgressTime === "number" ? body.listenProgressTime : 0;
    const startListeningTimestamp = Date.now() - listenProgress;

    const musicActivitySet: MusicActivitySet = {
      name: body.name,
      author: body.author,
      thumbnailUrl: finalThumbnailUrl,
      smallImageUrl: "dispare_logo",
      startListeningTimestamp,
      soundLength: body.duration * 1000,
      like: body.like,
      isPlaying: body.isPlaying,
    };

    console.log(musicActivitySet);
    const setResult = await MusicActivityManager.SetMusicActivity(
      client,
      musicActivitySet
    );
    console.log("Set music activity setted:", setResult);
    return response.status(200).send("OK");
  } catch (err) {
    console.error("Failed to set music activity", err);
    return response.status(500).send("Failed to set music activity");
  }
}

function startServer(): void {
  app.options(ApplicationConfig.scope, (_req, res) => res.sendStatus(204));
  app.post(
    ApplicationConfig.scope,
    (request: Request, response: Response) => onPost(request, response)
  );
  app.listen(ApplicationConfig.usingPort, () => {
    console.log(
      `Server running on ${ApplicationConfig.hostUrl}:${ApplicationConfig.usingPort}`
    );
  });
}

const client = ClientInitializer.getClient();
client.on(READY_EVENT_NAME, startServer);

async function loginClient(): Promise<void> {
  const startLoginTimestamp: number = Date.now();
  try {
    console.log("Attempt to login client");
    await client.login();
    console.log(`Logged in in ${Date.now() - startLoginTimestamp}ms`);
  } catch (errorObject) {
    console.log("Client failed to login:", errorObject);
  }
}
loginClient();
