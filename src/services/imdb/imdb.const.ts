export const IMDB = {
  regex: {
    listUrl: {
      watchlist: /.*?\/user\/(.*?)\/watchlist.*?/,
      searchlist: /.*?\/search\/title.*?/,
      standardList: /.*?\/list\/(ls\d+)(?:\/.*?)?/,
      chart: /.*?\/chart\/([^?/]*)/,
    },
    listId: {
      watchlist: /.*?\/user\/(ur\d+)\/watchlist.*?/,
      searchlist: /\?(?:.*?)lists=(ls\d+).*?/,
      standardList: /.*?\/list\/(ls\d+).*?/,
    },
    parse: {
      scriptVar: /IMDbReactInitialState\.push\((.*?)\);.*/m,
      standardListVar: /"itemListElement": (\[(?:.|\n)*?\])/m,
      standardListCount: /(\d+) titles/i,
      searchListCount: /\d+-(\d+) of ((?:\d|,)+) titles./i,
      topList: /Top\s(\d+)\s.*?/i,
    },
  },
  request: {
    itemBatchSize: 500,
  },
  limits: {
    max: 1000,
    maxRequests: 10,
  },
  pageSize: {
    standard: 100,
    search: 250,
  },
};
