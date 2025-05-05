#!/usr/bin/env bash

set -e

echo "- \ | / - \ | / POSTBUILD \ | / - \ | / -"
echo '📁 Setting up directories for Tauri resources'
mkdir -pv ./src-tauri/resources/app/shared || { echo "🛑 Error - could not create resource directories" && exit 1; }

if [ -f node ]; then
  if [ -f ./src-tauri/resources/node ]; then
    echo "✔️  Node binary already exists in ./src-tauri/resources, skipping copy"
  else
    echo "📂 Copying node binary to ./src-tauri/resources" 
    cp node ./src-tauri/resources/ || { echo "🛑 Error - Could not copy node to resources" && exit 1; }
    echo "👷 Making NodeJS executable"
    chmod +x ./src-tauri/resources/node || { echo "🛑 Error - Could not make node executable" && exit 1; }
  fi
else
  echo "🛑 Node binary not found - please make sure the 'node' binary is in your project root"
fi

echo "📂 Copying node shared libraries to ./src-tauri/resources/app/shared"
cp shared/schema.ts ./src-tauri/resources/app/shared/ || { echo "🛑 Error - Could not copy shared libraries" && exit 1; }

echo "📄 Copying server-package.json to ./src-tauri/resources/app"
cp server/server-package.json ./src-tauri/resources/app/package.json || { echo "🛑 Error - Could not copy package.json" && exit 1; }

echo "📂 Copying built index.cjs to ./src-tauri/resources/app"
cp dist/index.cjs ./src-tauri/resources/app/ || { echo "🛑 Error - Could not copy index.cjs" && exit 1; }

echo "📂 Copying public directory to ./src-tauri/resources/app"
cp -r dist/public ./src-tauri/resources/app/ || { echo "🛑 Error - Could not copy public directory" && exit 1; }

echo "📦 Installing server dependencies"
if [ -f ./src-tauri/resources/app/package.json ]; then
    echo "✔️  package.json found, installing dependencies"
    npm install --omit=dev --prefix ./src-tauri/resources/app || { echo "🛑 Error - Could not install dependencies" && exit 1; }
else
  echo "🛑 Error - package.json not found in resources/app directory"
  exit 1
fi

if [ ! -d "./src-tauri/resources/app/node_modules" ]; then
  echo "🛑 Error - node_modules directory is missing in resources/app"
  exit 1
fi

echo "✔️  All dependencies installed successfully - continuing tauri build"
echo "✔️  Post-build script completed successfully."
echo "- \ | / - \ | / - \ | / - \ | / - \ | / -"