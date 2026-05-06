const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: true,  // disable next-pwa — plain sw.js in public/ handles push
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'd3-org-chart',
    'd3-flextree',
    'd3-selection',
    'd3-array',
    'd3-hierarchy',
    'd3-zoom',
    'd3-shape',
    'd3-group',
  ],
}

module.exports = nextConfig
