export interface ImdbListItem {
  name: string;
  year: string;
  rating: string | number;
  certification: string;
  runtime: string;
  genre: string;
  metascore: string | number;
  link: string;
  type?: ImdbItemType;
  id: string;
}

type ImdbItemType = 'featureFilm' | 'series';

export interface ImdbTitle {
  id: string;
  plot: string;
  episode?: number;
  type: ImdbItemType;
  movieMeterCurrentRank: number;
  metadata: {
    genres: string[];
    certificate: string;
    release: number;
    runtime: number;
    seasonEpisode?: number;
    numberOfEpisodes?: number;
  };
  primary: {
    href: string;
    year: string[];
    title: string;
  };
  poster: {
    height: number;
    width: number;
    url: string;
  };
  ratings: {
    metascore: number;
    canVote: boolean;
    rating: number;
    votes: number;
  };
  credits: {
    star: Array<{
      href: string;
      name: string;
    }>;
    director: Array<{
      href: string;
      name: string;
    }>;
  };
}

export interface ImdbList {
  author: string;
  name: string;
  id: string;
  public: boolean;
  total: number;
  items: Array<{
    added: string;
    // const is the title id
    const: string;
    itemId: string;
    position: number;
  }>;
  facets: {
    GENRES: {
      facets: Array<{
        name: string;
        label: string;
        count: number;
      }>;
    };
    RELEASE_DATE: {
      facets: Array<{
        name: string;
      }>;
    };
    TITLE_TYPE: {
      facets: Array<{
        name: string;
        label: string;
        count: number;
      }>;
    };
  };
}

export interface ImdbInitialState {
  user: null | any;
  sortOption: string;
  viewMode: string;
  starbars: { [id: string]: any };
  ribbons: { [id: string]: any };
  list: ImdbList;
  titles: Record<string, ImdbTitle>;
}

export interface ImdbItemListElement {
  '@type': string;
  position: string;
  url: string;
}

export type ListUrlType = 'watch' | 'search' | 'standard' | 'chart' | '';
