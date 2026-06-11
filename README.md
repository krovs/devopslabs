# DevOpsLabs

![DevOpsLabs octopus](src/assets/octopus.png)  My DevOps notes turned into exercises so I can remember them quickly.  ![DevOpsLabs octopus](src/assets/octopus.png)

## Stack

Svelte + TypeScript app for practicing DevOps, cloud, security, networking, Kubernetes, observability, FinOps, and MLOps troubleshooting labs.

All terminals, cloud resources, policy checks, and provider commands are simulated. The app does not call real AWS, Terraform, Kubernetes, GitHub, Argo CD, Flux, Vault, or ML services.

## Run Locally

```bash
npm install
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5173/
```

## Checks

```bash
npm run validate:scenarios
npm run test
npm run check
npm run build
```

## Deploy

GitHub Pages deploys from `.github/workflows/deploy.yml` on pushes to `main`.

Production URL:

```text
https://devopslabs.krovs.dev
```

## Project Layout

```text
src/                 Svelte app, simulators, docs, scenario loading
scenarios/           YAML lab definitions
public/              static assets and CNAME
styles.css           global styling and themes
index.html           Vite entry HTML
```

## Notes

- Lab progress is saved in `localStorage`.
- Scenario files are bundled at build time.
- Reference docs live in `src/docs.ts`.
