#!/usr/bin/env bash
set -euo pipefail

# Generate an Android upload keystore for a tenant.
# Usage: npm run generate:keystore -- <tenant-id>
#    or: bash scripts/generateKeystore.sh <tenant-id>

TENANT_ID="${1:-}"

if [ -z "$TENANT_ID" ]; then
  echo "Usage: npm run generate:keystore -- <tenant-id>" >&2
  exit 1
fi

# Validate tenant ID format (lowercase alphanumeric + hyphens)
if ! echo "$TENANT_ID" | grep -qE '^[a-z0-9][a-z0-9-]*[a-z0-9]$'; then
  echo "Error: tenant-id must be lowercase alphanumeric with hyphens (e.g., acme-dental)" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_DIR="$REPO_ROOT/keystores"
KEYSTORE_PATH="$KEYSTORE_DIR/${TENANT_ID}-upload.jks"
KEY_ALIAS="upload"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE_PATH" ]; then
  echo "Error: keystore already exists at $KEYSTORE_PATH" >&2
  echo "Delete it first if you intend to regenerate." >&2
  exit 1
fi

# Generate a strong random password (32 chars, alphanumeric)
if command -v openssl &>/dev/null; then
  STORE_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
else
  STORE_PASSWORD=$(LC_ALL=C tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 32)
fi

echo ""
echo "Generating keystore for tenant: $TENANT_ID"
echo "  Path:     $KEYSTORE_PATH"
echo "  Alias:    $KEY_ALIAS"
echo "  Validity: 10000 days (~27 years)"
echo ""

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASSWORD" \
  -keypass "$STORE_PASSWORD" \
  -dname "CN=MBG Technology, OU=Mobile, O=MBG Technology LLC, L=City, ST=State, C=US"

echo ""
echo "=================================================="
echo " KEYSTORE GENERATED SUCCESSFULLY"
echo "=================================================="
echo ""
echo "  Tenant:            $TENANT_ID"
echo "  Keystore path:     $KEYSTORE_PATH"
echo "  Key alias:         $KEY_ALIAS"
echo "  Keystore password: $STORE_PASSWORD"
echo ""
echo "  IMPORTANT: Store this password in your team vault NOW."
echo "  Vault path:  mbg-mobile/$TENANT_ID/android-keystore-password"
echo ""
echo "  Next steps:"
echo "  1. Store the password in 1Password / your vault"
echo "  2. Register with EAS:"
echo "     APP_TENANT=$TENANT_ID NATIVE_ID_MODE=tenant \\"
echo "       eas credentials --platform android"
echo "  3. See docs/KEYSTORE_SOP.md for full procedures"
echo ""
