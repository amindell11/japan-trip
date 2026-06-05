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
              tags: ["urban", "iconic", "nightlife", "touristy"],
              wiki: "Shibuya_Crossing",
              coords: [35.6595, 139.7004],
              links: [
                { label: "Shibuya Sky (observation deck)", url: "https://www.shibuya-scramble-square.com/sky/en/" },
              ],
            },
            {
              name: "Shibuya Sky",
              travel: "atop Shibuya Scramble Square",
              summary:
                "Open-air rooftop observation deck on the 47th floor of Shibuya Scramble Square. 360° city panorama, killer at sunset. Book a timed entry slot in advance — it sells out.",
              tags: ["urban", "scenic", "iconic", "touristy"],
              wiki: "Shibuya_Scramble_Square",
              coords: [35.6585, 139.7019],
              links: [
                { label: "Tickets & official site", url: "https://www.shibuya-scramble-square.com/sky/en/" },
              ],
            },
            {
              name: "Shinjuku / Golden Gai",
              summary:
                "Tokyo's biggest transit hub surrounded by shopping and restaurants. Golden Gai is a maze of 200+ tiny themed bars seating 5–10 people each — perfect for a group night out.",
              tags: ["nightlife", "food", "drinks", "touristy"],
              wiki: "Golden_Gai",
              coords: [35.6938, 139.7036],
            },
            {
              name: "Harajuku / Takeshita Street",
              travel: "1 stop from Shinjuku · 5 min",
              summary:
                "Youth fashion capital. Takeshita Street is packed with wild fashion shops, crepe stands, and quirky cafes. Adjacent to Meiji Shrine and Yoyogi Park. Endorsed by Stefan.",
              tags: ["fashion", "shopping", "food", "stefans-recs", "touristy"],
              wiki: "Takeshita_Street",
              coords: [35.6716, 139.7031],
            },
            {
              name: "visvim (F.I.L. Tokyo)",
              travel: "Omotesando · short walk from Harajuku",
              summary:
                "Main central-Tokyo shop of Hiroki Nakamura's cult label — hand-crafted footwear and Americana-inspired clothing in an immersive basement space. The brand's larger WMV flagship is in Nakameguro if you want more. Recommended by Stefan.",
              tags: ["fashion", "shopping", "stefans-recs"],
              wiki: "",
              coords: [35.6645, 139.7064],
              links: [
                { label: "visvim official", url: "https://www.visvim.tv/" },
              ],
            },
            {
              name: "Little Cloud Coffee",
              travel: "GYRE building 2F, Omotesando",
              summary:
                "visvim's own specialty coffee cafe — house-roasted coffee, juices, and baked goods on the 2nd floor of the GYRE building. Pairs naturally with the visvim shop stop. Open 11:00–19:00. Recommended by Stefan.",
              tags: ["coffee", "cafe", "stefans-recs"],
              wiki: "",
              coords: [35.6675, 139.7070],
              links: [
                { label: "little cloud coffee", url: "https://www.visvim.tv/lcc/" },
              ],
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
              name: "Sumo Morning Practice (Ryogoku)",
              travel: "Ryogoku · 2 stops from Akihabara",
              summary:
                "No grand tournament overlaps the trip (May basho ends May 24; July basho starts July 12 in Nagoya), so the way to see sumo is a morning practice (keiko) visit at a stable in Ryogoku, Tokyo's sumo district. ~2 hrs, sit quietly, no flash; ~$80–100/person via guided tour — book ahead. Recommended by Stefan.",
              tags: ["cultural", "activity", "sumo", "stefans-recs"],
              wiki: "Ryōgoku_Kokugikan",
              coords: [35.6968, 139.7932],
              links: [
                { label: "Stable visit (GetYourGuide)", url: "https://www.getyourguide.com/tokyo-l193/tokyo-sumo-stable-morning-visit-t277927/" },
                { label: "Stable visit (Viator)", url: "https://www.viator.com/tours/Tokyo/Ryogoku-Sumo-Morning-Practice-Tour-in-Tokyo/d334-63670P10" },
              ],
            },
            {
              name: "Akihabara",
              travel: "10 stops from Shinjuku · 20 min",
              summary:
                "'Electric Town' — anime, manga, retro games, electronics. Multi-story arcades and maid cafes. The touristy version of what Nakano Broadway does more authentically.",
              tags: ["anime", "shopping", "arcades", "touristy"],
              wiki: "Akihabara",
              coords: [35.7022, 139.7745],
            },
            {
              name: "GiGO Akihabara (Arcades)",
              travel: "in Akihabara",
              summary:
                "Multi-floor flagship game center: floors of crane games, rhythm games (maimai, DDR, Project Diva), racing cabinets, and a dedicated retro floor of 90s classics. Arcades like this are all over Akihabara and Shibuya — this is an easy anchor. Recommended by Stefan.",
              tags: ["arcades", "gaming", "indoor", "stefans-recs"],
              wiki: "",
              coords: [35.7008, 139.7715],
              links: [
                { label: "GiGO official", url: "https://tempo.gigo.jp/" },
              ],
            },
            {
              name: "Roppongi Nightlife",
              summary:
                "Tokyo's most international nightlife district — clubs (V2 Tokyo), bars, and izakaya drawing a mixed foreign/local crowd. Safe overall, but never follow street touts offering 'free entry' — they lead to rip-off bars with huge hidden charges. Recommended by Stefan.",
              tags: ["nightlife", "clubs", "drinks", "stefans-recs", "touristy"],
              wiki: "Roppongi",
              coords: [35.6628, 139.7314],
              links: [
                { label: "Roppongi guide (Go Tokyo)", url: "https://www.gotokyo.org/en/destinations/central-tokyo/roppongi/index.html" },
              ],
            },
            {
              name: "WM by WAGYUMAFIA",
              travel: "Akasaka",
              summary:
                "WAGYUMAFIA's flagship wagyu omakase counter — an interactive standing-counter experience built around premium Ozaki and Kobe beef. Effectively members-only: reservation mandatory, book 3+ weeks ahead via the official page. Recommended by Stefan.",
              tags: ["food", "wagyu", "upscale", "stefans-recs"],
              wiki: "",
              coords: [35.6717, 139.7356],
              links: [
                { label: "Reservations", url: "https://wagyumafia.com/pages/reservation" },
              ],
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
                "170 acres of forest surrounding a serene shrine. Pairs with Harajuku and Takeshita Street since they're adjacent. Endorsed by Stefan.",
              tags: ["shrine", "nature", "cultural", "stefans-recs"],
              wiki: "Meiji_Shrine",
              coords: [35.6764, 139.6993],
              links: [
                { label: "Official site", url: "https://www.meijijingu.or.jp/en/" },
              ],
            },
            {
              name: "Yoyogi Park",
              travel: "next to Harajuku & Meiji Shrine",
              summary:
                "One of Tokyo's largest parks — wide lawns, ponds, and forested paths. On weekends the Harajuku side fills with street performers, musicians, and festivals. Free; great picnic break between Harajuku and Meiji Shrine. Recommended by Stefan.",
              tags: ["park", "nature", "chill", "stefans-recs"],
              wiki: "Yoyogi_Park",
              coords: [35.6720, 139.6949],
              links: [
                { label: "Park info (Go Tokyo)", url: "https://www.gotokyo.org/en/spot/21/index.html" },
              ],
            },
            {
              name: "Kuumba International",
              travel: "Tomigaya · 10 min walk from Yoyogi Park",
              summary:
                "Tokyo's cult incense brand — its shop is called the 'Kuumba Book Shop' but the 'books' are leather sample binders of hand-rolled incense you browse in-store. Quiet, atmospheric spot in residential Tomigaya. Recommended by Stefan.",
              tags: ["shopping", "incense", "local", "stefans-recs"],
              wiki: "",
              coords: [35.6647, 139.6860],
              links: [
                { label: "Kuumba International", url: "https://kuumbainternational.com/" },
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
              tags: ["beach", "day-trip", "prof-recs"],
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
              tags: ["anime", "shopping", "local", "prof-recs"],
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
              tags: ["vintage", "nightlife", "local", "prof-recs"],
              wiki: "Kōenji",
              coords: [35.7056, 139.6497],
            },
            {
              name: "Kichijoji / Inokashira Park",
              travel: "15 min from Shinjuku",
              summary:
                "Beloved neighborhood centered around Inokashira Park with its pond, swan boats, and forested paths. Harmonica Yokocho alley has tiny food stalls. Near the Ghibli Museum (book months ahead).",
              tags: ["park", "ghibli", "local", "prof-recs"],
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
              tags: ["vintage", "nightlife", "local", "prof-recs"],
              wiki: "Shimokitazawa",
              coords: [35.6614, 139.6680],
            },
            {
              name: "Daikanyama",
              travel: "Walking distance from Shibuya",
              summary:
                "Upscale but chill. Famous for the stunning T-Site Tsutaya bookstore. Boutiques, cafes, and a very 'grown-up Tokyo' feel.",
              tags: ["cafe", "shopping", "upscale", "prof-recs"],
              wiki: "Daikanyama",
              coords: [35.6497, 139.7030],
              links: [
                { label: "Daikanyama T-Site", url: "https://store.tsite.jp/daikanyama/" },
              ],
            },
            {
              name: "Daikanyama T-Site / Tsutaya Books",
              travel: "Daikanyama · walking distance from Shibuya",
              summary:
                "Celebrated three-building bookstore-and-lifestyle complex with an exceptional art/design/photography selection, the Anjin lounge, and curated shops. A must for design lovers; open roughly 9:00–22:00. Recommended by Stefan.",
              tags: ["books", "design", "cafe", "stefans-recs"],
              wiki: "",
              coords: [35.6491, 139.6996],
              links: [
                { label: "Official site", url: "https://store.tsite.jp/daikanyama/" },
              ],
            },
            {
              name: "Saturdays NYC Tokyo",
              travel: "Daikanyama / Aobadai",
              summary:
                "Tokyo flagship of the New York surf/lifestyle brand — menswear and surf shop with an espresso bar and back garden. Stylish coffee-and-shopping stop on a Daikanyama stroll. Recommended by Stefan.",
              tags: ["fashion", "cafe", "shopping", "stefans-recs"],
              wiki: "",
              coords: [35.6514, 139.6934],
              links: [
                { label: "Saturdays NYC", url: "https://www.saturdaysnyc.com/" },
              ],
            },
            {
              name: "WAGYUMAFIA The Cutlet Sandwich",
              travel: "Nakameguro · near the station",
              summary:
                "The original WAGYUMAFIA katsu-sando counter — deep-fried wagyu cutlet sandwiches from ~¥2,000 up to a Chateaubriand splurge. Tiny walk-in spot, expect a wait; closed Wednesdays. Recommended by Stefan.",
              tags: ["food", "wagyu", "casual", "stefans-recs"],
              wiki: "",
              coords: [35.6428, 139.6931],
              links: [
                { label: "WAGYUMAFIA", url: "https://wagyumafia.com/" },
              ],
            },
            {
              name: "Jiyugaoka",
              travel: "10 min south of Shibuya",
              summary:
                "European village feel with cobblestone-style streets, patisseries, and dessert shops. Good for an afternoon stroll and sweets.",
              tags: ["dessert", "cafe", "charming", "prof-recs"],
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
              wiki: "",
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
              name: "Retreat Camp Mahoroba",
              travel: "near Lake Saiko, ~10 min from Kawaguchiko",
              summary:
                "Lakeside campsite with Mt. Fuji views, near Lake Saiko in the Five Lakes region. Tent pads, cabins, and basic facilities. Your camp night 1 option. Hinata Rental can deliver gear to the site.",
              tags: ["camping", "nature", "fuji-view"],
              wiki: "",
              coords: [35.5031, 138.6650],
              links: [
                { label: "Retreat Camp Mahoroba", url: "https://retreatcamp-mahoroba.net/" },
                { label: "Hinata Rental (gear delivery)", url: "https://hinata-rental.me/" },
              ],
            },
            {
              name: "Tokyo DisneySea",
              travel: "45 min east from central Tokyo",
              summary:
                "Disney's nautical-themed park in Urayasu — exists nowhere else in the world. Stunning detail, the only Disney park aimed primarily at adults. Buy tickets in advance.",
              tags: ["theme-park", "iconic"],
              wiki: "Tokyo_DisneySea",
              coords: [35.6267, 139.8851],
              links: [
                { label: "Official site & tickets", url: "https://www.tokyodisneyresort.jp/en/tds/" },
              ],
            },
            {
              name: "Kamakura & Enoshima",
              travel: "1 hr south by train",
              summary:
                "Coastal town with a giant bronze Buddha, forested hillside temple trails, and Enoshima island with ocean panoramas and seafood.",
              tags: ["historic", "beach", "day-trip", "prof-recs"],
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
              tags: ["historic", "day-trip", "prof-recs"],
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
              tags: ["onsen", "day-trip", "fuji-view", "prof-recs"],
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
                "Thousands of vermillion torii gates winding up a forested mountainside. The summit hike takes ~2 hours and most tourists skip it — do the whole thing. Endorsed by Stefan.",
              tags: ["shrine", "hike", "iconic", "stefans-recs"],
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
              name: "Kiyomizu-dera",
              travel: "Higashiyama · up Sannen-zaka from Gion",
              summary:
                "Hillside temple (UNESCO World Heritage) famous for its huge wooden stage jutting over the slope — built without a single nail, with sweeping views over Kyoto. The approach winds up the Sannen-zaka and Ninen-zaka lanes packed with craft and snack shops. ~¥500, opens 6:00; gorgeous at dusk and during the seasonal night illuminations.",
              tags: ["temple", "iconic", "historic", "scenic"],
              wiki: "Kiyomizu-dera",
              coords: [34.9949, 135.7850],
              links: [
                { label: "Official site", url: "https://www.kiyomizudera.or.jp/en/" },
              ],
            },
            {
              name: "Nishiki Market",
              travel: "downtown Kyoto",
              summary:
                "'Kyoto's Kitchen' — a covered 400m market street of stalls selling pickles, dashimaki tamago, grilled seafood, mochi, and tofu sweets. Go weekday morning for fewer crowds; etiquette is to eat standing at the stall, not while walking. Recommended by Stefan.",
              tags: ["food", "market", "iconic", "stefans-recs"],
              wiki: "Nishiki_Market",
              coords: [35.0050, 135.7647],
              links: [
                { label: "Official site", url: "https://www.kyoto-nishiki.or.jp/" },
              ],
            },
            {
              name: "Sanjusangen-do",
              travel: "Higashiyama · near Kyoto National Museum",
              summary:
                "120m-long temple hall (built 1266) housing 1,001 gilded wooden Kannon statues plus guardian deities — an overwhelming sight. ¥600, open 8:30–17:00; photography strictly forbidden inside. Recommended by Stefan.",
              tags: ["temple", "historic", "stefans-recs"],
              wiki: "Sanjūsangen-dō",
              coords: [34.9876, 135.7717],
              links: [
                { label: "Official site", url: "http://www.sanjusangendo.jp/" },
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
                "Near Gion — sword and fan performance classes. More traditional / atmospheric setting than the Tokyo samurai spots. Endorsed by Stefan.",
              tags: ["cultural", "activity", "stefans-recs"],
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
                "Towering bamboo canopy creating a cathedral-like corridor. Rent bikes to explore the wider area: the river, Togetsukyo Bridge, and the monkey park. Endorsed by Stefan.",
              tags: ["nature", "iconic", "stefans-recs"],
              wiki: "Arashiyama",
              coords: [35.0170, 135.6714],
              links: [
                { label: "Iwatayama Monkey Park", url: "https://monkeypark.jp/en/" },
                { label: "Tenryu-ji Temple", url: "https://www.tenryuji.com/en/" },
              ],
            },
            {
              name: "% Arabica Kyoto Arashiyama",
              travel: "by Togetsukyo Bridge",
              summary:
                "Famous minimalist coffee stand on the riverbank beside Togetsukyo Bridge — great latte art with a great view. Expect a queue midday; arrive near 9:00 opening to beat it. Takeaway only, a few benches outside. Recommended by Stefan.",
              tags: ["coffee", "scenic", "stefans-recs"],
              wiki: "",
              coords: [35.0135, 135.6764],
              links: [
                { label: "Official site", url: "https://arabica.com/en/location/arabica-kyoto-arashiyama/" },
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
                "Over 1,000 wild deer that bow for crackers. Todai-ji houses a massive bronze Buddha in the world's largest wooden building. Endorsed by Stefan.",
              tags: ["deer", "historic", "day-trip", "stefans-recs"],
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
            {
              name: "Kurama Onsen",
              travel: "30 min north via Eizan Railway",
              summary:
                "Natural sulfur hot spring with a forest-view open-air bath in Kurama village, north of the city — the 'spa north of Kyoto.' Reopened in 2024 after a long closure; day bathing ~¥1,500–2,700, no reservation. Pairs with the Kurama–Kibune hike. In-city alternative: Funaoka Onsen, a historic 1923 sento (~¥490). Recommended by Stefan.",
              tags: ["onsen", "nature", "day-trip", "stefans-recs"],
              wiki: "Mount_Kurama",
              coords: [35.1170, 135.7660],
              links: [
                { label: "Kurama Onsen official", url: "https://en.kurama-spa.com/" },
                { label: "Funaoka Onsen (alternative)", url: "https://1010.kyoto/spot/funaokaonsen/?lang=en" },
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
