# Django + React JWT Authentication Starter

A minimal, production-shaped authentication system:

- **Backend:** Django + Django REST Framework + SimpleJWT, single `accounts` app, custom `User` model (email login).
- **Frontend:** React (Vite) + React Router, axios with automatic token refresh, dark mode.

## Project structure

```
project/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/                  # project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py / asgi.py
│   └── accounts/               # the one core app
│       ├── models.py           # custom User (email-based)
│       ├── serializers.py      # register / login / user / change-password
│       ├── views.py            # register, login, logout, me, refresh
│       ├── urls.py
│       └── admin.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/api.js     # axios instance + auth calls + auto-refresh
        ├── context/
        │   ├── AuthContext.jsx
        │   └── ThemeContext.jsx  # dark mode
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   └── Navbar.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Dashboard.jsx
```

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py makemigrations accounts
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/

python manage.py runserver         # http://127.0.0.1:8000
```

### API endpoints (`/api/auth/…`)

| Method | Endpoint                | Auth required | Description |
|--------|--------------------------|:--:|--------------|
| POST   | `/register/`             | No | Create account, returns user + tokens |
| POST   | `/login/`                | No | `{ email, password, remember_me }` → user + tokens |
| POST   | `/logout/`               | Yes | `{ refresh }` → blacklists the refresh token |
| GET    | `/me/`                   | Yes | Current user |
| PATCH  | `/me/`                   | Yes | Update first/last name |
| POST   | `/change-password/`      | Yes | `{ old_password, new_password }` |
| POST   | `/token/refresh/`        | No (needs refresh token) | `{ refresh }` → new access token |

Auth uses `Authorization: Bearer <access_token>`.

### Key backend design points

- **Custom User model** (`accounts.models.User`): email is the unique login identifier (`USERNAME_FIELD = "email"`); `username` is auto-filled from email so Django's internals stay happy.
- **Password hashing**: handled by `User.objects.create_user()` / `set_password()`, which use Django's PBKDF2 hasher — plaintext passwords are never stored.
- **Email validation**: `RegisterSerializer` validates format via `EmailField` and checks uniqueness case-insensitively.
- **JWT via SimpleJWT**: access tokens are short-lived (15 min); refresh tokens rotate and old ones are blacklisted (`ROTATE_REFRESH_TOKENS`, `BLACKLIST_AFTER_ROTATION`).
- **Remember me**: when `remember_me: true`, the issued refresh token gets a longer expiry (`REFRESH_TOKEN_LIFETIME_REMEMBER_ME`, 30 days vs 1 day).
- **Logout**: blacklists the refresh token server-side (requires `rest_framework_simplejwt.token_blacklist` app, already included).

## Frontend setup

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`, so make sure the Django server is running too.

### Key frontend design points

- **`services/api.js`**: single axios instance. A request interceptor attaches the access token; a response interceptor catches `401`s, calls `/token/refresh/` once, retries the original request, and force-logs-out if the refresh also fails.
- **Remember me → storage choice**: tokens go to `localStorage` when "remember me" is checked (persists across browser restarts) or `sessionStorage` otherwise (cleared when the tab closes).
- **`AuthContext`**: exposes `user`, `loading`, `login`, `register`, `logout`; loads the current user on mount if a token is present.
- **`ProtectedRoute`**: wraps private routes, redirects to `/login` (preserving the intended destination) when there's no authenticated user.
- **`ThemeContext`**: toggles a `data-theme` attribute on `<html>`, backed by CSS variables in `index.css`; persisted in `localStorage`.

## Trying it end to end

1. Start the backend (`runserver`) and frontend (`npm run dev`).
2. Visit `http://localhost:5173/register`, create an account → redirected to `/dashboard`.
3. Refresh the page — you stay logged in (token refresh / current-user check).
4. Click **Logout** — refresh token is blacklisted, redirected to `/login`.
5. Toggle **🌙 Dark / ☀️ Light** in the navbar to test dark mode.
6. Try logging in with "Remember me" checked vs. unchecked, then compare `localStorage` vs `sessionStorage` in devtools.

## Notes / next steps

- `SECRET_KEY` and `DEBUG` should come from environment variables in production (already wired to read `DJANGO_SECRET_KEY` / `DJANGO_DEBUG`).
- Swap the SQLite database for Postgres by changing `DATABASES` in `core/settings.py`.
- Add email verification by sending a confirmation link/token on register and gating `is_active` until confirmed.
- `CORS_ALLOWED_ORIGINS` currently only allows the Vite dev server — update for your deployed frontend URL.