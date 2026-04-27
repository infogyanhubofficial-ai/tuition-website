import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zuktarghyexwodqnnxlu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
  // Add the maintenance redirect here
  async redirects() {
    return [
      {
        // Match all paths EXCEPT /maintenance
        source: '/((?!maintenance).*)',
        destination: '/maintenance',
        permanent: false, // Keep this false so browsers know it's temporary
      },
    ];
  },
};

export default nextConfig;