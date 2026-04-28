// ─────────────────────────────────────────────────────────────────────────────
// NEWS DATA
// Future: replace static array with Supabase fetch
//   const { data } = await supabase.from('news_items').select('*').order('published_at', { ascending: false }).limit(12)
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  publishedAt: string // ISO date string
}

// Updated weekly — this snapshot feeds the current news surfaces
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    title: 'Democrats sue to block new Georgia election-certification rules',
    source: 'CNN Politics',
    url: '#',
    publishedAt: '2026-03-24',
  },
  {
    id: '2',
    title: "Campaign cash and strategy shape the crowded fight for the Georgia governor's mansion",
    source: 'WABE',
    url: '#',
    publishedAt: '2026-03-23',
  },
  {
    id: '3',
    title: "Experts shift Georgia governor's race to 'toss up' as primary fields solidify",
    source: 'News from the States',
    url: '#',
    publishedAt: '2026-03-22',
  },
  {
    id: '4',
    title: 'Georgia House passes 60-day suspension of gas tax amid rising prices from Iran conflict',
    source: 'WABE',
    url: '#',
    publishedAt: '2026-03-21',
  },
  {
    id: '5',
    title: 'Georgia appeals court rules Fulton County can reject GOP election board picks',
    source: 'CBS News Atlanta',
    url: '#',
    publishedAt: '2026-03-20',
  },
  {
    id: '6',
    title: "Atlanta PD on high alert due to planned 'teen takeover' threat this weekend",
    source: 'WSB-TV',
    url: '#',
    publishedAt: '2026-03-19',
  },
  {
    id: '7',
    title: 'ICE agents deploying to Hartsfield-Jackson Atlanta airport starting Monday',
    source: 'WSB-TV',
    url: '#',
    publishedAt: '2026-03-18',
  },
  {
    id: '8',
    title: "Feral hogs can't catch a break in Georgia as lawmakers enlist cutting-edge tech to hunt them down",
    source: 'Capitol Beat',
    url: '#',
    publishedAt: '2026-03-17',
  },
  {
    id: '9',
    title: 'Top US FEMA official claims to have teleported to a Waffle House in Rome, Georgia',
    source: 'AP News',
    url: '#',
    publishedAt: '2026-03-16',
  },
]
