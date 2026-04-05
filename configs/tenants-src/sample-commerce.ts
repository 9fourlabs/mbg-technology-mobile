import type { CommerceTemplate } from "../../src/templates/types";

export const sampleCommerceTemplate: CommerceTemplate = {
  templateId: "commerce",
  brand: {
    logoUri:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80",
    primaryColor: "#92400E",
    backgroundColor: "#1C1917",
    textColor: "#FFFFFF",
    mutedTextColor: "#A8A29E",
  },
  auth: {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
  },
  commerce: {
    stripePublishableKey: "pk_test_REPLACE_ME",
    currency: "usd",
    storeName: "Artisan Coffee Co",
    categories: [
      { id: "all", name: "All" },
      {
        id: "coffee-beans",
        name: "Coffee Beans",
        imageUri:
          "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "equipment",
        name: "Equipment",
        imageUri:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "merchandise",
        name: "Merchandise",
        imageUri:
          "https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=600&q=80",
      },
    ],
    shippingEnabled: true,
    taxRate: 0.0875,
  },
  tabs: [
    {
      id: "home",
      label: "Home",
      headerTitle: "Artisan Coffee Co",
      headerBody: "Small-batch roasts, delivered fresh to your door.",
      cards: [
        {
          id: "hero",
          imageUri:
            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
          title: "Welcome to Artisan Coffee Co",
          body: "Explore our hand-selected single-origin beans roasted in small batches every week.",
          action: {
            type: "open_url",
            url: "https://example.com/artisan-coffee",
            label: "Shop now",
            variant: "primary",
          },
        },
        {
          id: "featured-ethiopian",
          imageUri:
            "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&w=1200&q=80",
          title: "Ethiopian Yirgacheffe",
          body: "Bright, floral notes with a honey-sweet finish. Our bestselling single-origin.",
        },
        {
          id: "featured-pourover",
          imageUri:
            "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80",
          title: "Hario V60 Pour-Over Kit",
          body: "Everything you need to brew cafe-quality pour-over at home.",
        },
      ],
    },
    {
      id: "shop",
      label: "Shop",
      headerTitle: "Shop",
      headerBody: "Browse our full catalog of beans, gear, and merch.",
      cards: [],
    },
    {
      id: "cart",
      label: "Cart",
      headerTitle: "Your Cart",
      headerBody: "Review your items before checkout.",
      cards: [],
    },
    {
      id: "orders",
      label: "Orders",
      headerTitle: "Order History",
      headerBody: "Track current and past orders.",
      cards: [],
    },
    {
      id: "profile",
      label: "Profile",
      headerTitle: "Your Profile",
      headerBody: "Manage your account, addresses, and payment methods.",
      cards: [],
    },
  ],
  protectedTabs: ["cart", "orders", "profile"],
};
