export interface Torrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  downloaded: number;
  uploaded: number;
  eta: number;
  state: string;
  priority: number;
  num_seeds: number;
  num_leechs: number;
  ratio: number;
  category: string;
  tags: string;
  added_on: number;
  completion_on: number;
  tracker: string;
  save_path: string;
}

export type TorrentState =
  | "error"
  | "missingFiles"
  | "uploading"
  | "pausedUP"
  | "queuedUP"
  | "stalledUP"
  | "checkingUP"
  | "forcedUP"
  | "allocating"
  | "downloading"
  | "metaDL"
  | "pausedDL"
  | "queuedDL"
  | "stalledDL"
  | "checkingDL"
  | "forcedDL"
  | "checkingResumeData"
  | "moving";
