/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  distDir: '../public',
  env: {
    name: 'MaccHiato23',
    description: 'The official store for MaccHiato23 supported workspaces.',
    icon: 'https://macchiato23.github.io/kasm-registry/1.0/logo.png',
    listUrl: 'https://macchiato23.github.io/kasm-registry/',
    contactUrl: 'https://github.com/macchiato23/kasm-registry/issues',
  },
  reactStrictMode: true,
  basePath: '/kasm-registry/1.0',
  trailingSlash: true,
  images: {
    unoptimized: true,
  }
}

module.exports = nextConfig
