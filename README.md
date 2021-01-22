# Google Trending Searches

Extract information from daily trending searches on locations https://trends.google.com/trends/trendingsearches/daily
This actor can be used in conjunction with https://apify.com/emastra/google-trends-scraper

## Results

You can output results in 3 formats:

Complete (non Excel / CSV friendly):

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

Queries (CSV / Excel friendly):

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

Related queries only (stripped down version of queries):

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

Articles:

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

## Input

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

## Limitations

Google Trending Searches can only provide data up to 29 days ago.

## License

Apache 2.0
