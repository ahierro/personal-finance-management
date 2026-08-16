import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The official MongoDB driver is CommonJS and pulls optional binaries: it stays out of
  // the server bundle and is resolved at runtime.
  serverExternalPackages: ['mongodb'],
  // The message bundles are read from disk at runtime, so a standalone build has to carry
  // them along; without this they would be left behind by the file tracer.
  outputFileTracingIncludes: {
    '/**': ['./messages/**'],
  },
};

export default nextConfig;
