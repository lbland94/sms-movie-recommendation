import config from '@/config/config';
import axios from 'axios';
import cheerio, { CheerioAPI } from 'cheerio';
import NodeCache from 'node-cache'
import { ImdbListItem, ImdbWatchlistTitle } from './imdb.interfaces';

export class ImdbService {
  // Caches for 1 day
  public static cache = new NodeCache({ maxKeys: +config.IMDB_CACHE_MAX, stdTTL: 3600 * 24 });

  /**
   * Fetches a list and returns in a standard data format
   */
  public static async fetchList(url: string, force: boolean = false, max?: number): Promise<ImdbListItem[]> {
    console.log('fetchList', url);
    // Watchlists are handled a bit differently from other lists
    const watchlistRegex = /.*?\/user\/(.*?)\/watchlist.*?/;
    const isWatchlist = watchlistRegex.test(url);

    const searchlistRegex = /.*?\/search\/title.*?/;
    const isSearchList = searchlistRegex.test(url);

    try {
      // Generate ID to store list in cache; id for non-watchlist could be improved. Currently just query params.
      let id = '';
      if (isWatchlist) {
        id = url.match(watchlistRegex)[1];
      } else if (isSearchList) {
        const test = url.match(/\?lists=([^&]*?)/);
        if (test && test.length > 1) {
          id = test[1];
        } else {
          id = url.split('?')[1];
        }
      } else {
        return undefined;
      }

      // If cached, return value to save processing time
      const cachedVal = this.cache.get(id);
      if (cachedVal && !force) {
        return cachedVal as ImdbListItem[];
      }

      // If start param is present, reset to not have and set count to 250
      const parsedUrl = new URL(url);
      const start = parsedUrl.searchParams.get('start');
      if (start && !isNaN(+start)) {
        parsedUrl.searchParams.set('count', '250');
        parsedUrl.searchParams.delete('start');
      }

      const page = await axios.get(parsedUrl.href);

      const $ = cheerio.load(page.data);

      // Calculate full list count from html values
      let listCount = -1;

      const listCountRegex = /\d+-(\d+) of ((?:\d|,)+) titles./i;
      const watchlistCountRegex = /(\d+)\s.*?/;

      if (isWatchlist) {
        const watchlistCountText = $('.nav .lister-details').text();
        listCount = watchlistCountRegex.test(watchlistCountText) ? +watchlistCountText.match(watchlistCountRegex)[1] :
          listCount;
      } else {
        const listCountText = $('.nav .desc > span:first-child').text();
        listCount = listCountRegex.test(listCountText) ? +listCountText.match(listCountRegex)[2].replace(/,/g, '') :
          listCount;
      }

      // Check if it's a "Top 100" or "Top 200" list
      const listTitle = $('.article h1').text();
      const topXListRegex = /Top\s(\d+)\s.*?/i;
      const isTopXList = topXListRegex.test(listTitle);
      if (isTopXList) {
        listCount = +listTitle.match(topXListRegex)[1];
      }

      // Ensure list count is in reasonable range
      listCount = Math.min(max || 1000, listCount);

      // Put already fetched items in list
      const items = this.pageToList($, isWatchlist);

      // If there are still items to be fetched, group into parallel calls and add to list
      if (listCount > 0 && items.length < listCount) {
        try {
          const pageSize = 250;
          let current = items.length + 1;
          let pagePromises = [];
          while (current < listCount) {
            const parsedPageUrl = new URL(url);
            parsedPageUrl.searchParams.set('start', `${current}`);
            parsedPageUrl.searchParams.set('count', `${pageSize}`);
            pagePromises.push(axios.get(parsedPageUrl.href));
            current += pageSize;
          }
          const responses = await Promise.all(pagePromises);
          responses.forEach((res) => {
            const $page = cheerio.load(res.data);
            items.push(...this.pageToList($page, isWatchlist));
          });
        } catch (e) {
          // Pagination failed, work with what we have
          console.log('pagination failed', e);
        }
      }

      // Remove any extra unneeded items from list
      items.splice(listCount);

      // Store list in cache so it doesn't need recalculated
      this.cache.set(id, items);

      return items;
    } catch (e) {
      // Some error occured
      console.log('error', e);
    }
    return [];
  }

  /**
   * Converts a page (parsed by cheerio) to a list
   */
  public static pageToList($: CheerioAPI, watchlist: boolean): ImdbListItem[] {
    let items = [];
    if (watchlist) {
      // Watchlist items are stored in a variable in a script tag on the page.
      $('script').each((i, script) => {
          const scriptText = $(script).html();
          const regex = /IMDbReactInitialState\.push\((.*?)\);.*/m;
          if (regex.test(scriptText)) {
            const match = scriptText.match(regex);
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed && parsed.titles && Object.keys(parsed.titles).length > 0) {
                Object.keys(parsed.titles).forEach((key: string) => {
                  const title = parsed.titles[key] as ImdbWatchlistTitle;
                  items.push({
                    name: title.primary.title,
                    year: title.primary.year[0],
                    rating: title.ratings.rating,
                    certification: title.metadata.certificate,
                    runtime: title.metadata.runtime,
                    genre: title.metadata.genres.join(', '),
                    metascore: title.ratings.metascore,
                    link: title.primary.href,
                  });
                });
              }
            } catch (e) {
              console.log('error', e);
            }
          }
      });
    } else {
      // Standard list items are rendered in the HTML source of the page.
      $('.lister-item').each((i, el) => {
        items.push({
          name: $(el).find('.lister-item-header a[href*=\\/title\\/]').text().trim(),
          year: $(el).find('.lister-item-year').text().trim(),
          rating: $(el).find('.ratings-imdb-rating strong').text().trim(),
          certification: $(el).find('.certificate').text().trim(),
          runtime: $(el).find('.runtime').text().trim(),
          genre: $(el).find('.genre').text().trim(),
          metascore: $(el).find('.ratings-metascore > .metascore').text().trim(),
          link: $(el).find('.lister-item-header a[href*=\\/title\\/]').attr('href'),
        });
      });
    }
    return items;
  }
}