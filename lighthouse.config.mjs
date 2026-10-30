export default {
  baseUrl: process.env.AUDIT_URL || "http://127.0.0.1:4173",
  pages: { home: "/", detail: "/nft/nft-1" },
  runs: 3,
  categories: ["performance", "accessibility", "best-practices", "seo"],
  mobile: {
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
  desktop: {
    preset: "desktop",
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  },
};
