#!/usr/bin/env bash

set -e

echo "- \ | / - \ | / POSTBUILD \ | / - \ | / -"
echo '📁 Making bin directory for NodeJS at ./dist/bin'
mkdir -pv ./dist/{bin,shared} || { echo "🛑 Error - could not create ./dist/ subdirectories" && exit 1; }
if [ -f node ]; then
  if [ -f ./dist/bin/node ]; then
    echo "✔️  Node binary already exists in ./dist/bin, skipping copy"
  else
    cp node ./dist/bin/ || { echo "🛑 Error - Could not copy node to ./dist/bin" && exit 1; }
  fi
else
  echo "📂 Copying node binary to ./dist/bin"
  echo "🛑 Node binary not found - please make sure the 'node' binary is in your project root"
fi
echo "📂 Copying node shared libraries to ./dist/shared"
cp shared/schema.ts ./dist/shared/ || { echo "🛑 Error - Could not copy node shared libraries to ./dist/shared" && exit 1; }
echo "📄 Copying server-package.json to ./dist"
cp server/server-package.json ./dist/package.json || { echo "🛑 Error - Could not copy package.json to ./dist" && exit 1; }
echo "📄 Copying pnpm-lock.yaml to ./dist"
cp pnpm-lock.yaml dist || { echo "🛑 Error - Could not copy package.json to ./dist" && exit 1; }

echo "✔️  Post-build script completed successfully."
echo "- \ | / - \ | / - \ | / - \ | / - \ | / -"
echo "📦 Installing server dependencies"
