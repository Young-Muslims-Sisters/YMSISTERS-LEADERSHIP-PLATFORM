export type Term = { short: string; name?: string; definition: string };

export const CLOUD: Term = {
  short: "Cloud",
  definition:
    "Cloud members are sisters who previously served in YM leadership and stay involved without a formal leadership position. They mentor, share what they’ve learned, and support current leadership.",
};

export const GLOSSARY: { title: string; terms: Term[] }[] = [
  {
    title: "Our Communities",
    terms: [
      {
        short: "NN",
        name: "NeighborNet",
        definition:
          "A local YM chapter, or network of neighbors. NeighborNets usually meet weekly for discussions on Islamic topics centered around youth issues, followed by activities that build fun and sisterhood.",
      },
      {
        short: "SR",
        name: "Subregion",
        definition: "A group of nearby NeighborNets that work together and share a leadership team.",
      },
      {
        short: "R",
        name: "Region",
        definition: "A larger area that connects and supports NeighborNets that aren’t part of a subregion.",
      },
    ],
  },
  {
    title: "Leadership",
    terms: [
      {
        short: "NNC",
        name: "NeighborNet Coordinator",
        definition: "Leads a NeighborNet, guides its shura, and is the main contact for its members and parents.",
      },
      {
        short: "SRC",
        name: "Subregional Coordinator",
        definition: "Leads a subregion and supports its NeighborNets and their coordinators.",
      },
      {
        short: "RL",
        name: "Regional Lead",
        definition: "Leads a region and supports its NeighborNets and their coordinators.",
      },
      CLOUD,
    ],
  },
  {
    title: "Events",
    terms: [
      {
        short: "YMC",
        name: "Young Muslims Conference",
        definition:
          "A conference that connects youth from across the nation and gives scholars a platform to address Muslim youth in America. The national YMC aligns with the annual ICNA-MAS Convention.",
      },
      {
        short: "YMLC",
        name: "Young Muslims Leadership Conference",
        definition:
          "Our largest annual gathering of leadership. It inspires, connects, and trains leaders for the grassroots work we do throughout the year.",
      },
      {
        short: "NER",
        name: "Northeast Retreat",
        definition: "A retreat in the Northeast centered on sisterhood, the outdoors, and spiritual growth.",
      },
    ],
  },
];
