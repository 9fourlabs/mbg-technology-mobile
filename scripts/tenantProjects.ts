/**
 * Maps tenant IDs to their dedicated Expo project IDs.
 *
 * PRODUCTION ISOLATION RULE:
 * Every tenant that ships to the app stores MUST have its own Expo project.
 * Sharing a project ID across tenants co-mingles build history, credentials,
 * and submission records — fine for previews, unacceptable for production.
 *
 * MBG_PROJECT_ID is the default/shared project used for:
 *   - The MBG app itself (production)
 *   - Preview builds for all tenants (via NATIVE_ID_MODE=shared)
 *
 * When onboarding a new tenant for production:
 *   1. Create a dedicated Expo project at https://expo.dev
 *   2. Replace the placeholder below with the new project ID
 *   3. Run `npm run validate:tenants` to confirm no duplicates
 */
export const MBG_PROJECT_ID = "8f0869f4-6354-4c29-956a-abf07a54c9b6";

export const tenantProjects: Record<string, string> = {
  // MBG is the platform owner — uses the default project
  mbg: MBG_PROJECT_ID,

  // Client tenants — each MUST get a dedicated project ID before production release.
  // Replace the placeholder with a real Expo project ID when the client is approved.
  "acme-dental": "PLACEHOLDER_CREATE_EXPO_PROJECT",
};

