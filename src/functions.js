const Apify = require('apify');
const moment = require('moment');
const vm = require('vm');
const _ = require('lodash');

/**
 * @param {string} link
 */
const completeLink = (link) => {
    return new URL(link, 'https://trends.google.com').toString();
};

/**
 * 200M -> 200_000_000
 * 10K -> 10_000
 * @param {string} formattedTraffic
 */
const parseTraffic = (formattedTraffic) => {
    const number = parseFloat(formattedTraffic);
    const multipler = formattedTraffic.match(/(K|M|B)/gi);

    if (multipler && multipler[0]) {
        return number * (({
            K: 1000,
            M: 1000000,
            B: 1000000000,
        })[multipler[0]] || 1);
    }

    return number;
};

/**
 * @param {any} data
 * @param {(value: any) => (any|any[])} callback
 */
const getTrendingSearches = (data, callback) => {
    return _.get(data, 'default.trendingSearchesDays', []).flatMap(({ trendingSearches, date }) => {
        return trendingSearches.map((search) => {
            return callback({
                ...search,
                title: {
                    ...search.title,
                    exploreLink: completeLink(search.title.exploreLink),
                },
                relatedQueries: search.relatedQueries.map(({ query, exploreLink }) => ({ query, exploreLink: completeLink(exploreLink) })),
                formattedTraffic: parseTraffic(search.formattedTraffic),
                date: moment(date).utc(false).toISOString(),
            });
        });
    });
};

/**
 * @param {Apify.RequestQueue} requestQueue
 */
const createAddUrl = (requestQueue) => async (geo, date) => {
    await requestQueue.addRequest({
        url: `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=180&ed=${date}&geo=${geo}&ns=15`,
    });
};

/**
 * @param {string} dateFrom
 */
const parseRelativeDate = (dateFrom) => {
    if (!dateFrom) {
        return;
    }

    const parsedDateFrom = new Date(dateFrom);

    if (!Number.isNaN(parsedDateFrom.getTime())) {
        return parsedDateFrom.getTime();
    }

    const now = moment();

    if (!/(hour|minute|second)/i.test(dateFrom)) {
        now
            .hour(0)
            .minute(0)
            .second(0)
            .millisecond(0);
    }

    if (!dateFrom.includes(' ')) {
        switch (dateFrom) {
            case 'today':
                return now.valueOf();
            case 'yesterday':
                return now.subtract(1, 'day').valueOf();
            default:
                throw new Error(`Invalid date format: ${dateFrom}`);
        }
    }

    const split = dateFrom.split(' ', 2);
    const difference = now.clone().subtract(+split[0], split[1]);
    if (now.valueOf() !== difference.valueOf()) {
        // Means the subtraction worked
        return difference.valueOf();
    }

    throw new Error('\n---------WRONG INPUT:\n\ndateFrom is not a valid date. Please use date in YYYY-MM-DD or format like "1 week", "1 hour" or "20 days"\n\n---------');
};

/**
 * @param {string|Date|number} [value]
 * @param {boolean} [isoString]
 */
const convertDate = (value, isoString = false) => {
    if (!value) {
        return isoString ? '2100-01-01T00:00:00.000Z' : Infinity;
    }

    if (value instanceof Date) {
        return isoString ? value.toISOString() : value.getTime();
    }

    let tryConvert = new Date(value);

    // catch values less than year 2002
    if (Number.isNaN(tryConvert.getTime()) || `${tryConvert.getTime()}`.length < 13) {
        if (typeof value === 'string') {
            // convert seconds to miliseconds
            tryConvert = new Date(value.length >= 13 ? +value : +value * 1000);
        } else if (typeof value === 'number') {
            // convert seconds to miliseconds
            tryConvert = new Date(`${value}`.length >= 13 ? value : value * 1000);
        }
    }

    return isoString ? tryConvert.toISOString() : tryConvert.getTime();
};

/**
 * Check if the provided date is greater/less than the minimum
 * @param {number} fallback
 * @param {string|Date|number} [base]
 * @return {(compare: string | Date) => number}
 */
const cutOffDate = (fallback, base) => {
    if (!base) {
        return () => fallback;
    }

    const formatted = moment(base);

    return (compare) => {
        return formatted.diff(compare);
    };
};

/**
 * @template T
 * @typedef {T & { Apify: Apify, customData: any, request: Apify.Request }} PARAMS
 */

/**
 * Compile a IO function for mapping, filtering and outputing items.
 * Can be used as a no-op for interaction-only (void) functions on `output`.
 * Data can be mapped and filtered twice.
 *
 * Provided base map and filter functions is for preparing the object for the
 * actual extend function, it will receive both objects, `data` as the "raw" one
 * and "item" as the processed one.
 *
 * Always return a passthrough function if no outputFunction provided on the
 * selected key.
 *
 * @template RAW
 * @template {{ [key: string]: any }} INPUT
 * @template MAPPED
 * @template {{ [key: string]: any }} HELPERS
 * @param {{
 *  key: string,
 *  map?: (data: RAW, params: PARAMS<HELPERS>) => Promise<MAPPED>,
 *  output?: (data: MAPPED, params: PARAMS<HELPERS> & { data: RAW, item: MAPPED }) => Promise<void>,
 *  filter?: (obj: { data: RAW, item: MAPPED }, params: PARAMS<HELPERS>) => Promise<boolean>,
 *  input: INPUT,
 *  helpers: HELPERS,
 * }} params
 * @return {Promise<(data: RAW, args?: Record<string, any>) => Promise<void>>}
 */
const extendFunction = async ({
    key,
    output,
    filter,
    map,
    input,
    helpers,
}) => {
    /**
     * @type {PARAMS<HELPERS>}
     */
    const base = {
        ...helpers,
        Apify,
        customData: input.customData || {},
    };

    const evaledFn = (() => {
        // need to keep the same signature for no-op
        if (typeof input[key] !== 'string' || input[key].trim() === '') {
            return new vm.Script('({ item }) => item');
        }

        try {
            return new vm.Script(input[key], {
                lineOffset: 0,
                produceCachedData: false,
                displayErrors: true,
                filename: `${key}.js`,
            });
        } catch (e) {
            throw new Error(`"${key}" parameter must be a function`);
        }
    })();

    /**
     * Returning arrays from wrapper function split them accordingly.
     * Normalize to an array output, even for 1 item.
     *
     * @param {any} value
     * @param {any} [args]
     */
    const splitMap = async (value, args) => {
        const mapped = map ? await map(value, args) : value;

        if (!Array.isArray(mapped)) {
            return [mapped];
        }

        return mapped;
    };

    return async (data, args) => {
        const merged = { ...base, ...args };

        for (const item of await splitMap(data, merged)) {
            if (filter && !(await filter({ data, item }, merged))) {
                continue; // eslint-disable-line no-continue
            }

            const result = await (evaledFn.runInThisContext()({
                ...merged,
                data,
                item,
            }));

            for (const out of (Array.isArray(result) ? result : [result])) {
                if (output) {
                    if (out !== null) {
                        await output(out, { ...merged, data, item });
                    }
                    // skip output
                }
            }
        }
    };
};

/**
 * Do a generic check when using Apify Proxy
 *
 * @typedef params
 * @property {any} [params.proxyConfig] Provided apify proxy configuration
 * @property {boolean} [params.required] Make the proxy usage required when running on the platform
 * @property {string[]} [params.blacklist] Blacklist of proxy groups, by default it's ['GOOGLE_SERP']
 * @property {boolean} [params.force] By default, it only do the checks on the platform. Force checking regardless where it's running
 * @property {string[]} [params.hint] Hint specific proxy groups that should be used, like SHADER or RESIDENTIAL
 *
 * @param {params} params
 * @returns {Promise<Apify.ProxyConfiguration | undefined>}
 */
const proxyConfiguration = async ({
    proxyConfig,
    required = true,
    force = Apify.isAtHome(),
    blacklist = ['GOOGLE_SERP'],
    hint = [],
}) => {
    const configuration = await Apify.createProxyConfiguration(proxyConfig);

    // this works for custom proxyUrls
    if (Apify.isAtHome() && required) {
        if (!configuration || (!configuration.usesApifyProxy && (!configuration.proxyUrls || !configuration.proxyUrls.length)) || !configuration.newUrl()) {
            throw new Error('\n=======\nYou\'re required to provide a valid proxy configuration\n\n=======');
        }
    }

    // check when running on the platform by default
    if (force) {
        // only when actually using Apify proxy it needs to be checked for the groups
        if (configuration && configuration.usesApifyProxy) {
            if (blacklist.some((blacklisted) => (configuration.groups || []).includes(blacklisted))) {
                throw new Error(`\n=======\nUsing any of those proxy groups won't work:\n\n*  ${blacklist.join('\n*  ')}\n\n=======`);
            }

            // specific non-automatic proxy groups like RESIDENTIAL, not an error, just a hint
            if (hint.length && !hint.some((group) => (configuration.groups || []).includes(group))) {
                Apify.utils.log.info(`\n=======\nYou can pick specific proxy groups for better experience:\n\n*  ${hint.join('\n*  ')}\n\n=======`);
            }
        }
    }

    return configuration;
};

module.exports = {
    cutOffDate,
    parseRelativeDate,
    convertDate,
    createAddUrl,
    extendFunction,
    getTrendingSearches,
    completeLink,
    proxyConfiguration,
};
