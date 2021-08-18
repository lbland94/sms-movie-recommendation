export interface ImdbWatchlistTitle {
  primary: {
    href: string;
    year: string[];
    title: string;
  }
  episode: number;
  plot: string;
  poster: {
    height: number;
    width: number;
    url: string;
  }
  credits: {
    star: Array<{
      href: string;
      name: string;
    }>;
    director: Array<{
      href: string;
      name: string;
    }>;
  }
  ratings: {
    metascore: number;
    canVote: boolean;
    rating: number;
    votes: number;
  }
  metadata: {
    genres: string[];
    certificate: string;
    runtime: number;
    seasonEpisode: number;
    numberOfEpisodes: number;
    release: number;
  }
  movieMeterCurrentRank: number;
  id: string;
  type: string;
}

export interface ImdbListItem {
  name: string;
  year: string;
  rating: string|number;
  certification: string;
  runtime: string;
  genre: string;
  metascore: string|number;
  link: string;
}
