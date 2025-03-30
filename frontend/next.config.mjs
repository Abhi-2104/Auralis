/** @type {import('next').NextConfig} */
// Use ES Module syntax in next.config.mjs
import path from 'path';

export default {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-exports': path.resolve('E:/cloudproj/Auralis/src/aws-exports.js'), // Use forward slashes
    };
    return config;
  }
};
