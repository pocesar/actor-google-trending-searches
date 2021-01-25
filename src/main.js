const Apify = require('apify');
const moment = require('moment');
const _ = require('lodash');
const {
    parseRelativeDate,
    cutOffDate,
    createAddUrl,
    extendFunction,
    getTrendingSearches,
    proxyConfiguration,
} = require('./functions');

const { log } = Apify.utils;

Apify.main(async () => {
    /**
     * @type {any}
     */
    const input = await Apify.getInput();

    const requestQueue = await Apify.openRequestQueue();
    const proxyConfig = await proxyConfiguration(input.proxy);

    const addUrl = createAddUrl(requestQueue);
    const parsedFrom = parseRelativeDate(input.fromDate || 'today');
    const parsedTo = parseRelativeDate(input.toDate || 'today');
    const fromDate = cutOffDate(Infinity, parsedFrom);
    const toDate = cutOffDate(-Infinity, parsedTo);

    const outputMode = input.outputMode || 'complete';

    let days = moment(parsedFrom).diff(parsedTo, 'days');

    if (days < 0) {
        throw new Error(`Parsed "From date" ${input.fromDate} is older than "To date" ${input.toDate}`);
    }

    let { maxItems = 100 } = input;

    const extendOutputFunction = await extendFunction({
        map: async (data) => {
            return getTrendingSearches(data, ({ date, formattedTraffic, relatedQueries, articles, ...rest }) => {
                switch (outputMode) {
                    case 'complete':
                        return {
                            ...rest.title,
                            geo: input.geo,
                            date,
                            formattedTraffic,
                            relatedQueries,
                            articles,
                        };
                    case 'queries':
                        return [
                            {
                                parentQuery: null,
                                parentExploreLink: null,
                                ...rest.title,
                                date,
                                geo: input.geo,
                                formattedTraffic,
                            },
                            ...relatedQueries.map((related) => ({
                                parentQuery: rest.title.query,
                                parentExploreLink: rest.title.exploreLink,
                                ...related,
                                date,
                                geo: input.geo,
                                formattedTraffic: null,
                            })),
                        ];
                    case 'related':
                        return relatedQueries.map((related) => ({
                            parentQuery: rest.title.query,
                            parentExploreLink: rest.title.exploreLink,
                            ...related,
                            date,
                            geo: input.geo,
                        }));
                    case 'articles':
                        return articles.map((article) => ({
                            ...rest.title,
                            ...article,
                            date,
                            formattedTraffic,
                            geo: input.geo,
                        }));
                    default: return [];
                }
            });
        },
        filter: async () => --maxItems > 0,
        output: async (item) => {
            await Apify.pushData(item);
        },
        key: 'extendOutputFunction',
        input,
        helpers: {
            parsedTo,
            parsedFrom,
            fromDate,
            toDate,
            _,
            moment,
        },
    });

    const extendScraperFunction = await extendFunction({
        key: 'extendScraperFunction',
        input,
        helpers: {
            parsedTo,
            parsedFrom,
            requestQueue,
            addUrl,
            extendOutputFunction,
            fromDate,
            toDate,
            _,
            moment,
        },
    });

    log.info(`Adding periods from ${new Date(parsedFrom)} to ${new Date(parsedTo)}`);

    const startDate = moment(parsedFrom);

    while (days-- >= 0) {
        await addUrl(input.geo, startDate.format('YYYYMMDD'));
        startDate.subtract(1, 'day');
    }

    const crawler = new Apify.CheerioCrawler({
        useSessionPool: true,
        proxyConfiguration: proxyConfig,
        ignoreSslErrors: true,
        requestQueue,
        maxRequestRetries: 10,
        additionalMimeTypes: ['application/json'],
        handlePageFunction: async ({ body, request, response, session }) => {
            try {
                const json = JSON.parse(body.toString().split('\n', 2)[1]);

                await extendScraperFunction(json, {
                    request,
                    response,
                });

                await extendOutputFunction(json, {
                    request,
                    response,
                });
            } catch (e) {
                session.retire();
                throw e;
            }
        },
        handleFailedRequestFunction: async ({ request }) => {
            await Apify.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
    });

    await crawler.run();

    log.info('Done!');
});
