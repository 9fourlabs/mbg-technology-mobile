import type { InformationalTemplate } from "../../src/templates/types";

/**
 * MBG Technology — the platform owner's own tenant. Doubles as the reference
 * informational app for consultants to learn from. Content drawn from
 * https://mbgtechnology.com (tagline, services, CTAs).
 *
 * Login stub: the "Account" tab is pre-wired as a placeholder for the
 * future member area / knowledgebase. For now the sign-in button deep-links
 * to the admin's client-portal login at /client/login — when the real
 * knowledgebase ships it becomes a native tab on the `authenticated`
 * template.
 */
export const mbgTemplate: InformationalTemplate = {
  templateId: "informational",
  brand: {
    logoUri:
      "https://images.squarespace-cdn.com/content/v1/62a77a4d742c1a5b64a31e56/574e082c-9002-4249-a525-13f72c69f51d/Untitled+%28125+×+125+px%29.png?format=1500w",
    primaryColor: "#d4af37",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    mutedTextColor: "#999999",
  },
  design: {
    preset: "elegant",
    cardStyle: "rounded",
    cardColumns: 1,
    buttonRadius: 8,
    headerStyle: "centered",
    tabBarStyle: "underline",
    typography: { headingSize: "medium", bodySize: "medium" },
    secondaryColor: "#1e3a8a",
  },
  appStore: {
    appName: "MBG Technology",
    appDescription:
      "Stay connected with MBG Technology. Browse services, book a consultation, and manage ongoing support for your website and business systems.",
    appKeywords: [
      "business",
      "technology",
      "IT support",
      "web design",
      "small business",
    ],
    adaptiveIconBackgroundColor: "#d4af37",
    splashBackgroundColor: "#000000",
    pushEnabled: false,
  },
  tabs: [
    {
      id: "home",
      label: "Home",
      headerTitle: "Innovate. Integrate. Elevate.",
      headerBody:
        "Empower your business with the right technology. We align your goals with smart, scalable solutions.",
      cards: [
        {
          id: "book",
          imageUri:
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
          title: "Start the conversation",
          body:
            "Every project starts with a short discovery call — a focused look at your current systems and what could be simpler.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/appointment",
            label: "Book a consultation",
            variant: "primary",
          },
        },
        {
          id: "modernize",
          imageUri:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
          title: "Elevate with modernization",
          body:
            "Clean, responsive websites. Professional branding. Digital presence that matches the quality of your work.",
        },
        {
          id: "systemize",
          imageUri:
            "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
          title: "Simplify with systems",
          body:
            "CRMs, operational tools, and cloud solutions chosen for your team size and workflow — not what's trendy.",
        },
        {
          id: "automate",
          imageUri:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
          title: "Automate to streamline",
          body:
            "Stop doing the same task twice. We identify the repetitive work and automate it so you can focus on growth.",
        },
      ],
    },
    {
      id: "services",
      label: "Services",
      headerTitle: "Our Services",
      headerBody:
        "Five focused areas. Pick the one that's blocking you and start there.",
      cards: [
        {
          id: "web-design",
          imageUri:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
          title: "Web Design & Management",
          body:
            "Custom websites that reflect your brand, built to grow with your business. Ongoing updates and maintenance included.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/web-design",
            label: "See our work",
            variant: "primary",
          },
        },
        {
          id: "graphic-design",
          imageUri:
            "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=1200&q=80",
          title: "Graphic Design & Branding",
          body:
            "Logos, brand kits, social graphics, marketing materials. A coherent visual identity across every touchpoint.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/graphic-design",
            label: "See our work",
            variant: "secondary",
          },
        },
        {
          id: "marketing",
          imageUri:
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
          title: "Marketing & Social Media",
          body:
            "Content planning, social media management, and digital strategy — so your presence grows even when you're not in front of it.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/appointment",
            label: "Let's talk",
            variant: "secondary",
          },
        },
        {
          id: "business-systems",
          imageUri:
            "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
          title: "Business Technology Systems",
          body:
            "CRMs, automation, cloud solutions. We choose and configure the tools that fit your operations — no one-size-fits-all.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/appointment",
            label: "Book a consultation",
            variant: "primary",
          },
        },
        {
          id: "support",
          imageUri:
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
          title: "Technical Support",
          body:
            "System maintenance, troubleshooting, and user training. Reliable help so technology doesn't slow you down.",
          action: {
            type: "open_url",
            url: "https://www.mbgtechnology.com/contact-us",
            label: "Get support",
            variant: "secondary",
          },
        },
      ],
    },
    {
      id: "plans",
      label: "Plans",
      headerTitle: "Ongoing Support",
      headerBody:
        "Monthly plans for website upkeep and business systems — so you're not starting from scratch every time.",
      cards: [
        {
          id: "website-management",
          imageUri:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
          title: "Website Management",
          body:
            "Monthly plan covering updates, security patches, content changes, and minor design tweaks. Peace of mind for a fixed monthly cost.",
          action: {
            type: "open_url",
            url: "https://www.mbgtechnology.com/subscriptions",
            label: "View subscriptions",
            variant: "primary",
          },
        },
        {
          id: "business-systems-tier",
          imageUri:
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
          title: "Business Systems Setup",
          body:
            "Starting at $125 — tiered based on team size. We scope, recommend, set up, and train. No ongoing obligation unless you want it.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/appointment",
            label: "Talk to us",
            variant: "secondary",
          },
        },
      ],
    },
    {
      id: "contact",
      label: "Contact",
      headerTitle: "Let's talk",
      headerBody:
        "Three ways to reach us — pick whatever fits the moment.",
      cards: [
        {
          id: "book",
          imageUri:
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
          title: "Book a consultation",
          body:
            "Schedule focused time to talk through your website, systems, or support needs. 30 minutes, zero pressure.",
          action: {
            type: "open_url",
            url: "https://mbgtechnology.com/appointment",
            label: "Book now",
            variant: "primary",
          },
        },
        {
          id: "message",
          imageUri:
            "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
          title: "Send us a message",
          body:
            "Have a quick question or a project idea? Reach out through our contact form and we'll get back to you within a business day.",
          action: {
            type: "open_url",
            url: "https://www.mbgtechnology.com/contact-us",
            label: "Contact form",
            variant: "secondary",
          },
        },
        {
          id: "review",
          imageUri:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
          title: "Share your experience",
          body:
            "If we've worked together, a Google review helps other small businesses find the right partner.",
          action: {
            type: "open_url",
            url: "https://g.page/r/CYoriLeElnaXEAI/review",
            label: "Leave a review",
            variant: "secondary",
          },
        },
      ],
    },
    {
      id: "account",
      label: "Account",
      headerTitle: "Member area",
      headerBody:
        "Sign in to access training resources, client materials, and your support portal.",
      cards: [
        {
          id: "sign-in",
          imageUri:
            "https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?auto=format&fit=crop&w=1200&q=80",
          title: "Member Login",
          body:
            "Access member content — training videos, resource library, and your support tickets. Launching soon for active subscribers.",
          action: {
            type: "open_url",
            url: "https://mbg-admin.fly.dev/client/login",
            label: "Sign in",
            variant: "primary",
          },
        },
        {
          id: "not-member",
          imageUri:
            "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
          title: "Not a member yet?",
          body:
            "The member area launches with our ongoing-support subscribers. Talk to us about a plan that includes access.",
          action: {
            type: "open_url",
            url: "https://www.mbgtechnology.com/contact-us",
            label: "Request access",
            variant: "secondary",
          },
        },
      ],
    },
  ],
};
