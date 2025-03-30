/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  // Enable static export for Amplify Gen 1
  output: 'export',
  
  // Skip ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add trailing slashes for better compatibility
  trailingSlash: true,
  
  // Required for static export with images
  images: {
    unoptimized: true
  },
  
  // Your webpack config with corrected path resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-exports': path.resolve(__dirname, '../src/aws-exports.js'),
    };
    return config;
  }
};