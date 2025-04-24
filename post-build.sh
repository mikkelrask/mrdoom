#!/usr/bin/env bash

echo "- \ | / - \ | / POSTBUILD \ | / - \ | / -"
echo '\n Making bin directory for NodeJS at ./dist/bin ...'
mkdir -pv ./dist/bin || echo "Error - could not create ./dist/bin ..."
echo "Copying node binary to ./dist/bin ..."
cp node ./dist/bin/ || echo "Error - Could not copy node to ./dist/bin  ..."
echo "Copying package.json to ./dist ..."
cp package.json dist || echo "Error - Could not copy package.json to ./dist ..."
echo "Copying pnpm-lock.yaml to ./dist ..."
cp pnpm-lock.yaml dist || echo "Error - Could not copy package.json to ./dist ..."
