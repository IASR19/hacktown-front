const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Obter token do localStorage
    const token = localStorage.getItem("token");

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Se receber 401, redirecionar para login
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error: ${response.status}`, errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      // Handle 204 No Content or empty responses
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        return undefined as T;
      }

      // Check if response has content
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return undefined as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API request failed: ${url}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
