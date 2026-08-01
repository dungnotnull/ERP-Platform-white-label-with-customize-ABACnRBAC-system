const env = import.meta.env;

export enum NodeEnv {
  DEV = "development",
  PROD = "production",
  UAT = "uat"
}

const config = {
  env: env?.NODE_ENV,
  isProd() {
    return this.env === NodeEnv?.PROD;
  },
  isDev() {
    return this.env === NodeEnv?.PROD;
  },
  isUAT() {
    return this.env === NodeEnv?.UAT;
  },
  host: env?.VITE_HOST ?? "localhost",
  port: env?.VITE_PORT ?? 5173,
  url: env?.VITE_URL ?? "localhost:5173",
  serverHost: env?.VITE_SERVER_HOST ?? "localhost",
  serverPort: env?.VITE_SERVER_PORT ?? 4000,
  serverUrl: (env?.VITE_SERVER_URL ?? "http://localhost:8000")
    .trim()
    .replace(/\/$/, ""),
  apiVersion: env?.VITE_API_VERSION ?? "/v1",
  apiPath: env?.VITE_API_PATH ?? "/api",
  getApiUrl(route = "") {
    const base = `${this.serverUrl}${this.apiPath}${this.apiVersion}`;
    if (!route) return base;
    return `${base}${route.startsWith("/") ? route : `/${route}`}`;
  },
  thirdParty: {
    firebase: {
      apiKey: env?.VITE_FIREBASE_API_KEY ?? "",
      authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN ?? "",
      projectId: env?.VITE_FIREBASE_PROJECT_ID ?? "",
      storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: env?.VITE_FIREBASE_APP_ID ?? ""
    }
  }
};

export default config;
