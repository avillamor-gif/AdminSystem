const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: true,  // disable next-pwa — plain sw.js in public/ handles push
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
