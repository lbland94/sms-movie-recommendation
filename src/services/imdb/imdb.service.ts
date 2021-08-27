import config from '@/config/config';
import { safeUrl } from '@/utilities/utilityFunctions';
import axios, { AxiosPromise } from 'axios';
import cheerio, { CheerioAPI } from 'cheerio';
import NodeCache from 'node-cache';
import { IMDB } from './imdb.const';
import { ImdbInitialState, ImdbItemListElement, ImdbListItem, ImdbTitle, ListUrlType } from './imdb.types';

/**
 * Supports watchlists, lists, and searches
 *
 * TODO:
 * support for charts? (https://www.imdb.com/chart/toptv/)
 */

export class ImdbService {
  // Caches for 1 day
  public static cache = new NodeCache({ maxKeys: +config.IMDB_CACHE_MAX, stdTTL: 3600 * 24 });

  /**
   * Fetches a list and returns in a standard data format
   */
  public static async fetchListOrig(url: string, force = false, max?: number): Promise<ImdbListItem[]> {
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
        listCount = watchlistCountRegex.test(watchlistCountText)
          ? +watchlistCountText.match(watchlistCountRegex)[1]
          : listCount;
      } else {
        const listCountText = $('.nav .desc > span:first-child').text();
        listCount = listCountRegex.test(listCountText)
          ? +listCountText.match(listCountRegex)[2].replace(/,/g, '')
          : listCount;
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
          const pagePromises = [];
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
    const items = [];
    if (watchlist) {
      // Watchlist items are stored in a variable in a script tag on the page.
      $('script').each((i, script) => {
        const scriptText = $(script).html();
        const regex = /IMDbReactInitialState\.push\((.*?)\);.*/m;
        if (regex.test(scriptText)) {
          const match = scriptText.match(regex);
          try {
            const parsed = JSON.parse(match[1]) as ImdbInitialState;
            if (parsed && parsed.titles && Object.keys(parsed.titles).length > 0) {
              Object.keys(parsed.titles).forEach((key: string) => {
                const title = parsed.titles[key];
                items.push(this.titleToListItem(title));
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
        const yearRegex = /.*?\((\d+)\)$/;
        const yearText = $(el).find('.lister-item-year').text().trim();
        items.push({
          name: $(el).find('.lister-item-header a[href*=\\/title\\/]').text().trim(),
          year: yearRegex.test(yearText) ? yearText.match(yearRegex)[1] : yearText,
          rating: $(el).find('.ratings-imdb-rating strong').text().trim(),
          certification: $(el).find('.certificate').text().trim(),
          runtime: $(el).find('.runtime').text().trim(),
          genre: $(el).find('.genre').text().trim(),
          metascore: $(el).find('.ratings-metascore > .metascore').text().trim(),
          link: $(el).find('.lister-item-header a[href*=\\/title\\/]').attr('href').replace(/\0/g, ''),
        });
      });
    }
    return items;
  }

  public static secondsToHoursMinutes(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) - hours * 60;
    return `${hours}h${minutes}m`;
  }

  public static async fetchTitlesChunked(titles: string[]): Promise<ImdbTitle[]> {
    try {
      const promiseChunks: Array<Promise<ImdbTitle[]>> = [];
      const arr = [...titles];
      while (arr.length > 0) {
        promiseChunks.push(this.fetchTitles(arr.splice(0, IMDB.request.itemBatchSize)));
      }
      const res = await Promise.all(promiseChunks);
      if (res.length < 2) {
        return res[0];
      }
      return res[0].concat(...res.slice(1));
    } catch (e) {
      // something failed
    }
    return [];
  }

  public static async fetchTitles(titles: string[]): Promise<ImdbTitle[]> {
    const filteredTitles = titles.filter((title) => /^tt\d+$/.test(title));
    if (filteredTitles.length <= 0) {
      return [];
    }
    try {
      const res = await axios.get<Record<string, { title: ImdbTitle }>>(
        `https://www.imdb.com/title/data?ids=${titles.join(',')}`,
      );

      return Object.entries(res.data).map(([k, t]) => t.title);
    } catch (e) {
      console.log('error', e);
      // fetch failed
    }
    return [];
  }

  public static async fetchList(url: string, force = false, max?: number): Promise<ImdbListItem[]> {
    const listType = this.getListType(url);
    const parsedUrl = safeUrl(url);
    if (!parsedUrl) return [];
    switch (listType) {
      case 'search':
        return await this.fetchSearchList(parsedUrl, force, max);
      case 'watch':
        return await this.fetchWatchlist(parsedUrl, force, max);
      case 'standard':
        return await this.fetchStandardList(parsedUrl, force, max);
      default:
        return [];
    }
  }

  public static async fetchWatchlist(url: URL, force = false, max?: number): Promise<ImdbListItem[]> {
    const match = url.href.match(IMDB.regex.listId.watchlist);
    const id = (match && match[1]) || '';

    const cachedVal = this.getCached(id);
    if (cachedVal && !force) {
      return cachedVal as ImdbListItem[];
    }

    try {
      const page = await axios.get(url.href);

      const $ = cheerio.load(page.data);
      const initialState = this.getInitialState($);

      let fetchedTitles = [];

      const initialIds = Object.keys(initialState.titles);
      if (initialState && initialState.titles) {
        fetchedTitles = initialIds.map((key) => initialState.titles[key]);
      }

      if (initialState && initialState.list && initialState.list.items) {
        const allIds = initialState.list.items.map((item) => item.const);
        if (allIds.length > fetchedTitles.length) {
          const toFetch = allIds.filter((id) => !initialIds.includes(id));

          const additionalTitles = await this.fetchTitlesChunked(toFetch);
          fetchedTitles.push(...additionalTitles);
        }
      }
      const list = fetchedTitles.map((t) => this.titleToListItem(t));
      this.cache.set(id, list);
      return list;
    } catch (e) {
      console.log('error', e);
      // Some error fetching page
    }
    return [];
  }

  public static getInitialState($: CheerioAPI): ImdbInitialState | undefined {
    let initialState = undefined;
    $('script').each((i, script) => {
      const scriptText = $(script).html();
      const match = scriptText.match(IMDB.regex.parse.scriptVar);

      if (match && match.length > 1) {
        try {
          const parsedState = JSON.parse(match[1]);
          if (parsedState) {
            initialState = parsedState as ImdbInitialState;
            return false;
          }
        } catch (e) {
          // Some parsing error
        }
      }
    });
    return initialState;
  }

  public static async fetchSearchList(url: URL, force = false, max?: number): Promise<ImdbListItem[]> {
    const match = url.href.match(IMDB.regex.listId.searchlist);
    const id = (match && match[1]) || url.href.split('?')[1] || '';

    const cachedVal = this.getCached(id);
    if (cachedVal && !force) {
      return cachedVal as ImdbListItem[];
    }

    url.searchParams.delete('start');
    url.searchParams.set('count', '250');

    const page = await axios.get(url.href);
    const $ = cheerio.load(page.data);
    return [];
  }

  /**
   * Fetch standard list, like https://www.imdb.com/list/ls025535170/?sort=list_order,asc&st_dt=&mode=detail&page=1
   */
  public static async fetchStandardList(url: URL, force = false, max?: number): Promise<ImdbListItem[]> {
    const match = url.href.match(IMDB.regex.listId.standardList);
    const id = (match && match[1]) || '';

    const cachedVal = this.getCached(id);
    if (cachedVal && !force) {
      return cachedVal as ImdbListItem[];
    }

    if (url.searchParams.get('page')) {
      url.searchParams.set('page', '1');
    }

    try {
      const page = await axios.get(url.href);

      const $ = cheerio.load(page.data);

      const listElements = this.getItemListElement($);

      // Parse list count
      let listCount = -1;

      if (listElements) {
        listCount = listElements.length;
      } else {
        const listCountText = $('.nav .lister-total-num-results').text().trim();
        const match = listCountText.match(IMDB.regex.parse.standardListCount);

        if (match && match[1]) {
          listCount = +match[1].replace(/,/g, '');
        }
      }

      listCount = Math.min(max || IMDB.limits.max, listCount);

      const items = this.standardListHTMLToList($);

      const initialIds = items.map((item) => item.id);
      if (listCount > 0 && items.length < listCount) {
        if (listElements) {
          const allIds = listElements.map((el) => this.idFromUrl(el.url));
          if (allIds.length > items.length) {
            const toFetch = allIds.filter((id) => !initialIds.includes(id));

            const additionalTitles = await this.fetchTitlesChunked(toFetch);
            items.push(...additionalTitles.map((title) => this.titleToListItem(title)));
          }
        } else {
          let current = items.length + 1;
          const pagePromises: AxiosPromise[] = [];
          while (current < listCount) {
            const newUrl = safeUrl(url.href);
            newUrl.searchParams.set('page', `${Math.ceil(current / IMDB.pageSize.standard)}`);
            pagePromises.push(axios.get(newUrl.href));
            current += IMDB.pageSize.standard;
          }

          for (const res of await Promise.all(pagePromises)) {
            const $page = cheerio.load(res.data);
            const pageItems = this.standardListHTMLToList($page);
            items.push(...pageItems);
          }
        }
      }

      const itemIds = [];
      const dedupedItems = items.filter((item) => {
        if (!itemIds.includes(item.id)) {
          itemIds.push(item.id);
          return true;
        }
        return false;
      });

      this.cache.set(id, dedupedItems);
      return dedupedItems;
    } catch (e) {
      console.log('fetchStandardList()', e);
    }
  }

  public static getItemListElement($: CheerioAPI): ImdbItemListElement[] | undefined {
    let initialElement = undefined;
    $('script[type="application/ld+json"]').each((i, script) => {
      const scriptText = $(script).html();
      const match = scriptText.match(IMDB.regex.parse.standardListVar);

      if (match && match.length > 1) {
        try {
          const parsedElement = JSON.parse(match[1]);
          if (parsedElement) {
            initialElement = parsedElement as ImdbItemListElement[];
            return false;
          }
        } catch (e) {
          // Some parsing error
        }
      }
    });
    return initialElement;
  }

  public static getCached(id: string): ImdbListItem[] | undefined {
    if (id) {
      return this.cache.get(id);
    }
    return undefined;
  }

  public static getListType(url: string): ListUrlType {
    if (IMDB.regex.listUrl.watchlist.test(url)) {
      return 'watch';
    }
    if (IMDB.regex.listUrl.standardList.test(url)) {
      return 'standard';
    }
    if (IMDB.regex.listUrl.searchlist.test(url)) {
      return 'search';
    }
    if (IMDB.regex.listUrl.chart.test(url)) {
      return 'chart';
    }
    return '';
  }

  public static titleToListItem(title: ImdbTitle): ImdbListItem {
    return {
      name: title.primary.title,
      year: title.primary.year && title.primary.year[0],
      rating: title.ratings.rating,
      certification: title.metadata.certificate,
      runtime: this.secondsToHoursMinutes(title.metadata.runtime),
      genre: title.metadata.genres.join(', '),
      metascore: title.ratings.metascore,
      link: title.primary.href,
      type: title.type,
      id: title.id,
    };
  }

  public static idFromUrl(url: string): string {
    const match = url.match(/.*\/(tt\d+)\/?.*?/);
    return (match && match[1]) || '';
  }

  public static standardListHTMLToList($: CheerioAPI): ImdbListItem[] {
    const items = [];
    $('.lister-item').each((i, el) => {
      const yearRegex = /.*?\((\d+)\)$/;
      const yearText = $(el).find('.lister-item-year').text().trim();
      const link = $(el).find('.lister-item-header a[href*=\\/title\\/]').attr('href').replace(/\0/g, '');
      const id = this.idFromUrl(link);
      items.push({
        name: $(el).find('.lister-item-header a[href*=\\/title\\/]').text().trim(),
        year: yearRegex.test(yearText) ? yearText.match(yearRegex)[1] : yearText,
        rating: $(el).find('.ratings-imdb-rating strong').text().trim(),
        certification: $(el).find('.certificate').text().trim(),
        runtime: $(el).find('.runtime').text().trim(),
        genre: $(el).find('.genre').text().trim(),
        metascore: $(el).find('.ratings-metascore > .metascore').text().trim(),
        link,
        id,
      });
    });
    return items;
  }
}
