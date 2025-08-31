interface MusicActivitySet {
  name: string;
  author: string;
  startListeningTimestamp: number;
  thumbnailUrl?: string;
  smallImageUrl?: string;
  soundLength: number;
  like?: boolean;
  isPlaying?: boolean;
}

export type { MusicActivitySet };
