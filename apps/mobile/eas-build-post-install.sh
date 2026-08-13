#!/usr/bin/env bash
# EAS Build hook: builds the @pulso/shared workspace package after `npm install`,
# before the app is bundled. dist/ is gitignored, so EAS's uploaded archive never
# contains it — without this, Metro can't resolve `@pulso/shared`'s `main` entry.
set -e
cd "$(dirname "$0")/../.."
npm run build:shared
