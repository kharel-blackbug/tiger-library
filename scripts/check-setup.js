#!/usr/bin/env node
'use strict'
const required = [
  'express','helmet','cors','compression','cookie-parser',
  'express-rate-limit','bcryptjs','jsonwebtoken','multer',
  'googleapis','dayjs','dotenv'
]
let ok = true
for (const pkg of required) {
  try { require(pkg) }
  catch {
    process.stderr.write(`\n✗ Missing package: "${pkg}"\n  Run:  npm install\n\n`)
    ok = false
  }
}
if (!ok) process.exit(1)
