export type EventCategory = "Competition" | "International" | "Recognition";

export type GalleryEvent = {
  slug: string;
  name: string;
  category: EventCategory;
  photos: string[];
};

/** Each event's photos live in /public/events/<slug>/. Add a new event by
 * dropping a new folder in there and adding an entry here. */
export const EVENTS: GalleryEvent[] = [
  {
    slug: "wcc-2024",
    name: "WCC 2024",
    category: "Recognition",
    photos: ["/events/wcc-2024/wcc-2024-01.jpeg", "/events/wcc-2024/wcc-2024-02.jpeg", "/events/wcc-2024/wcc-2024-03.jpeg", "/events/wcc-2024/wcc-2024-04.jpeg", "/events/wcc-2024/wcc-2024-05.jpeg", "/events/wcc-2024/wcc-2024-06.jpeg", "/events/wcc-2024/wcc-2024-07.jpeg", "/events/wcc-2024/wcc-2024-08.jpeg", "/events/wcc-2024/wcc-2024-09.jpeg", "/events/wcc-2024/wcc-2024-10.jpeg", "/events/wcc-2024/wcc-2024-11.jpeg", "/events/wcc-2024/wcc-2024-12.jpeg", "/events/wcc-2024/wcc-2024-13.jpeg", "/events/wcc-2024/wcc-2024-14.jpeg", "/events/wcc-2024/wcc-2024-15.jpeg", "/events/wcc-2024/wcc-2024-16.jpeg", "/events/wcc-2024/wcc-2024-17.jpeg", "/events/wcc-2024/wcc-2024-18.jpeg", "/events/wcc-2024/wcc-2024-19.jpeg"],
  },
  {
    slug: "lotus-prestige-cup-macau",
    name: "Lotus Prestige Cup - Macau",
    category: "International",
    photos: ["/events/lotus-prestige-cup-macau/lotus-01.jpeg", "/events/lotus-prestige-cup-macau/lotus-02.jpeg", "/events/lotus-prestige-cup-macau/lotus-03.jpeg", "/events/lotus-prestige-cup-macau/lotus-04.jpeg", "/events/lotus-prestige-cup-macau/lotus-05.jpeg", "/events/lotus-prestige-cup-macau/lotus-06.jpeg", "/events/lotus-prestige-cup-macau/lotus-07.jpeg", "/events/lotus-prestige-cup-macau/lotus-08.jpeg", "/events/lotus-prestige-cup-macau/lotus-09.jpeg", "/events/lotus-prestige-cup-macau/lotus-10.jpeg", "/events/lotus-prestige-cup-macau/lotus-11.jpeg", "/events/lotus-prestige-cup-macau/lotus-12.jpeg", "/events/lotus-prestige-cup-macau/lotus-13.jpeg", "/events/lotus-prestige-cup-macau/lotus-14.jpeg", "/events/lotus-prestige-cup-macau/lotus-15.jpeg", "/events/lotus-prestige-cup-macau/lotus-16.jpeg", "/events/lotus-prestige-cup-macau/lotus-17.jpeg", "/events/lotus-prestige-cup-macau/lotus-18.jpeg", "/events/lotus-prestige-cup-macau/lotus-19.jpeg", "/events/lotus-prestige-cup-macau/lotus-20.jpeg", "/events/lotus-prestige-cup-macau/lotus-21.jpeg", "/events/lotus-prestige-cup-macau/lotus-22.jpeg", "/events/lotus-prestige-cup-macau/lotus-23.jpeg", "/events/lotus-prestige-cup-macau/lotus-24.jpeg", "/events/lotus-prestige-cup-macau/lotus-25.jpeg", "/events/lotus-prestige-cup-macau/lotus-26.jpeg", "/events/lotus-prestige-cup-macau/lotus-27.jpeg"],
  },
  {
    slug: "asia-pacific-cocktail-competition",
    name: "Asia Pacific Cocktail Competition",
    category: "International",
    photos: ["/events/asia-pacific-cocktail-competition/apcc-01.jpeg", "/events/asia-pacific-cocktail-competition/apcc-02.jpeg", "/events/asia-pacific-cocktail-competition/apcc-03.jpeg", "/events/asia-pacific-cocktail-competition/apcc-04.jpeg", "/events/asia-pacific-cocktail-competition/apcc-05.jpeg", "/events/asia-pacific-cocktail-competition/apcc-06.jpeg", "/events/asia-pacific-cocktail-competition/apcc-07.jpeg", "/events/asia-pacific-cocktail-competition/apcc-08.jpeg", "/events/asia-pacific-cocktail-competition/apcc-09.jpeg", "/events/asia-pacific-cocktail-competition/apcc-10.jpeg", "/events/asia-pacific-cocktail-competition/apcc-11.jpeg", "/events/asia-pacific-cocktail-competition/apcc-12.jpeg", "/events/asia-pacific-cocktail-competition/apcc-13.jpeg"],
  },
  {
    slug: "golden-cup",
    name: "Golden Cup",
    category: "International",
    photos: ["/events/golden-cup/golden-cup-01.jpeg", "/events/golden-cup/golden-cup-02.jpeg", "/events/golden-cup/golden-cup-03.jpeg", "/events/golden-cup/golden-cup-04.jpeg", "/events/golden-cup/golden-cup-05.jpeg", "/events/golden-cup/golden-cup-06.jpeg", "/events/golden-cup/golden-cup-07.jpeg", "/events/golden-cup/golden-cup-08.jpeg", "/events/golden-cup/golden-cup-09.jpeg", "/events/golden-cup/golden-cup-10.jpeg", "/events/golden-cup/golden-cup-11.jpeg", "/events/golden-cup/golden-cup-12.jpeg", "/events/golden-cup/golden-cup-13.jpeg", "/events/golden-cup/golden-cup-14.jpeg", "/events/golden-cup/golden-cup-15.jpeg", "/events/golden-cup/golden-cup-16.jpeg", "/events/golden-cup/golden-cup-17.jpeg", "/events/golden-cup/golden-cup-18.jpeg", "/events/golden-cup/golden-cup-19.jpeg", "/events/golden-cup/golden-cup-20.jpeg", "/events/golden-cup/golden-cup-21.jpeg", "/events/golden-cup/golden-cup-22.jpeg", "/events/golden-cup/golden-cup-23.jpeg", "/events/golden-cup/golden-cup-24.jpeg", "/events/golden-cup/golden-cup-25.jpeg", "/events/golden-cup/golden-cup-26.jpeg", "/events/golden-cup/golden-cup-27.jpeg", "/events/golden-cup/golden-cup-28.jpeg", "/events/golden-cup/golden-cup-29.jpeg", "/events/golden-cup/golden-cup-30.jpeg"],
  },
  {
    slug: "ibg-flair-challenge",
    name: "IBG Flair Challenge",
    category: "Competition",
    photos: ["/events/ibg-flair-challenge/flair-01.jpeg", "/events/ibg-flair-challenge/flair-02.jpeg", "/events/ibg-flair-challenge/flair-03.jpeg", "/events/ibg-flair-challenge/flair-04.jpeg", "/events/ibg-flair-challenge/flair-05.jpeg", "/events/ibg-flair-challenge/flair-06.jpeg"],
  },
];