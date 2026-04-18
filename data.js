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
            },
            {
              name: "Shinjuku / Golden Gai",
              summary:
                "Tokyo's biggest transit hub surrounded by shopping and restaurants. Golden Gai is a maze of 200+ tiny themed bars seating 5–10 people each — perfect for a group night out.",
              tags: ["nightlife", "food", "drinks"],
              wiki: "Golden_Gai",
            },
            {
              name: "Harajuku / Takeshita Street",
              travel: "1 stop from Shinjuku · 5 min",
              summary:
                "Youth fashion capital. Takeshita Street is packed with wild fashion shops, crepe stands, and quirky cafes. Adjacent to Meiji Shrine and Yoyogi Park.",
              tags: ["fashion", "shopping", "food"],
              wiki: "Takeshita_Street",
            },
            {
              name: "Asakusa / Senso-ji Temple",
              travel: "15 stops from Shinjuku · 30 min",
              summary:
                "Tokyo's oldest Buddhist temple with the iconic red lantern gate. Nakamise-dori leading up to it is lined with snack shops and souvenirs.",
              tags: ["temple", "historic", "cultural"],
              wiki: "Sensō-ji",
            },
            {
              name: "Akihabara",
              travel: "10 stops from Shinjuku · 20 min",
              summary:
                "'Electric Town' — anime, manga, retro games, electronics. Multi-story arcades and maid cafes. The touristy version of what Nakano Broadway does more authentically.",
              tags: ["anime", "shopping", "arcades"],
              wiki: "Akihabara",
            },
            {
              name: "Ueno Park",
              travel: "10 stops from Shinjuku · 20 min",
              summary:
                "Massive park with museums, a zoo, shrines, and Shinobazu Pond. Good for a relaxed morning or rainy-day museum hopping.",
              tags: ["park", "museum", "chill"],
              wiki: "Ueno_Park",
            },
            {
              name: "Meiji Shrine",
              travel: "1 stop from Shinjuku · 5 min",
              summary:
                "170 acres of forest surrounding a serene shrine. Pairs with Harajuku and Takeshita Street since they're adjacent.",
              tags: ["shrine", "nature", "cultural"],
              wiki: "Meiji_Shrine",
            },
            {
              name: "Samurai Experience",
              summary:
                "Multiple options in Asakusa and Shinjuku. Samurai Museum Shinjuku has sword-cutting classes. Also available in Kyoto if you'd rather do it there.",
              tags: ["cultural", "activity"],
              wiki: "Samurai",
            },
            {
              name: "Beach Day / Enoshima",
              travel: "25 stops from Shinjuku · 1 hr",
              summary:
                "Part of the Kamakura day trip. Enoshima island has a small beach, and the nearby Shonan coast (Yuigahama, Zushi) has longer stretches of sand.",
              tags: ["beach", "day-trip"],
              wiki: "Enoshima",
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
            },
            {
              name: "Koenji",
              travel: "3 stops from Shinjuku · 6 min",
              summary:
                "Tokyo's punk-rock / bohemian quarter. Japan's best vintage and thrift shopping, indie live music venues, amazing izakaya alleys.",
              tags: ["vintage", "nightlife", "local"],
              wiki: "Kōenji",
            },
            {
              name: "Kichijoji / Inokashira Park",
              travel: "15 min from Shinjuku",
              summary:
                "Beloved neighborhood centered around Inokashira Park with its pond, swan boats, and forested paths. Harmonica Yokocho alley has tiny food stalls. Near the Ghibli Museum (book months ahead).",
              tags: ["park", "ghibli", "local"],
              wiki: "Kichijōji",
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
            },
            {
              name: "Daikanyama",
              travel: "Walking distance from Shibuya",
              summary:
                "Upscale but chill. Famous for the stunning T-Site Tsutaya bookstore. Boutiques, cafes, and a very 'grown-up Tokyo' feel.",
              tags: ["cafe", "shopping", "upscale"],
              wiki: "Daikanyama",
            },
            {
              name: "Jiyugaoka",
              travel: "10 min south of Shibuya",
              summary:
                "European village feel with cobblestone-style streets, patisseries, and dessert shops. Good for an afternoon stroll and sweets.",
              tags: ["dessert", "cafe", "charming"],
              wiki: "Jiyūgaoka",
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
            },
            {
              name: "TeamLab Planets",
              summary:
                "Immersive barefoot walk-through art installation themed around water and forests. Book in advance. Best in the evening.",
              tags: ["art", "immersive", "indoor"],
              wiki: "TeamLab",
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
            },
            {
              name: "Kamakura & Enoshima",
              travel: "1 hr south by train",
              summary:
                "Coastal town with a giant bronze Buddha, forested hillside temple trails, and Enoshima island with ocean panoramas and seafood.",
              tags: ["historic", "beach", "day-trip"],
              wiki: "Kamakura",
            },
            {
              name: "Kawagoe",
              travel: "30 min north by train",
              summary:
                "'Little Edo' — preserved Edo-period merchant architecture, a famous bell tower, and a candy lane. Easy half-day trip, great for photos.",
              tags: ["historic", "day-trip"],
              wiki: "Kawagoe,_Saitama",
            },
            {
              name: "Hakone",
              travel: "1.5 hrs from Shinjuku",
              summary:
                "Hot springs, Lake Ashi cruise, cable cars, Fuji views. Overlaps with Kawaguchi plans — probably save for a future trip.",
              tags: ["onsen", "day-trip", "fuji-view"],
              wiki: "Hakone,_Kanagawa",
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
            },
            {
              name: "Kinkaku-ji / Golden Pavilion",
              summary:
                "Gold-leafed temple reflected in a mirror pond. Iconic photo spot, ¥500 entry. Serene gardens.",
              tags: ["temple", "iconic"],
              wiki: "Kinkaku-ji",
            },
            {
              name: "Gion District",
              summary:
                "The old geisha quarter with traditional wooden machiya houses, lantern-lit alleys, and tea houses. Best in the evening.",
              tags: ["historic", "cultural", "nightlife"],
              wiki: "Gion",
            },
            {
              name: "Philosopher's Path",
              summary:
                "Peaceful 2km canal-side walking path lined with trees, connecting several temples. Quiet and meditative.",
              tags: ["walking", "scenic", "chill"],
              wiki: "Philosopher's_Walk",
            },
            {
              name: "Tadasu no Mori",
              summary:
                "Inside Shimogamo Shrine near the Kamo River. 20-min walk from Demachiyanagi Station. Pairs with Kinkaku-ji or the Philosopher's Path.",
              tags: ["shrine", "nature"],
              wiki: "Shimogamo_Shrine",
            },
            {
              name: "Samurai Kembu Kyoto",
              summary:
                "Near Gion — sword and fan performance classes. More traditional / atmospheric setting than the Tokyo samurai spots.",
              tags: ["cultural", "activity"],
              wiki: "Samurai",
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
            },
            {
              name: "Kasugayama Primeval Forest",
              summary:
                "UNESCO ancient forest untouched since AD 841 — behind Kasuga Shrine in Nara. Mossy stone paths, stone Buddha caves, waterfalls. ~3.5 hours moderate hike. Pairs perfectly with Nara.",
              tags: ["hike", "nature", "unesco"],
              wiki: "Kasugayama_Primeval_Forest",
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
            },
            {
              name: "Spring Hiyoshi Camp Field",
              summary:
                "Near Hiyoshi Dam. Hot springs, canoeing, SUP on the dam lake. Tent rental available, English-speaking staff. 25-min walk from JR Hiyoshi Station.",
              tags: ["camping", "onsen", "water"],
              wiki: "",
            },
            {
              name: "GRAX Rurikei",
              travel: "1 hr 15 min from Kyoto",
              summary:
                "Luxury glamping resort with onsen. Everything provided — tents, food, cooking gear. Most expensive but zero effort.",
              tags: ["glamping", "onsen", "upscale"],
              wiki: "",
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
            },
            {
              name: "Osaka Castle",
              summary:
                "Iconic castle surrounded by a huge park. Museum inside with city views from the top floor. Great grounds for a stroll.",
              tags: ["historic", "castle"],
              wiki: "Osaka_Castle",
            },
            {
              name: "Shinsekai",
              summary:
                "Retro neighborhood with a gritty, old-school charm. Famous for kushikatsu and the Tsutenkaku Tower. More local and less polished than Dotonbori.",
              tags: ["food", "retro", "local"],
              wiki: "Shinsekai",
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
            },
            {
              name: "Universal Studios Japan",
              summary:
                "West Osaka. The alternative to a nature day if anyone wants Super Nintendo World.",
              tags: ["theme-park"],
              wiki: "Universal_Studios_Japan",
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
            },
            {
              name: "Kamikochi",
              summary:
                "Japanese Alps river valley at 1,500m surrounded by 3,000m peaks. Perfect June weather. Serious nature immersion.",
              tags: ["nature", "hike", "alps"],
              wiki: "Kamikōchi",
            },
          ],
        },
      ],
    },
  ],
};

function getTripData() {
  return Promise.resolve(TRIP_DATA);
}
