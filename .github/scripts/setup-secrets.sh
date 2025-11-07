#!/bin/bash

# Setup GitHub Secrets for Build & Deploy Workflow
# This script helps you configure all required secrets for local builds

set -e

REPO="duongdev/nv-internal"

echo "🔐 GitHub Secrets Setup for Local Builds"
echo "=========================================="
echo ""
echo "This script will help you set up all required secrets for the build-deploy workflow."
echo "Repository: $REPO"
echo ""

# Check if gh CLI is authenticated
if ! gh auth status &>/dev/null; then
  echo "❌ Error: GitHub CLI is not authenticated."
  echo "Please run: gh auth login"
  exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Function to set secret
set_secret() {
  local secret_name=$1
  local secret_value=$2
  local is_multiline=${3:-false}

  if [ -z "$secret_value" ]; then
    echo "⚠️  Skipping $secret_name (empty value)"
    return
  fi

  if [ "$is_multiline" = "true" ]; then
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
  else
    gh secret set "$secret_name" --body "$secret_value" --repo "$REPO"
  fi

  echo "✅ Set secret: $secret_name"
}

# ========================================
# iOS Secrets
# ========================================

echo "📱 iOS Secrets"
echo "--------------"

# App Store Connect API Key
echo ""
read -p "Enter App Store Connect Key ID: " ASC_KEY_ID
read -p "Enter App Store Connect Issuer ID: " ASC_ISSUER_ID
read -p "Enter path to .p8 file: " p8_path

if [ -f "$p8_path" ]; then
  ASC_KEY_CONTENT=$(cat "$p8_path")
  set_secret "ASC_KEY_ID" "$ASC_KEY_ID"
  set_secret "ASC_ISSUER_ID" "$ASC_ISSUER_ID"
  set_secret "ASC_KEY_CONTENT" "$ASC_KEY_CONTENT" true
else
  echo "⚠️  .p8 file not found. Please set ASC secrets manually."
fi

# Fastlane Match
echo ""
echo "Generating Fastlane Match passphrase..."
MATCH_PASSWORD=$(openssl rand -base64 32)
echo "Generated passphrase: $MATCH_PASSWORD"
echo "⚠️  SAVE THIS PASSPHRASE SECURELY!"
set_secret "MATCH_PASSWORD" "$MATCH_PASSWORD"

# SSH Key for Match Repository
echo ""
echo "Generating SSH key for Match repository..."
ssh-keygen -t ed25519 -C "github-actions@nv-internal" -f /tmp/nv_match_ci_temp -N ""
MATCH_GIT_PRIVATE_KEY=$(cat /tmp/nv_match_ci_temp)
MATCH_GIT_PUBLIC_KEY=$(cat /tmp/nv_match_ci_temp.pub)

set_secret "MATCH_GIT_PRIVATE_KEY" "$MATCH_GIT_PRIVATE_KEY" true

echo ""
echo "Add this public key as a deploy key to your certificates repository:"
echo "$MATCH_GIT_PUBLIC_KEY"
echo ""
read -p "Press Enter after adding the deploy key..."

rm -f /tmp/nv_match_ci_temp /tmp/nv_match_ci_temp.pub

# ========================================
# Android Secrets
# ========================================

echo ""
echo "🤖 Android Secrets"
echo "------------------"

# Android Keystore
echo ""
echo "Generating secure passwords for Android keystore..."
ANDROID_KEYSTORE_PASSWORD=$(openssl rand -base64 24)
ANDROID_KEY_ALIAS="nv-internal"
ANDROID_KEY_PASSWORD=$(openssl rand -base64 24)

echo "Generated passwords:"
echo "- Keystore Password: $ANDROID_KEYSTORE_PASSWORD"
echo "- Key Alias: $ANDROID_KEY_ALIAS"
echo "- Key Password: $ANDROID_KEY_PASSWORD"
echo "⚠️  SAVE THESE PASSWORDS SECURELY!"

set_secret "ANDROID_KEYSTORE_PASSWORD" "$ANDROID_KEYSTORE_PASSWORD"
set_secret "ANDROID_KEY_ALIAS" "$ANDROID_KEY_ALIAS"
set_secret "ANDROID_KEY_PASSWORD" "$ANDROID_KEY_PASSWORD"

# Google Play Service Account
echo ""
read -p "Do you have Google Play service account JSON? (y/n): " has_google_play
if [ "$has_google_play" = "y" ]; then
  read -p "Enter path to Google Play service account JSON file: " google_play_path
  if [ -f "$google_play_path" ]; then
    GOOGLE_PLAY_SERVICE_ACCOUNT=$(cat "$google_play_path")
    set_secret "GOOGLE_PLAY_SERVICE_ACCOUNT" "$GOOGLE_PLAY_SERVICE_ACCOUNT" true
  else
    echo "⚠️  File not found: $google_play_path"
  fi
else
  echo "⚠️  Skipping Google Play service account (you can add it later)"
fi

# ========================================
# Environment Variables
# ========================================

echo ""
echo "🌍 Environment Variables"
echo "------------------------"

# These might already be set in Vercel/EAS, but needed for local builds
echo ""
echo "Please provide the following environment variables:"
echo "(Press Enter to skip any that are already configured)"
echo ""

read -p "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: " CLERK_KEY
set_secret "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" "$CLERK_KEY"

read -p "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: " GMAPS_IOS
set_secret "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS" "$GMAPS_IOS"

read -p "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID: " GMAPS_ANDROID
set_secret "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID" "$GMAPS_ANDROID"

read -p "EXPO_PUBLIC_POSTHOG_API_KEY: " POSTHOG_KEY
set_secret "EXPO_PUBLIC_POSTHOG_API_KEY" "$POSTHOG_KEY"

# ========================================
# Summary
# ========================================

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Secrets configured for: $REPO"
echo ""
echo "Next steps:"
echo "1. Verify secrets at: https://github.com/$REPO/settings/secrets/actions"
echo "2. Run bundle install in apps/mobile/ to install Fastlane"
echo "3. Run bundle exec fastlane ios build_staging to test local build"
echo "4. Trigger workflow at: https://github.com/$REPO/actions/workflows/build-deploy.yml"
echo ""
echo "⚠️  IMPORTANT: All generated credentials have been displayed during setup."
echo "⚠️  Make sure you saved them to your password manager!"
echo ""
echo "Credentials to save:"
echo "- Fastlane Match Password (shown during generation)"
echo "- Android Keystore Password (shown during generation)"
echo "- Android Key Password (shown during generation)"
