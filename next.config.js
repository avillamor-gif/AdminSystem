const withPWA = require('next-pwa')({
  dest: 'public',
  register: false,
  skipWaiting: true,
  disable: true,  // disable next-pwa — plain sw.js in public/ handles push
})

const path = require('path')

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
  webpack(config) {
    // Force d3-org-chart to resolve to the pre-built UMD bundle,
    // bypassing the package "exports" field that blocks ./build/ subpaths.
    config.resolve.alias['d3-org-chart'] = path.resolve(
      __dirname,
      'node_modules/d3-org-chart/build/d3-org-chart.min.js'
    )
    return config
  },
}

module.exports = nextConfig
