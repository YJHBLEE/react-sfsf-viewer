# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React-based HR information visualization application** (SuccessFactors Viewer) that runs on **SAP Business Technology Platform (BTP)**. It displays employee performance evaluations, career history, and related HR data by integrating with SuccessFactors OData v2 APIs.

**Tech Stack:**
- React 18 with Vite
- TailwindCSS for styling
- Axios for API calls
- i18next for internationalization (Korean, English, Japanese)
- SAP BTP services: Managed AppRouter, XSUAA, Destination Service

## Development Commands

```bash
# Development server (with Vite proxy for local testing)
npm run dev

# Production build (creates zip in dist/)
npm run build

# Preview production build
npm run preview

# Build as SAP BTP MTA (Multi-Target Application)
npm run build:mta
```

## Critical Architecture Patterns

### 1. CSRF Token Management (SAP BTP Managed AppRouter)

**IMPORTANT:** This application runs behind SAP BTP Managed AppRouter. CSRF tokens MUST be fetched from the AppRouter itself (via `/user-api/currentUser`), NOT from the SuccessFactors backend.

- Token fetching: [src/services/sfService.js:87-113](src/services/sfService.js#L87-L113) `fetchAppRouterToken()`
- Axios interceptors handle automatic token injection and retry on 403 errors
- See [CSRF_LEARNINGS.md](CSRF_LEARNINGS.md) for detailed troubleshooting history

**Key Rules:**
- Always use `x-csrf-token: fetch` header when fetching tokens from `user-api/currentUser`
- Never bypass CSRF protection with `csrfProtection: false` in production
- Tokens are cached globally and refreshed automatically on 403 errors

### 2. API Routing Through BTP Destinations

All SuccessFactors API calls are proxied through SAP BTP Destinations defined in [public/xs-app.json](public/xs-app.json):

- `/SuccessFactors_API/*` → SuccessFactors OData v2 API
- `/user-api/*` → SAP Managed AppRouter user info service
- `/api/*` → Custom backend CAP service (future enhancement)

**Local Development:** [vite.config.js](vite.config.js) provides proxy rules that bypass BTP and connect directly to SuccessFactors with hardcoded credentials (for dev only).

### 3. Service Layer Architecture

The codebase follows a clean separation of concerns:

```
src/
├── services/
│   └── sfService.js          # Central API service with all SuccessFactors calls
├── hooks/
│   └── useSFData.js          # Custom hook for data fetching + loading/error states
├── context/
│   └── AppContext.jsx        # Global state (user, language, notifications)
└── components/               # UI components (Header, ProfileHeader, etc.)
```

**Pattern:** Components use `useSFData()` hook → hook calls `sfService` methods → service manages Axios instance with interceptors.

### 4. Data Fetching Strategy

User identification happens in two steps (see [src/hooks/useSFData.js:23-54](src/hooks/useSFData.js#L23-L54)):

1. **Backend API call** (`/api/projman/SFSF_User`) to get the current user's SuccessFactors `userId` via principal propagation
2. **Parallel data fetching** for photo and job history using the obtained `userId`

**Local Development Exception:** When running on localhost, the app falls back to fetching `sfadmin` profile directly from OData API.

### 5. Internationalization (i18n)

All UI text MUST use i18next translation keys. The app supports Korean (default), English, and Japanese.

- Translation files: [src/i18n/locales/](src/i18n/locales/)
- Usage: `const { t } = useTranslation(); t('common.loading')`
- Language switching: Integrated in Header component via `AppContext`

**Rule:** Never hardcode user-facing strings. Always add translation keys to all three language files.

### 6. Performance Evaluation Module

The app has a custom performance management system built on SuccessFactors Custom MDF objects:

- `cust_PMPeriodMapping`: Maps SF template IDs to business categories/periods
- `cust_PMSummaryScores`: Stores aggregated scores (e.g., H1+H2 combined)

See [SF_CUSTOM_MDF_SPEC.md](SF_CUSTOM_MDF_SPEC.md) for full specification.

**Key Components:**
- [src/components/PerformanceInbox.jsx](src/components/PerformanceInbox.jsx): Lists performance evaluations filtered by category/period
- [src/components/PMDetailView.jsx](src/components/PMDetailView.jsx): PM form detail view
- [src/components/360MultiRaterDetailView.jsx](src/components/360MultiRaterDetailView.jsx): 360-degree feedback view

## Important SuccessFactors OData Entities

- `User`: Basic profile (name, title, department)
- `Photo`: User photos (query with `photoType=1`)
- `EmpJob`: Job history with `$expand=eventNav,companyNav,departmentNav`
- `FormFolder`: Contains performance evaluation forms
- `FormContent` + `FormPMReviewContentDetail`: PM form data
- `Form360ReviewContentDetail`: 360 evaluation data (use 2-step loading to avoid 504 timeouts)

## Code Style Rules

1. **Apostrophes and quotes in JSX:** Use HTML entities (`&apos;`, `&quot;`) for Vercel compatibility
2. **Mobile-first responsive design:** All components must work on mobile
3. **Professional tone:** Use clear business terminology in UI text
4. **Component structure:** Keep components focused; extract reusable logic to hooks
5. **API calls:** Always go through `sfService` - never call Axios directly from components

## Security Notes

- Never expose `userId` in URL parameters in production
- The codebase currently makes direct OData calls from frontend; future enhancement will move all user-specific queries behind a CAP middleware layer with principal propagation
- [vite.config.js](vite.config.js) contains hardcoded credentials - this file should NEVER be deployed to production (only used for local dev)

## Common Pitfalls

1. **403 Forbidden errors:** Usually means CSRF token is missing or expired. Check that `fetchAppRouterToken()` is being called correctly.
2. **504 Timeout on 360 forms:** 360 detail views have large nested data. Always use the 2-step loading approach in `sfService.getForm360Detail()`.
3. **Missing translations:** If text appears as a key like `common.someKey`, the translation is missing from locale JSON files.
4. **Local vs BTP behavior differences:** Local dev uses Vite proxy with basic auth; BTP uses Destinations with OAuth2. Test both environments.

## Project Documentation

- [PROJECT_GUIDE.md](PROJECT_GUIDE.md): Comprehensive project strategy, architecture, and development roadmap (Korean)
- [SF_CUSTOM_MDF_SPEC.md](SF_CUSTOM_MDF_SPEC.md): Custom MDF object specifications for PM module (Korean)
- [CSRF_LEARNINGS.md](CSRF_LEARNINGS.md): Detailed CSRF troubleshooting history and solutions (Korean)
