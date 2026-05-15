/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ilumetech/types',
    '@ilumetech/utils',
    'antd',
    '@ant-design',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
  ],
};

export default nextConfig;
