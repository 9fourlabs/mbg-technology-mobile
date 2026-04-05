import type { LoyaltyTemplate } from "../../src/templates/types";

export const sampleLoyaltyTemplate: LoyaltyTemplate = {
  templateId: "loyalty",
  brand: {
    logoUri:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
    primaryColor: "#7C3AED",
    backgroundColor: "#1E1B2E",
    textColor: "#FFFFFF",
    mutedTextColor: "#A78BFA",
  },
  auth: {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
  },
  loyalty: {
    programName: "Brewster's Rewards",
    pointsPerVisit: 15,
    tiers: [
      {
        id: "bronze",
        name: "Bronze",
        minPoints: 0,
        color: "#CD7F32",
        perks: ["Earn 15 points per visit", "Birthday bonus points"],
      },
      {
        id: "silver",
        name: "Silver",
        minPoints: 200,
        color: "#C0C0C0",
        perks: ["All Bronze perks", "Free size upgrade once per week", "Early access to seasonal drinks"],
      },
      {
        id: "gold",
        name: "Gold",
        minPoints: 750,
        color: "#FFD700",
        perks: ["All Silver perks", "Double points on weekends", "Free drink on your anniversary", "Exclusive Gold-only menu items"],
      },
    ],
    rewards: [
      {
        id: "free-drip",
        name: "Free Drip Coffee",
        pointsCost: 50,
        description: "Any size house drip coffee, on us.",
        imageUri:
          "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "free-pastry",
        name: "Free Pastry",
        pointsCost: 75,
        description: "Choose any pastry from the bakery case.",
        imageUri:
          "https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "free-specialty",
        name: "Free Specialty Drink",
        pointsCost: 100,
        description: "Any handcrafted latte, mocha, or seasonal specialty.",
        imageUri:
          "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "merch-discount",
        name: "Merchandise Discount",
        pointsCost: 150,
        description: "20% off any branded merchandise item.",
        imageUri:
          "https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  tabs: [
    {
      id: "home",
      label: "Home",
      headerTitle: "Brewster's Rewards",
      headerBody: "Earn points with every visit. Redeem for free drinks, food, and more.",
      cards: [
        {
          id: "welcome",
          imageUri:
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
          title: "Welcome to Brewster's",
          body: "Your neighborhood coffee shop where every cup earns you rewards.",
          action: {
            type: "open_url",
            url: "https://example.com/brewsters",
            label: "Learn more",
            variant: "primary",
          },
        },
        {
          id: "promo-double-points",
          imageUri:
            "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&w=1200&q=80",
          title: "Double Points Weekends",
          body: "Visit us Saturday or Sunday and earn double points on every purchase.",
        },
        {
          id: "promo-seasonal",
          imageUri:
            "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80",
          title: "Seasonal Specials",
          body: "Try our limited-edition Lavender Honey Latte, available this month only.",
        },
      ],
    },
    {
      id: "card",
      label: "My Card",
      headerTitle: "My Loyalty Card",
      headerBody: "Show this card at the register to earn and redeem points.",
      cards: [],
    },
    {
      id: "rewards",
      label: "Rewards",
      headerTitle: "Available Rewards",
      headerBody: "Redeem your points for these rewards.",
      cards: [],
    },
    {
      id: "history",
      label: "History",
      headerTitle: "Points History",
      headerBody: "See how you have earned and spent your points.",
      cards: [],
    },
    {
      id: "profile",
      label: "Profile",
      headerTitle: "Your Profile",
      headerBody: "Manage your account and notification preferences.",
      cards: [],
    },
  ],
  protectedTabs: ["card", "rewards", "history", "profile"],
};
