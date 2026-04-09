# Vercel Deployment Protection — Allow frontend preview to access backend

This repository's backend deployment is currently protected by Vercel authentication, which returns an HTML 401 page before your server runs. Because that page doesn't include CORS headers, browser requests from preview frontends are blocked.

Options to allow your frontend preview to reach the backend:

1. Disable deployment protection (recommended for quick verification)

- Go to the Vercel dashboard and open the backend project.
- Open `Settings` for the project, then look for `Protection` / `Deployment Protection` / `Security` (labels vary by account/plan).
- Disable "Require authentication for preview deployments" or turn off the protection option.
- Redeploy the backend.

2. Use a protection-bypass token (when you cannot disable protection)

- In the same project `Settings` look for a "Bypass token" or "Protection bypass" area.
- Create a bypass token.
- Use the following URL pattern to access your endpoint and set the bypass cookie automatically:

```
https://<your-backend-domain>/<path>?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=<TOKEN>
```

Example (health):

```
curl -i "https://stockme-backend-qtm7hlfou-turquoise24s-projects.vercel.app/health?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=<TOKEN>"
```

Reference: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation

3. Temporary alternatives

- Deploy the backend to a publicly accessible host (temporary staging) or
- Use a local tunnel (ngrok) for quick frontend -> local-backend testing.

After you remove protection or generate a bypass token, re-run the preflight and health checks:

```
curl -i -X OPTIONS "https://<your-backend>/api/v1/auth/login" \
  -H "Origin: https://<your-frontend>" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"

curl -i -H "Origin: https://<your-frontend>" "https://<your-backend>/health"
```

Notes:

- I reverted the temporary permissive CORS change in `backend/server.js` in this repo. If you want a temporary permissive test deploy, re-enable `cors({ origin: true, credentials: true })` and redeploy, but remember to revert it afterwards.
- If you want, I can guide you step-by-step in the Vercel UI — tell me which option you prefer.
