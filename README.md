## What is Google Trending Searches Scraper?

This scraper is designed to extract data from [Daily Search Trends](https://trends.google.com/trends/trendingsearches/daily) in the Trending Searches section on [Google Trends](https://trends.google.com/trends/). It creates a Google Trending Searches API that is not constrained by the quotas or limits imposed by Google Trends.

## Features

Why use our Google Trending Searches API to extract information from Google Trends?

- The data you get from this scraper is flat and not nested in JSON format.
- The data it outputs is designed to be CSV friendly, so you can immediately use it in spreadsheets, applications, reports, or other Apify actors.
- You can select your own time frame by setting "to" and "from" dates".
- You can freely select the region or regions to be scraped.
- You can easily use our scheduler to scrape data when you need it.
- Our scraper is not limited by the unpredictable quotas or limits imposed by Google Trends.

Note that Google Trending Searches can only provide data going back 29 days, so our API cannot overcome this limitation.

If you use Google Trending Searches Scraper with our [Google Trends Scraper](https://apify.com/emastra/google-trends-scraper), you can get a lot of useful data from Google Trends and use it for market research or search engine optimization. If you need inspiration, check out some of the use cases suggested on our [Marketing & Media](https://apify.com/industries/marketing-and-media) industries page or read our blog post about using Apify Store to [power your SEO toolbox](https://blog.apify.com/apify-seo-tools).

You can also combine this actor with tools such as our [Google Sheets Import & Export](https://apify.com/lukaskrivka/google-sheets) to automatically feed the data into Google Sheets.

The data extracted can be downloaded in a range of formats, including JSON, CSV, XML, HTML, and Excel.

## Cost of usage

Running the Google Trending Searches Scraper will consume **platform credits**. Every Apify subscription plan includes a set monthly USD amount of platform credits. If you require more, you will have to upgrade your plan. Check our [platform pricing](https://apify.com/pricing/actors) and [subscription plan](https://apify.com/pricing) pages for details.

You can expect to spend less than **$0.10 for 1,000 results**, so your monthly free platform credits should be enough for many actor runs. The best way to find out how many platform credits an actor will consume is to perform a test run. You can then review platform usage in [Billing](https://my.apify.com/billing-new) and figure out the best Apify subscription plan for your needs. 

If you want something special or require end-to-end service, you can also [request a custom solution](https://apify.com/custom-solutions).

## Tutorial

Check out our [step-by-step guide to using the Google Trending Searches Scraper](https://blog.apify.com/how-to-scrape-google-trending-searches) or email us at support@apify.com if you need any help.

You can also join the conversation on [our Discord server](https://discord.com/invite/jyEM2PRvMU), where the Apify team and community regularly discuss web scraping tips and tricks.

## Input and Output

This actor has been developed to take advantage of the new extended output functionality of the Apify platform. That means that your selected input parameters directly impact the output datasets.

Input:

```jsonc
{
    "outputMode": "complete", // can be queries or articles
    "geo": "US", // 2 letter ISO code for country, not every country is supported
    "fromDate": "2 day", // from 2 days ago
    "toDate": "3 day", // until 3 days ago
    "proxy": { // required!
        "useApifyProxy": true
    }
}
```

You can choose from four different output modes:

- Complete: this scrapes everything along with nested articles (note that this is not Excel or CSV friendly)

```jsonc
{
  "query": "Lady Gaga",
  "exploreLink": "https://trends.google.com/trends/explore?q=Lady+Gaga&date=now+7-d&geo=US",
  "geo": "US",
  "date": "2021-01-20T03:00:00.000Z",
  "formattedTraffic": 1000000,
  "relatedQueries": [
    {
      "query": "Jennifer Lopez",
      "exploreLink": "https://trends.google.com/trends/explore?q=Jennifer+Lopez&date=now+7-d&geo=US"
    }
    // ...
  ],
  "articles": [
    {
      "title": /**/,
      "timeAgo": "12h ago",
      "source": /**/,
      "image": {
        "newsUrl": /**/,
        "source": /**/,
        "imageUrl": "https://t1.gstatic.com/images?q=tbn:ANd9GcTXemenozGptpcdEIVEqXAce5xohz46QYgrLgN_8jAjNyLanDyhJvDtkFXoDXwbWMBLnU4funD7"
      },
      "url": /**/,
      "snippet": "Lady Gaga belted out the national anthem Wednesday in a very Gaga way — with flamboyance, fashion and passion. Watch her performance here."
    }
    // ...
  ]
}
```

- Queries: this scrapes only queries, related queries, and traffic information (CSV or Excel friendly)


```jsonc
{
  "parentQuery": "Inauguration",
  "parentExploreLink": "https://trends.google.com/trends/explore?q=Inauguration&date=now+7-d&geo=US",
  "query": "Inauguration Day",
  "exploreLink": "https://trends.google.com/trends/explore?q=Inauguration+Day&date=now+7-d&geo=US",
  "date": "2021-01-19T03:00:00.000Z",
  "geo": "US",
  "formattedTraffic": null
}
```

- Related queries only: this is a stripped-down version of queries that only scrapes related queries

```jsonc
{
  "parentQuery": "Nets",
  "parentExploreLink": "https://trends.google.com/trends/explore?q=Nets&date=now+7-d&geo=US",
  "query": "Brooklyn Nets",
  "exploreLink": "https://trends.google.com/trends/explore?q=Brooklyn+Nets&date=now+7-d&geo=US",
  "date": "2021-01-19T03:00:00.000Z",
  "geo": "US"
}
```

- Articles: just returns one article per dataset item

```jsonc
{
  "query": "Lady Gaga",
  "exploreLink": "https://trends.google.com/trends/explore?q=Lady+Gaga&date=now+7-d&geo=US",
  "title": "This Is the Lipstick Lady Gaga Wore for Her Inauguration Performance",
  "timeAgo": "9h ago",
  "source": "Glamour",
  "image": {
    "newsUrl": "https://www.glamour.com/story/lady-gaga-inauguration-performance-lipstick",
    "source": "Glamour",
    "imageUrl": "https://t2.gstatic.com/images?q=tbn:ANd9GcQdek3suLs_WBYf6UmwHpR80xiQRAU6WQGx5DCz67so8-uTyWmTQ5X7FrxY6tCbTSdieOAoWV6-"
  },
  "url": "https://www.glamour.com/story/lady-gaga-inauguration-performance-lipstick",
  "snippet": "Here&#39;s the bold lip crayon that held up during Lady Gaga&#39;s inauguration performance. That red color was such a moment.",
  "date": "2021-01-20T03:00:00.000Z",
  "formattedTraffic": 1000000,
  "geo": "US"
}
```

## Limitations

Google Trending Searches can only provide data up to 29 days ago.

## License

Apache 2.0
