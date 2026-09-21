import type { NextConfig } from 'next';
import { withMicrofrontends } from '@repo/microfrontends/next/config';

const nextConfig: NextConfig = {};

export default withMicrofrontends(nextConfig);
