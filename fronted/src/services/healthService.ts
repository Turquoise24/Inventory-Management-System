import axios from "axios";

const getApiBase = (): string => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://stockme-backend.vercel.app/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
};

export const healthService = {
  async checkHealth(): Promise<boolean> {
    try {
      const base = getApiBase();
      const url = `${base}/health`;
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
      });
      return response.status === 200;
    } catch (error) {
      console.error("Backend health check failed:", error);
      return false;
    }
  },
};
