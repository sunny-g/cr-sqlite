#! /bin/bash

mkdir -p packages/crsqlite-wasm/dist
cd deps/emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ../wa-sqlite
make
cp dist/crsqlite.wasm ../../packages/crsqlite-wasm/dist/crsqlite.wasm
cp dist/crsqlite.mjs ../../packages/crsqlite-wasm/src/crsqlite.mjs
