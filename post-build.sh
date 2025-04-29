#!/usr/bin/env bash

set -e

echo "- \ | / - \ | / POSTBUILD \ | / - \ | / -"
echo '📁 Making bin directory for NodeJS at ./dist/bin'
mkdir -pv ./dist/{bin,shared} || { echo "🛑 Error - could not create ./dist/ subdirectories" && exit 1; }
if [ -f node ]; then
  if [ -f ./dist/bin/node ]; then
    echo "✔️  Node binary already exists in ./dist/bin, skipping copy"
  else
    echo "📂 Copying node binary to ./dist/bin" 
    cp node ./dist/bin/ || { echo "🛑 Error - Could not copy node to ./dist/bin" && exit 1; }
    echo "👷 Making NodeJS executable"
    chmod +x ./dist/bin/node || { echo "🛑 Error - Could not make node executable" && exit 1; }
  fi
else
  echo "🛑 Node binary not found - please make sure the 'node' binary is in your project root"
fi

echo "📂 Copying node shared libraries to ./dist/shared"
cp shared/schema.ts ./dist/shared/ || { echo "🛑 Error - Could not copy node shared libraries to ./dist/shared" && exit 1; }
echo "📄 Copying server-package.json to ./dist"
cp server/server-package.json ./dist/package.json || { echo "🛑 Error - Could not copy package.json to ./dist" && exit 1; }

echo "📦 Installing server dependencies"
if [ -f ./dist/package.json ]; then
    echo "✔️  package.json and pnpm-lock.yaml found, installing dependencies"
    npm install --omit=dev --prefix ./dist || { echo "🛑 Error - Could not install dependencies" && exit 1; }
else
  echo "🛑 Error - package.json not found, please make sure it is in the ./dist directory"
  exit 1
fi
if [ ! -d "./dist/node_modules" ]; then
  echo "🛑 Error - node_modules directory is missing in ./dist"
  exit 1
fi
echo "✔️  All dependencies installed successfully - continuing tauri build"
echo "✔️  Post-build script completed successfully."
echo "- \ | / - \ | / - \ | / - \ | / - \ | / -"