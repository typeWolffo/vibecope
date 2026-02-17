export interface PlatformSelectors {
  postContainer: string[];
  postText: string[];
  feedContainer: string[];
}

export interface PlatformConfig {
  linkedin: PlatformSelectors;
  x: PlatformSelectors;
}

export interface CustomSelectorConfig {
  linkedin: string[];
  x: string[];
}
