import axios from "axios";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// "Remember me" decides WHERE tokens are persisted:
//  - true  -> localStorage (survives browser restarts)
//  - false -> sessionStorage (cleared when the tab/browser closes)
function getStore() {
  return localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage;
}

export const tokenStorage = {
  save(tokens, rememberMe) {
    const store = rememberMe ? localStorage : sessionStorage;
    // make sure we don't leave stale tokens in the other storage
    const other = rememberMe ? sessionStorage : localStorage;
    other.removeItem(ACCESS_KEY);
    other.removeItem(REFRESH_KEY);

    store.setItem(ACCESS_KEY, tokens.access);
    store.setItem(REFRESH_KEY, tokens.refresh);
  },
  getAccess() {
    return getStore().getItem(ACCESS_KEY);
  },
  getRefresh() {
    return getStore().getItem(REFRESH_KEY);
  },
  setAccess(access) {
    getStore().setItem(ACCESS_KEY, access);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request comes back 401, try to refresh the access token once,
// then replay the original request. If refresh also fails, log out.
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = ["/auth/login/", "/auth/register/", "/auth/token/refresh/"].some((p) =>
      original?.url?.includes(p)
    );

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const refresh = tokenStorage.getRefresh();
      if (!refresh) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post("/api/auth/token/refresh/", { refresh })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        tokenStorage.setAccess(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------
export const authApi = {
  register: (payload) => api.post("/auth/register/", payload),
  login: (payload) => api.post("/auth/login/", payload),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  me: () => api.get("/auth/me/"),
  updateMe: (payload) => api.patch("/auth/me/", payload),
  changePassword: (payload) => api.post("/auth/change-password/", payload),
};

export default api;