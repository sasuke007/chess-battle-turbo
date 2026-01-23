/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output for Docker builds
  // Amplify uses standard Next.js output
  ...(process.env.USE_STANDALONE === 'true' && { output: 'standalone' }),
};

export default nextConfig;
