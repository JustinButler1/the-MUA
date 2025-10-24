#!/bin/bash

# Script to get Android SHA-1 fingerprint for Google OAuth setup
# This is needed when creating the Android OAuth Client ID in Google Cloud Console

echo "========================================="
echo "Getting Android SHA-1 Fingerprint"
echo "========================================="
echo ""

cd "$(dirname "$0")/.." || exit

if [ ! -d "android" ]; then
    echo "❌ Error: android directory not found"
    echo "   Make sure you're running this from the project root"
    exit 1
fi

cd android || exit

echo "Running Gradle signing report..."
echo ""

./gradlew signingReport 2>&1 | grep -A 3 "Variant: debug" | grep "SHA1:"

if [ $? -ne 0 ]; then
    echo "❌ Could not find SHA-1 fingerprint"
    echo "   Try running: cd android && ./gradlew signingReport"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Copy the SHA1 value above and use it"
echo "   when creating your Android OAuth Client ID"
echo "   in Google Cloud Console"
echo "========================================="

