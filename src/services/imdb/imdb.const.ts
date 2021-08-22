export const IMDB = {
  regex: {
    listUrl: {
      watchlist: /.*?\/user\/(.*?)\/watchlist.*?/,
      searchlist: /.*?\/search\/title.*?/,
      standardList: /.*?\/list\/(ls\d+)(?:\/.*?)?/,
    },
    listId: {
      watchlist: /.*?\/user\/(ur\d+)\/watchlist.*?/,
      searchlist: /\?(?:.*?)lists=(ls\d+).*?/,
      standardList: /.*?\/list\/(ls\d+).*?/,
    },
  },
};
