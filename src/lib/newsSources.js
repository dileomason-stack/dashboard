// News sources the News widget offers. api/news.js only fetches these URLs,
// so it can't be used to fetch arbitrary websites.
export const NEWS_SOURCES = {
  npr: { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
  bbc: { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  nyt: { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml' },
  mustang: { name: 'Mustang News (Cal Poly)', url: 'https://mustangnews.net/feed/' },
  espn: { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
  verge: { name: 'The Verge (tech)', url: 'https://www.theverge.com/rss/index.xml' },
  hn: { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
}
