#!/usr/bin/env bash

echo "- \ | / - \ | / POSTBUILD \ | / - \ | / -"
echo '\n Making bin directory for NodeJS at ./dist/bin ...'
mkdir -pv ./dist/{bin,shared} || echo "Error - could not create ./dist/ subdirectories ..."
echo "Copying node binary to ./dist/bin ..."
cp node ./dist/bin/ || echo "Error - Could not copy node to ./dist/bin  ..."
echo "Copying node shared libraries to ./dist/shared ..."
cp shared/schema.ts ./dist/shared/ || echo "Error - Could not copy node shared libraries to ./dist/shared ..."
echo "Copying server-package.json to ./dist ..."
cp server-package.json dist/package.json || echo "Error - Could not copy package.json to ./dist ..."
echo "Copying pnpm-lock.yaml to ./dist ..."
cp pnpm-lock.yaml dist || echo "Error - Could not copy package.json to ./dist ..."
