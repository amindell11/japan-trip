// Trip data. Edit, commit, push — everyone sees it on refresh.
// When we migrate to Firebase later, only getTripData() changes.

const TRIP_DATA = {
  title: "Japan Trip",
  sections: [
    {
      name: "Tokyo",
      groups: [
        {
          name: "Central / Major Districts",
          places: [
            {
              name: "Shibuya Crossing",
              travel: "2 stops from Shinjuku · 7 min",
              summary:
                "The world's busiest pedestrian crossing. Best at dusk with the neon signs lighting up. Gateway to Shibuya's shopping and nightlife.",
              tags: ["urban", "iconic", "nightlife"],
              wiki: "Shibuya_Crossing",
              coords: [35.6595, 139.7004],
              links: [
                { label: "Shibuya Sky (observation deck)", url: "https://www.shibuya-scramble-square.com/sky/en/" },
              ],
            },
            {
              name: "Shinjuku / Golden Gai",
              summary:
                "Tokyo's biggest transit hub surrounded by shopping and restaurants. Golden Gai is a maze of 200+ tiny themed bars seating 5–10 people each — perfect for a group night out.",
              tags: ["nightlife", "food", "drinks"],
              wiki: "Golden_Gai",
              coords: [35.6938, 139.7036],
            },
            {
              name: "Harajuku / Takeshita Street",
              travel: "1 stop from Shinjuku · 5 min",
              summary:
                "Youth fashion capital. Takeshita Street is packed with wild fashion shops, crepe stands, and quirky cafes. Adjacent to Meiji Shrine and Yoyogi Park.",
              tags: ["fashion", "shopping", "food"],
              wiki: "Takeshita_Street",
              coords: [35.6716, 139.7031],
            },
            {
              name: "Asakusa / Senso-ji Temple",
              travel: "15 stops from Shinjuku · 30 min",
              summary:
                "Tokyo's oldest Buddhist temple with the iconic red lantern gate. Nakamise-dori leading up to it is lined with snack shops and souvenirs.",
              tags: ["temple", "historic", "cultural"],
              wiki: "Sensō-ji",
              coords: [35.7148, 139.7967],
              links: [
                { label: "Official site", url: "https://www.senso-ji.jp/" },
              ],
            },
            {
              name: "Akihabara",
              travel: "10 stops from Shinjuku · 20 min",
              summary:
                "'Electric Town' — anime, manga, retro games, electronics. Multi-story arcades and maid cafes. The touristy version of what Nakano Broadway does more authentically.",
              tags: ["anime", "shopping", "arcades"],
              wiki: "Akihabara",
              coords: [35.7022, 139.7745],
            },
            {
              name: "Ueno Park",
              travel: "10 stops from Shinjuku · 20 min",
              summary:
                "Massive park with museums, a zoo, shrines, and Shinobazu Pond. Good for a relaxed morning or rainy-day museum hopping.",
              tags: ["park", "museum", "chill"],
              wiki: "Ueno_Park",
              coords: [35.7148, 139.7731],
              links: [
                { label: "Tokyo National Museum", url: "https://www.tnm.jp/?lang=en" },
                { label: "Ueno Zoo", url: "https://www.tokyo-zoo.net/english/ueno/" },
              ],
            },
            {
              name: "Meiji Shrine",
              travel: "1 stop from Shinjuku · 5 min",
              summary:
                "170 acres of forest surrounding a serene shrine. Pairs with Harajuku and Takeshita Street since they're adjacent.",
              tags: ["shrine", "nature", "cultural"],
              wiki: "Meiji_Shrine",
              coords: [35.6764, 139.6993],
              links: [
                { label: "Official site", url: "https://www.meijijingu.or.jp/en/" },
              ],
            },
            {
              name: "Samurai Experience",
              summary:
                "Multiple options in Asakusa and Shinjuku. Samurai Museum Shinjuku has sword-cutting classes. Also available in Kyoto if you'd rather do it there.",
              tags: ["cultural", "activity"],
              wiki: "Samurai",
              coords: [35.6938, 139.7036],
              links: [
                { label: "Samurai Museum Shinjuku", url: "https://www.samuraimuseum.jp/" },
              ],
            },
            {
              name: "Beach Day / Enoshima",
              travel: "25 stops from Shinjuku · 1 hr",
              summary:
                "Part of the Kamakura day trip. Enoshima island has a small beach, and the nearby Shonan coast (Yuigahama, Zushi) has longer stretches of sand.",
              tags: ["beach", "day-trip"],
              wiki: "Enoshima",
              coords: [35.2994, 139.4800],
              links: [
                { label: "Enoshima visitor info", url: "https://enoshima-seacandle.com/en/" },
              ],
            },
            {
              name: "Onsen / Hot Springs",
              summary:
                "Available everywhere. Tokyo: Hakone (1.5 hrs). Kyoto: GRAX glamping, Kurama Onsen (30 min north). Osaka: Spring Hiyoshi campground. Public sento usually ¥500–1,000.",
              tags: ["wellness", "activity"],
              wiki: "Onsen",
            },
          ],
        },
        {
          name: "West Tokyo / Chuo Line (Professor's Picks)",
          places: [
            {
              name: "Nakano",
              travel: "2 stops from Shinjuku · 5 min",
              summary:
                "Nakano Broadway is the locals' alternative to Akihabara: retro anime, vintage toys, manga at better prices with zero tourist crowds. Great food stalls in the basement.",
              tags: ["anime", "shopping", "local"],
              wiki: "Nakano_Broadway",
              coords: [35.7084, 139.6654],
              links: [
                { label: "Nakano Broadway", url: "https://nbw.jp/" },
              ],
            },
            {
              name: "Koenji",
              travel: "3 stops from Shinjuku · 6 min",
              summary:
                "Tokyo's punk-rock / bohemian quarter. Japan's best vintage and thrift shopping, indie live music venues, amazing izakaya alleys.",
              tags: ["vintage", "nightlife", "local"],
              wiki: "Kōenji",
              coords: [35.7056, 139.6497],
            },
            {
              name: "Kichijoji / Inokashira Park",
              travel: "15 min from Shinjuku",
              summary:
                "Beloved neighborhood centered around Inokashira Park with its pond, swan boats, and forested paths. Harmonica Yokocho alley has tiny food stalls. Near the Ghibli Museum (book months ahead).",
              tags: ["park", "ghibli", "local"],
              wiki: "Kichijōji",
              coords: [35.7002, 139.5795],
              links: [
                { label: "Ghibli Museum", url: "https://www.ghibli-museum.jp/en/" },
                { label: "Ghibli tickets (Lawson)", url: "https://l-tike.com/ghibli-museum/" },
              ],
            },
          ],
        },
        {
          name: "South/West of Shibuya (Professor's Picks)",
          places: [
            {
              name: "Shimokitazawa",
              travel: "2 min from Shinjuku (Odakyu Line)",
              summary:
                "Maybe Tokyo's coolest neighborhood. Indie theaters, vintage clothing, tiny live music bars, specialty coffee shops. Bohemian and walkable.",
              tags: ["vintage", "nightlife", "local"],
              wiki: "Shimokitazawa",
              coords: [35.6614, 139.6680],
            },
            {
              name: "Daikanyama",
              travel: "Walking distance from Shibuya",
              summary:
                "Upscale but chill. Famous for the stunning T-Site Tsutaya bookstore. Boutiques, cafes, and a very 'grown-up Tokyo' feel.",
              tags: ["cafe", "shopping", "upscale"],
              wiki: "Daikanyama",
              coords: [35.6497, 139.7030],
              links: [
                { label: "Daikanyama T-Site", url: "https://store.tsite.jp/daikanyama/" },
              ],
            },
            {
              name: "Jiyugaoka",
              travel: "10 min south of Shibuya",
              summary:
                "European village feel with cobblestone-style streets, patisseries, and dessert shops. Good for an afternoon stroll and sweets.",
              tags: ["dessert", "cafe", "charming"],
              wiki: "Jiyūgaoka",
              coords: [35.6076, 139.6682],
            },
          ],
        },
        {
          name: "Nature & Hikes",
          places: [
            {
              name: "Mount Takao",
              travel: "50 min west from Shinjuku",
              summary:
                "Multiple trails up a forested mountain. Trail 6 has stream crossings and forest canopy. Summit views of Mt. Fuji on clear days. Easy half-day — pairs with Kichijoji on the way back.",
              tags: ["hike", "nature", "fuji-view"],
              wiki: "Mount_Takao",
              coords: [35.6254, 139.2437],
              links: [
                { label: "Cable car / chairlift", url: "https://www.takaotozan.co.jp/" },
              ],
            },
            {
              name: "TeamLab Planets",
              summary:
                "Immersive barefoot walk-through art installation themed around water and forests. Book in advance. Best in the evening.",
              tags: ["art", "immersive", "indoor"],
              wiki: "TeamLab",
              coords: [35.6493, 139.7901],
              links: [
                { label: "Official & tickets", url: "https://www.teamlab.art/e/planets/" },
              ],
            },
          ],
        },
        {
          name: "Day Trips from Tokyo",
          places: [
            {
              name: "Lake Kawaguchi / Mt. Fuji",
              travel: "2 hrs by bus from Shinjuku",
              summary:
                "Lakeside biking with Mt. Fuji views, Kachi Kachi Ropeway, camping overnight. Your camping night 1.",
              tags: ["nature", "camping", "fuji-view"],
              wiki: "Lake_Kawaguchi",
              coords: [35.5142, 138.7530],
              links: [
                { label: "Mt. Fuji Panoramic Ropeway", url: "https://www.mtfujiropeway.jp/en/" },
                { label: "Highway bus (Shinjuku → Kawaguchiko)", url: "https://highway-buses.jp/" },
              ],
            },
            {
              name: "Kamakura & Enoshima",
              travel: "1 hr south by train",
              summary:
                "Coastal town with a giant bronze Buddha, forested hillside temple trails, and Enoshima island with ocean panoramas and seafood.",
              tags: ["historic", "beach", "day-trip"],
              wiki: "Kamakura",
              coords: [35.3193, 139.5466],
              links: [
                { label: "Kotoku-in (Great Buddha)", url: "https://www.kotoku-in.jp/en/" },
                { label: "Enoden (Enoshima Electric Railway)", url: "https://www.enoden.co.jp/en/" },
              ],
            },
            {
              name: "Kawagoe",
              travel: "30 min north by train",
              summary:
                "'Little Edo' — preserved Edo-period merchant architecture, a famous bell tower, and a candy lane. Easy half-day trip, great for photos.",
              tags: ["historic", "day-trip"],
              wiki: "Kawagoe,_Saitama",
              coords: [35.9251, 139.4858],
              links: [
                { label: "Kawagoe tourism", url: "https://www.koedo.or.jp/foreign/english/" },
              ],
            },
            {
              name: "Hakone",
              travel: "1.5 hrs from Shinjuku",
              summary:
                "Hot springs, Lake Ashi cruise, cable cars, Fuji views. Overlaps with Kawaguchi plans — probably save for a future trip.",
              tags: ["onsen", "day-trip", "fuji-view"],
              wiki: "Hakone,_Kanagawa",
              coords: [35.2321, 139.1069],
              links: [
                { label: "Hakone Ropeway", url: "https://www.hakoneropeway.co.jp/foreign/en/" },
                { label: "Hakone Free Pass", url: "https://www.odakyu.jp/english/passes/hakone/" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Kyoto",
      groups: [
        {
          name: "Central Kyoto",
          places: [
            {
              name: "Fushimi Inari Taisha",
              summary:
                "Thousands of vermillion torii gates winding up a forested mountainside. The summit hike takes ~2 hours and most tourists skip it — do the whole thing.",
              tags: ["shrine", "hike", "iconic"],
              wiki: "Fushimi_Inari-taisha",
              coords: [34.9671, 135.7727],
              links: [
                { label: "Official site", url: "https://inari.jp/en/" },
              ],
            },
            {
              name: "Kinkaku-ji / Golden Pavilion",
              summary:
                "Gold-leafed temple reflected in a mirror pond. Iconic photo spot, ¥500 entry. Serene gardens.",
              tags: ["temple", "iconic"],
              wiki: "Kinkaku-ji",
              coords: [35.0394, 135.7292],
              links: [
                { label: "Official site", url: "https://www.shokoku-ji.jp/kinkakuji/" },
              ],
            },
            {
              name: "Gion District",
              summary:
                "The old geisha quarter with traditional wooden machiya houses, lantern-lit alleys, and tea houses. Best in the evening.",
              tags: ["historic", "cultural", "nightlife"],
              wiki: "Gion",
              coords: [35.0036, 135.7778],
              links: [
                { label: "Gion Corner (traditional arts show)", url: "https://www.kyoto-gioncorner.com/global/en.html" },
              ],
            },
            {
              name: "Philosopher's Path",
              summary:
                "Peaceful 2km canal-side walking path lined with trees, connecting several temples. Quiet and meditative.",
              tags: ["walking", "scenic", "chill"],
              wiki: "Philosopher's_Walk",
              coords: [35.0269, 135.7945],
              links: [
                { label: "Ginkaku-ji (north end)", url: "https://www.shokoku-ji.jp/ginkakuji/" },
                { label: "Nanzen-ji (south end)", url: "https://www.nanzenji.or.jp/" },
              ],
            },
            {
              name: "Tadasu no Mori",
              summary:
                "Inside Shimogamo Shrine near the Kamo River. 20-min walk from Demachiyanagi Station. Pairs with Kinkaku-ji or the Philosopher's Path.",
              tags: ["shrine", "nature"],
              wiki: "Shimogamo_Shrine",
              coords: [35.0392, 135.7726],
              links: [
                { label: "Shimogamo Shrine", url: "https://www.shimogamo-jinja.or.jp/" },
              ],
            },
            {
              name: "Samurai Kembu Kyoto",
              summary:
                "Near Gion — sword and fan performance classes. More traditional / atmospheric setting than the Tokyo samurai spots.",
              tags: ["cultural", "activity"],
              wiki: "Samurai",
              coords: [35.0054, 135.7738],
              links: [
                { label: "Official & booking", url: "https://www.samurai-kembu.jp/" },
              ],
            },
          ],
        },
        {
          name: "Arashiyama (West Kyoto)",
          places: [
            {
              name: "Arashiyama Bamboo Forest",
              summary:
                "Towering bamboo canopy creating a cathedral-like corridor. Rent bikes to explore the wider area: the river, Togetsukyo Bridge, and the monkey park.",
              tags: ["nature", "iconic"],
              wiki: "Arashiyama",
              coords: [35.0170, 135.6714],
              links: [
                { label: "Iwatayama Monkey Park", url: "https://monkeypark.jp/en/" },
                { label: "Tenryu-ji Temple", url: "https://www.tenryuji.com/en/" },
              ],
            },
          ],
        },
        {
          name: "Day Trips from Kyoto",
          places: [
            {
              name: "Nara Park & Todai-ji",
              travel: "45 min by train",
              summary:
                "Over 1,000 wild deer that bow for crackers. Todai-ji houses a massive bronze Buddha in the world's largest wooden building.",
              tags: ["deer", "historic", "day-trip"],
              wiki: "Nara_Park",
              coords: [34.6851, 135.8430],
              links: [
                { label: "Todai-ji official", url: "https://www.todaiji.or.jp/en/" },
                { label: "Nara tourism", url: "https://narashikanko.or.jp/en/" },
              ],
            },
            {
              name: "Kasugayama Primeval Forest",
              summary:
                "UNESCO ancient forest untouched since AD 841 — behind Kasuga Shrine in Nara. Mossy stone paths, stone Buddha caves, waterfalls. ~3.5 hours moderate hike. Pairs perfectly with Nara.",
              tags: ["hike", "nature", "unesco"],
              wiki: "Kasugayama_Primeval_Forest",
              coords: [34.6828, 135.8614],
              links: [
                { label: "Kasuga Taisha shrine", url: "https://www.kasugataisha.or.jp/about_en/" },
              ],
            },
          ],
        },
        {
          name: "Camping Near Kyoto",
          places: [
            {
              name: "Kasagi Campground",
              travel: "45 min south by JR",
              summary:
                "30,000 sqm riverside campground along the Kizu River. No reservation needed, ~¥1,000/person. Stargazing, hiking, rock climbing. BYO gear.",
              tags: ["camping", "budget"],
              wiki: "Kasagi,_Kyoto",
              coords: [34.7803, 135.9456],
            },
            {
              name: "Spring Hiyoshi Camp Field",
              summary:
                "Near Hiyoshi Dam. Hot springs, canoeing, SUP on the dam lake. Tent rental available, English-speaking staff. 25-min walk from JR Hiyoshi Station.",
              tags: ["camping", "onsen", "water"],
              wiki: "",
              coords: [35.1708, 135.5731],
            },
            {
              name: "GRAX Rurikei",
              travel: "1 hr 15 min from Kyoto",
              summary:
                "Luxury glamping resort with onsen. Everything provided — tents, food, cooking gear. Most expensive but zero effort.",
              tags: ["glamping", "onsen", "upscale"],
              wiki: "",
              coords: [35.1825, 135.4814],
            },
          ],
        },
      ],
    },
    {
      name: "Osaka",
      groups: [
        {
          name: "Central Osaka",
          places: [
            {
              name: "Dotonbori",
              summary:
                "Osaka's neon-lit food street along a canal. Heart of Japan's street food scene: takoyaki, okonomiyaki, kushikatsu. Loud, bright, and best at night.",
              tags: ["food", "nightlife", "iconic"],
              wiki: "Dōtonbori",
              coords: [34.6687, 135.5013],
            },
            {
              name: "Osaka Castle",
              summary:
                "Iconic castle surrounded by a huge park. Museum inside with city views from the top floor. Great grounds for a stroll.",
              tags: ["historic", "castle"],
              wiki: "Osaka_Castle",
              coords: [34.6873, 135.5259],
              links: [
                { label: "Official site", url: "https://www.osakacastle.net/english/" },
              ],
            },
            {
              name: "Shinsekai",
              summary:
                "Retro neighborhood with a gritty, old-school charm. Famous for kushikatsu and the Tsutenkaku Tower. More local and less polished than Dotonbori.",
              tags: ["food", "retro", "local"],
              wiki: "Shinsekai",
              coords: [34.6520, 135.5063],
              links: [
                { label: "Tsutenkaku Tower", url: "https://www.tsutenkaku.co.jp/en/" },
              ],
            },
          ],
        },
        {
          name: "Nature Near Osaka",
          places: [
            {
              name: "Minoh Falls",
              travel: "30 min north by train",
              summary:
                "Easy 2.7km paved trail through a forested gorge to a beautiful 33m waterfall. Try the maple leaf tempura along the path. Perfect half-day nature escape.",
              tags: ["hike", "waterfall", "nature"],
              wiki: "Mino,_Osaka",
              coords: [34.8554, 135.4716],
            },
            {
              name: "Universal Studios Japan",
              summary:
                "West Osaka. The alternative to a nature day if anyone wants Super Nintendo World.",
              tags: ["theme-park"],
              wiki: "Universal_Studios_Japan",
              coords: [34.6654, 135.4323],
              links: [
                { label: "Official site", url: "https://www.usj.co.jp/web/en/us" },
                { label: "Tickets", url: "https://www.usj.co.jp/web/en/us/tickets" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Optional Add-ons",
      groups: [
        {
          name: "If Schedule Allows",
          places: [
            {
              name: "Miyajima Island",
              summary:
                "From Osaka via Hiroshima. The floating torii gate of Itsukushima Shrine, wild deer, and a forested hike up Mt. Misen with Inland Sea views. Long but rewarding day trip.",
              tags: ["shrine", "hike", "day-trip"],
              wiki: "Itsukushima",
              coords: [34.2958, 132.3197],
              links: [
                { label: "Itsukushima Shrine", url: "https://www.itsukushimajinja.jp/en/" },
                { label: "Miyajima Ropeway (Mt. Misen)", url: "https://miyajima-ropeway.info/english/" },
              ],
            },
            {
              name: "Kamikochi",
              summary:
                "Japanese Alps river valley at 1,500m surrounded by 3,000m peaks. Perfect June weather. Serious nature immersion.",
              tags: ["nature", "hike", "alps"],
              wiki: "Kamikōchi",
              coords: [36.2477, 137.6368],
              links: [
                { label: "Kamikochi official (EN)", url: "https://www.kamikochi.or.jp/english/" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}

function eachPlace(data, fn) {
  for (const section of data.sections) {
    for (const group of section.groups) {
      for (const place of group.places) {
        fn(place, { section, group });
      }
    }
  }
}

function findPlaceBySlug(data, slug) {
  let found = null;
  eachPlace(data, (place, ctx) => {
    if (!found && slugify(place.name) === slug) {
      found = { place, ...ctx };
    }
  });
  return found;
}

function getTripData() {
  return Promise.resolve(TRIP_DATA);
}
