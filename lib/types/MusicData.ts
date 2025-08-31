interface MusicData {
  name: string;
  author: string;
  thumbnailUrl: string;
  like?: boolean;
  isPlaying?: boolean;
  volume: number;
  duration: number;
  listenProgressTime: number;
}
export type { MusicData };
