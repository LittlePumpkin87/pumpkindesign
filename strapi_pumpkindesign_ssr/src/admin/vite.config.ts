import { mergeConfig, type UserConfig } from "vite";

export default (config: UserConfig) => {
  // Important: always return the modified config
  return mergeConfig(config, {
    server: {
      server: {
        allowedHosts: ["littlepumpkindesign.de", ".littlepumpkindesign.de"],
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  });
};
