# E-Tutoring Frontend

React + TypeScript + Vite frontend with Tailwind CSS, React Query, React Hook Form, Zustand, and Framer Motion.

## Setup

```bash
npm install
```
This installs dependencies and runs the prepare script (Husky).

```bash
npm run prepare
```

## Environment

Copy `.env.example` to `.env` or `.env.local` and set values. Use `import.meta.env` (e.g. `VITE_API_BASE_URL` for the Laravel API base URL).

```bash
cp .env.example .env.local
```


## Scripts

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start dev server (Vite HMR)                         |
| `npm run build`   | Type-check and production build                     |
| `npm run preview` | Preview production build                            |
| `npm run lint`    | Run ESLint (and Prettier via lint-staged on commit) |
| `npm run lint:fix` | Automatically fix all auto-fixable lint and style errors |
| `npm run typecheck` | Run TypeScript compiler to catch logic errors (no build) |
| `npm run format`    | Force Prettier to reformat all files and sort Tailwind classes |
| `npm run format:check`    | Verify that all files follow the Prettier rules |
| `npm run validate`    | Run type-check, lint, and format checks in sequence |

## Installed packages & setup

| Package                                                 | Purpose               | Where it's set up                                                   |
| ------------------------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| **@tanstack/react-query**                               | Server state, caching | `lib/query-client.ts`, `providers.tsx`. Use in `features/*/hooks/`. |
| **@tanstack/react-query-devtools**                      | DevTools              | `providers.tsx` in dev only.                                        |
| **react-router-dom**                                    | Routing               | `providers.tsx`, `routes.tsx`, `routes/paths.ts`.                   |
| **sonner** (shadcn)                                     | Toasts                | `components/ui/sonner.tsx`. `import { toast } from 'sonner'`.       |
| **zustand**                                             | Client state          | `store/`. Example: `store/example.ts`.                              |
| **react-hook-form** + **@hookform/resolvers** + **zod** | Forms                 | `lib/form.ts`, `hooks/useZodForm.ts`.                               |
| **class-variance-authority** (cva)                      | Variants              | `utils/index.ts`: `cva`, `VariantProps`.                            |
| **clsx** + **tailwind-merge**                           | Class names           | `utils/index.ts`: `cn()`.                                           |
| **framer-motion**                                       | Animations            | `import { motion } from 'framer-motion'`.                           |
| **lucide-react**                                        | Icons                 | `import { IconName } from 'lucide-react'`.                          |
| **shadcn/ui** (components.json)                         | UI components         | `components/ui/`. Add: `npx shadcn@latest add button`.              |
| **tailwindcss-animate**                                 | Tailwind animations   | `tailwind.config.js`.                                               |

## Toasts (Sonner)

`<Toaster />` in `providers.tsx`. Use: `import { toast } from 'sonner'` then `toast()`, `toast.success()`, `toast.error()`.

## Laravel API

- **Base URL**: Set `VITE_API_BASE_URL` to your Laravel API base
- **Client**: `src/lib/api-client.ts` — `apiClient(path, init)` for fetch with credentials (Sanctum cookies), JSON, optional `token` for Bearer auth.
- **Endpoints**: Add functions in `src/api/` (e.g. `src/api/health.ts`). Use with React Query: `useQuery({ queryKey: [...], queryFn: api.getSomething })`.
- **Example**: `useHealthCheck()` calls `GET /api/health`; the home page shows API status. Ensure Laravel CORS allows your frontend origin

---

# React + TypeScript + Vite (template notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
