<p align="center">
  <strong>Peerly</strong>
</p>

<p align="center">
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node" /></a>
  <a href="https://vitejs.dev" target="_blank"><img src="https://img.shields.io/badge/vite-7.x-646CFF.svg" alt="Vite" /></a>
  <a href="https://react.dev" target="_blank"><img src="https://img.shields.io/badge/react-18.x-61DAFB.svg" alt="React" /></a>
  <a href="https://www.typescriptlang.org" target="_blank"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript" /></a>
</p>

<p align="center">University social network to connect with campus peers by interests, schedules and location.</p>

<p align="center">Frontend built with <a href="https://react.dev" target="_blank">React</a>, <a href="https://vitejs.dev" target="_blank">Vite</a> and <a href="https://www.typescriptlang.org" target="_blank">TypeScript</a>.</p>

## Description

Frontend repository for the **Peerly** project: a web app for students to find study peers based on interests, schedules and campus location.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# Development (dev server with hot reload)
$ npm run dev

# Production build
$ npm run build

# Preview production build
$ npm run preview

# Build in development mode
$ npm run build:dev
```

## Run tests

```bash
# Unit tests (single run)
$ npm run test

# Tests in watch mode
$ npm run test:watch

# E2E tests (Playwright)
$ npx playwright test
```

## Linter

```bash
$ npm run lint
```

## Deployment

To deploy the application to production:

1. Generate the build: `npm run build`
2. The `dist/` folder contains the static files ready to serve.

You can deploy to any static or SSR hosting platform that supports static sites, for example:

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)
- Any web server (Nginx, Apache) serving the `dist/` folder

See the [Vite deployment documentation](https://vitejs.dev/guide/static-deploy.html) for more options.

## Technologies

- **Vite** — Build tool and dev server
- **React** — UI library
- **TypeScript** — Static typing
- **React Router** — Routing
- **shadcn/ui** (Radix UI) — Accessible components
- **Tailwind CSS** — Styling
- **TanStack Query** — Server state and cache
- **Vitest** — Unit tests
- **Playwright** — E2E tests

## Requirements

- **Node.js** ≥ 18 and **npm** — [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## License

Peerly is [MIT licensed](LICENSE).
