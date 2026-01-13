/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: 282554793,
    NEXT_PUBLIC_ZEGO_SERVER_ID: "47827e93d8d81531ea911f3bac6eda4d"
  },
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;


// const nextConfig = {
//   env: {
//     NEXT_PUBLIC_ZEGO_APP_ID: 282554793,
//   NEXT_PUBLIC_ZEGO_SERVER_ID: "47827e93d8d81531ea911f3bac6eda4d",

//   },
//   cache: false,
//   reactStrictMode: false,
//   images: {
//     domains: ["localhost"],
//   },
//   webpack: (config) => {
//     config.cache = false; // disables webpack caching
//     return config;
//   },
// };

// module.exports = nextConfig;

