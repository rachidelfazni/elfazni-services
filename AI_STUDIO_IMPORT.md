# ELFAZNI SERVICES — editable source

Contains the website, Node/Express backend, CRM, and existing project assets and data.

Changes: startup scripts use `node --import tsx server.ts`. Website and CRM production builds and the main TypeScript check passed locally.

## Continue editing in Google AI Studio

Import the complete project. Preserve the website, CRM, server APIs, Bahij font, and brand identity. Arabic brand name: الفزني سيرفيسز.

Use Node.js 24 or newer. Install dependencies at the project root and in `crm`.

```bash
npm install
npm --prefix crm install
npm run lint
npm run build
npm run dev
```

`npm run build` already builds both apps. Website: `/`; admin: `/admin`; CRM: `/admin/crm/`.

Local secret values are excluded. Copy `.env.example` to `.env` and set your own values when running locally. Use the hosting environment secret settings when deploying. Existing project data is included; keep this archive private.

The server requires an environment that supports Node, API routes, and persistent storage. A frontend-only preview does not run these backend features.
