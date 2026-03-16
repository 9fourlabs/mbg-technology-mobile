import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Linking,
  Pressable,
} from "react-native";

const BLACK = "#000000";
const GOLD = "#d4af37";

const BOOKING_URL = "https://mbgtechnology.com/appointment";
const REVIEW_URL = "https://g.page/r/CYoriLeElnaXEAI/review";
const SUBSCRIPTIONS_URL = "https://www.mbgtechnology.com/subscriptions";
const CONTACT_URL = "https://www.mbgtechnology.com/contact-us";

type Service = {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  offer: string[] | null;
  pricing: { name: string; price: string; detail: string }[] | null;
  contactForPricing?: boolean;
};

// Service details from https://www.mbgtechnology.com/services
const services: Service[] = [
  {
    id: "web",
    name: "Web Design & Management",
    tagline: "Custom websites built to grow with your business.",
    desc: "We handle the full process—from concept to launch and beyond. Strategic, user-friendly sites that align with your brand and support growth.",
    offer: [
      "Custom web design — layouts that reflect your brand",
      "Responsive development — seamless on all devices",
      "Content integration — clarity and conversions",
      "Search engine optimization (SEO)",
      "Ongoing maintenance and updates",
    ],
    pricing: [
      { name: "Core", price: "$500", detail: "4 pages, custom design, payment integration" },
      { name: "Elevate", price: "$750", detail: "5–7 pages, multiple integrations" },
      { name: "Elite", price: "$1,000", detail: "Unlimited pages, 8–10 stock images" },
    ],
  },
  {
    id: "systems",
    name: "Business Technology Systems",
    tagline: "Smart, scalable systems for your operations.",
    desc: "We help small to mid-sized businesses design and implement custom systems: CRMs, project management, automation, and integrations.",
    offer: [
      "Systems strategy & design",
      "Setup & implementation — workflows, automations, templates",
      "Automation & integration across platforms",
      "Training & documentation",
      "Ongoing systems support (optional)",
    ],
    pricing: [
      { name: "Lite", price: "$125", detail: "Small business (1–5 employees)" },
      { name: "Pro", price: "$250", detail: "Medium (6–10 employees)" },
      { name: "Scale", price: "$375", detail: "Large (11+ employees)" },
    ],
  },
  {
    id: "graphic",
    name: "Graphic Design & Branding",
    tagline: "A polished look that matches your professionalism.",
    desc: "Logos, branding kits, social media graphics, and marketing materials that align with your business identity.",
    offer: null,
    pricing: null,
    contactForPricing: true,
  },
  {
    id: "marketing",
    name: "Marketing & Social Media",
    tagline: "Stay visible and relevant online.",
    desc: "Content planning, social media management, and digital marketing that speaks to your audience.",
    offer: null,
    pricing: null,
    contactForPricing: true,
  },
  {
    id: "support",
    name: "Technical Support",
    tagline: "Reliable support so technology doesn’t slow you down.",
    desc: "Ongoing support, troubleshooting, and guidance to keep your systems running smoothly.",
    offer: null,
    pricing: null,
    contactForPricing: true,
  },
];

export default function App() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"home" | "services" | "plans" | "contact">("home");

  async function openUrl(url: string) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) return;
      await Linking.openURL(url);
    } catch {
      // Ignore in UI; prevents noisy red screens in simulator for transient Linking failures.
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.root}>
        {/* Simple header with logo only */}
        <View style={styles.nav}>
          <Image
            source={{
              uri: "https://images.squarespace-cdn.com/content/v1/62a77a4d742c1a5b64a31e56/574e082c-9002-4249-a525-13f72c69f51d/Untitled+%28125+×+125+px%29.png?format=1500w",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Screen content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === "home" && (
            <>
              {/* Hero — simplified */}
              <View style={styles.section}>
                <Text style={styles.heroHeadline}>
                  Innovate.{"\n"}
                  <Text style={styles.heroHeadlineGold}>Integrate.</Text>
                  {"\n"}Elevate.
                </Text>
                <Text style={styles.heroSubtext}>
                  Smart, modern technology support for small and growing teams.
                </Text>

                {/* Simple visual + three pillars */}
                <View style={styles.heroImageCard}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
                    }}
                    style={styles.heroImage}
                  />
                  <View style={styles.heroPillars}>
                    <Text style={styles.pillarTitle}>Modern web</Text>
                    <Text style={styles.pillarText}>Clean, responsive sites that match your brand.</Text>
                    <Text style={styles.pillarTitle}>Smart systems</Text>
                    <Text style={styles.pillarText}>Tools, automations, and workflows that save time.</Text>
                    <Text style={styles.pillarTitle}>Ongoing support</Text>
                    <Text style={styles.pillarText}>Reliable help so tech issues don&apos;t slow you down.</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {tab === "services" && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Our services</Text>
                <Text style={styles.body}>Explore what we do. Tap a card for details.</Text>
                {services.map((s) => {
                  const isExpanded = expandedId === s.id;
                  return (
                    <View key={s.id} style={styles.card}>
                      <Pressable
                        style={({ pressed }) => [styles.cardHeader, pressed && styles.cardHeaderPressed]}
                        onPress={() => setExpandedId(isExpanded ? null : s.id)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isExpanded }}
                      >
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardName}>{s.name}</Text>
                          <Text style={styles.cardPreview}>{s.tagline}</Text>
                        </View>
                        <Text style={styles.chevron}>{isExpanded ? "−" : "+"}</Text>
                      </Pressable>
                      {isExpanded && (
                        <View style={styles.cardBody}>
                          <Text style={styles.cardDesc}>{s.desc}</Text>
                          {s.offer && (
                            <>
                              <Text style={styles.cardLabel}>What we offer</Text>
                              {s.offer.slice(0, 3).map((item, i) => (
                                <Text key={i} style={styles.bullet}>
                                  • {item}
                                </Text>
                              ))}
                            </>
                          )}
                          {s.pricing && s.pricing.length > 0 && (
                            <>
                              <Text style={styles.cardLabel}>Pricing</Text>
                              <View style={styles.pricingRow}>
                                {s.pricing.map((tier) => (
                                  <View key={tier.name} style={styles.priceChip}>
                                    <Text style={styles.priceChipName}>{tier.name}</Text>
                                    <Text style={styles.priceChipPrice}>{tier.price}</Text>
                                  </View>
                                ))}
                              </View>
                            </>
                          )}
                          {s.contactForPricing && (
                            <Text style={styles.contactPricing}>Contact us for pricing.</Text>
                          )}
                          <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.cardCta}
                            onPress={() => openUrl(BOOKING_URL)}
                          >
                            <Text style={styles.cardCtaText}>Get started</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {tab === "plans" && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plans</Text>
                <Text style={styles.body}>
                  Simple options for ongoing website support and business systems.
                </Text>

                <View style={styles.subCard}>
                  <Text style={styles.subTitle}>Website Management</Text>
                  <Text style={styles.subDesc}>
                    Monthly upkeep for your site. Updates, maintenance, and peace of mind.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.secondaryCta}
                    onPress={() => openUrl(SUBSCRIPTIONS_URL)}
                  >
                    <Text style={styles.secondaryCtaText}>View subscriptions</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subCard}>
                  <Text style={styles.subTitle}>Business Systems</Text>
                  <Text style={styles.subDesc}>
                    Starting at $125. System setup options based on team size.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.primaryCta}
                    onPress={() => openUrl(BOOKING_URL)}
                  >
                    <Text style={styles.primaryCtaText}>Talk to us</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {tab === "contact" && (
            <>
              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryCta}
                  onPress={() => openUrl(BOOKING_URL)}
                >
                  <Text style={styles.primaryCtaText}>Book a consultation</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.secondaryCta}
                  onPress={() => openUrl(CONTACT_URL)}
                >
                  <Text style={styles.secondaryCtaText}>Contact us</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.secondaryCta}
                  onPress={() => openUrl(REVIEW_URL)}
                >
                  <Text style={styles.secondaryCtaText}>Leave a review</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footerSpacer} />
        </ScrollView>

        {/* Bottom tab bar */}
        <View style={styles.tabBar}>
          <TabButton label="Home" active={tab === "home"} onPress={() => setTab("home")} />
          <TabButton label="Services" active={tab === "services"} onPress={() => setTab("services")} />
          <TabButton label="Plans" active={tab === "plans"} onPress={() => setTab("plans")} />
          <TabButton label="Contact" active={tab === "contact"} onPress={() => setTab("contact")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.tabButtonActive,
        pressed && styles.tabButtonPressed,
      ]}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BLACK },
  root: { flex: 1, backgroundColor: BLACK },
  nav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  logo: { width: 56, height: 56, alignSelf: "flex-start" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 96 },
  section: { marginBottom: 40 },
  heroHeadline: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  heroHeadlineGold: { color: GOLD },
  heroSubtext: { color: "#999", fontSize: 17, marginTop: 14, lineHeight: 24 },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  body: {
    color: "#999",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  primaryCta: {
    backgroundColor: GOLD,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "flex-start",
    minHeight: 48,
    justifyContent: "center",
  },
  primaryCtaText: { color: BLACK, fontSize: 16, fontWeight: "700" },
  heroImageCard: {
    marginTop: 24,
    backgroundColor: "#0d0d0d",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  heroImage: {
    width: "100%",
    height: 160,
  },
  heroPillars: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pillarTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  pillarText: {
    color: "#b3b3b3",
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#0d0d0d",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    minHeight: 56,
  },
  cardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  cardHeaderPressed: { opacity: 0.8 },
  cardName: { color: GOLD, fontSize: 16, fontWeight: "700", flex: 1 },
  cardPreview: { color: "#8c8c8c", fontSize: 13, marginTop: 4, lineHeight: 18 },
  chevron: { color: "#666", fontSize: 20, fontWeight: "300" },
  cardBody: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 0 },
  cardDesc: { color: "#aaa", fontSize: 15, lineHeight: 22, marginBottom: 14 },
  cardLabel: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  bullet: { color: "#aaa", fontSize: 14, lineHeight: 22, marginBottom: 4 },
  pricingRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  priceChip: {
    borderWidth: 1,
    borderColor: "#1a1a1a",
    backgroundColor: "#0a0a0a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  priceChipName: { color: GOLD, fontSize: 12, fontWeight: "700" },
  priceChipPrice: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 },
  contactPricing: { color: "#888", fontSize: 14, marginBottom: 14 },
  cardCta: {
    backgroundColor: GOLD,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 8,
  },
  cardCtaText: { color: BLACK, fontSize: 15, fontWeight: "700" },
  subCard: {
    backgroundColor: "#0d0d0d",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  subTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 10 },
  subDesc: { color: "#999", fontSize: 15, lineHeight: 22, marginBottom: 16 },
  secondaryCta: {
    borderWidth: 1,
    borderColor: GOLD,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    minHeight: 48,
    justifyContent: "center",
  },
  secondaryCtaText: { color: GOLD, fontSize: 16, fontWeight: "600" },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 8,
  },
  footerLink: { color: GOLD, fontSize: 14, fontWeight: "600" },
  footerText: { color: "#555", fontSize: 12 },
  footerSpacer: { height: 16 },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    backgroundColor: "#050505",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  tabButtonActive: {
    borderRadius: 999,
    backgroundColor: "#111111",
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabButtonText: {
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: GOLD,
  },
});
