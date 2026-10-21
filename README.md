# DiaMonitor Global

**A multilingual, patient-centred diabetes self-management and clinical consultation companion.**

DiaMonitor Global helps people living with diabetes keep their daily health information in one place, understand glucose trends, prepare for consultations, and follow practical self-care guidance. The interface is designed with accessibility and familiar Malaysian food and lifestyle contexts in mind.

> **Important:** DiaMonitor is a health-support and educational application, not a medical device or a substitute for professional diagnosis, treatment, or emergency services. Automated insights, forecasts, and AI responses must not be used alone to make medication or emergency-care decisions.

## Contents

- [The problem](#the-problem)
- [Our solution](#our-solution)
- [Features](#features)
- [User journeys](#user-journeys)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Available commands](#available-commands)
- [Data storage and authentication](#data-storage-and-authentication)
- [Testing](#testing)
- [Safety and privacy](#safety-and-privacy)
- [Contributing](#contributing)

## The problem

Managing diabetes requires more than occasional glucose measurements. Patients may need to keep track of readings, symptoms, meals, medication schedules, physical activity, and clinician recommendations. When these records are scattered, it becomes harder to recognize patterns or explain what happened between appointments. Language barriers and complex interfaces can make consistent self-management even more difficult, particularly for older adults.

## Our solution

DiaMonitor brings everyday diabetes-management activities together in a responsive web application. It combines structured health records, readable summaries, reminders, personalized educational guidance, consultation preparation, and a patient-facing assistant. The application supports **English, Bahasa Melayu, and Simplified Chinese** and includes Malaysian-context food guidance.

The system is intended to **support patient awareness and conversations with healthcare professionals**, not to replace clinical judgement.

## Features

### 1. Overview and glucose tracking

- Record blood-glucose measurements and review past entries.
- View glucose charts and readable summaries of recorded values.
- Surface recent readings, trends, and relevant next actions.
- Review pattern-based insights and supporting evidence where available.
- Access important daily tasks from the overview.

### 2. Daily care plan

- Review a seven-day, Monday–Sunday educational care guide.
- Explore breakfast, lunch, dinner, activity, and lifestyle suggestions.
- Use examples grounded in familiar Malaysian routines and foods.
- Track check-ins and review care-plan goals and clinician feedback.
- Keep educational suggestions separate from doctor-defined goals.

### 3. Medication tracking

- Set up and edit medication schedules.
- Mark scheduled medication as **Taken**, **Skipped**, or **Remind Later**.
- Review upcoming in-app reminders and medication history.
- Preserve entries across sessions using the application's persistence layer.

### 4. Meal and activity companions

- Log meals and explore food-related glucose insights.
- Use meal-photo entry and analysis workflows where the associated service is configured.
- Review activity-related educational support and health-context information.
- Interpret suggestions as guidance, not measured nutrient or clinical facts.

### 5. Doctor visit preparation

- Review consultation-oriented glucose statistics, including recorded minimum, maximum, average, and share of discrete readings within the configured range.
- Prepare questions and a summary for a healthcare appointment.
- Review clinician feedback and follow-up information.
- Use printable consultation reports.
- Explore doctor-editing workflows for consultation planning.

**Clinical distinction:** The share of individual readings within range is **not** continuous-glucose-monitoring Time in Range (CGM TIR).

### 6. Caregiver support

- Configure caregiver relationships and consent settings.
- Select categories of alerts that may be shared.
- Review evidence-backed alerts, timestamps, history, and acknowledgements.
- Revoke sharing consent.
- Use deterministic rules for supported glucose-pattern and safety alerts.

### 7. AI-assisted guidance

- Ask patient-friendly questions through the Copilot interface.
- Use application-record context for supported answers.
- Apply server-side validation and safety handling to requests.
- Use the assistant only when its required backend credentials and services are configured.

AI-generated responses can be incomplete or inaccurate and must not override clinician advice.

### 8. Accessibility and language

- English, Bahasa Melayu, and Simplified Chinese interface content.
- Mobile-friendly layouts and larger, clearer interaction targets.
- Patient-friendly wording and direct navigation to common tasks.
- A consistent visual experience across the application.

## User journeys

**Daily self-management:** Open the overview → add a glucose reading → review the latest value and trend → check the care plan → update medication status.

**Preparing for an appointment:** Review recorded glucose history → examine consultation statistics → add questions → open or print the doctor-visit summary.

**Caregiver support:** Configure a caregiver and sharing consent → create or review supported alerts → inspect evidence → acknowledge alerts → revoke consent if needed.

**Meal guidance:** Record a meal or use the meal-photo workflow → review available food insights → compare with personal glucose records where supported.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Language | TypeScript |
| Frontend | React 19 |
| App framework and routing | TanStack Start and TanStack Router |
| Development and build | Vite 8 |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI, Lucide React |
| Charts | Recharts |
| Forms and validation | React Hook Form, Zod |
| Data fetching | TanStack Query |
| Authentication / online data services | Supabase integration |
| Database tooling | Drizzle ORM, PostgreSQL migration files |
| Tests | Vitest, Testing Library |
| Formatting / linting | Prettier, ESLint |

Dependencies are documented in [`package.json`](package.json); actual versions may change as the project evolves.

## Project structure

```text
.
├── public/                  # Static assets and branding
├── src/
│   ├── components/          # Patient-facing components and UI elements
│   │   └── ui/              # Shared UI primitives
│   ├── lib/                 # Business logic, persistence, translations,
│   │                        # insights, safety checks and tests
│   └── routes/              # Pages and server API endpoints
│       ├── index.tsx        # Overview
│       ├── health.tsx       # Health records
│       ├── care-plan.tsx    # Care plan
│       ├── doctor.tsx       # Doctor visit
│       ├── caregiver.tsx    # Caregiver features
│       ├── copilot.tsx      # Assistant interface
│       ├── emergency.tsx    # Emergency information
│       ├── auth.tsx         # Authentication
│       ├── api.copilot.ts   # Copilot API
│       └── api.meal-analysis.ts # Meal analysis API
├── drizzle/
│   └── migrations/          # Database migration SQL
├── package.json             # Dependencies and scripts
├── vite.config.ts           # Build configuration (if present)
└── roadmap.md               # Development history and progress
```

Additional configuration and design notes are maintained in the repository's Markdown documents.

## Getting started

### Prerequisites

- Node.js and npm compatible with the project's dependency versions (use a recent supported Node.js release).
- Git (optional, if cloning the repository).
- Backend credentials only for features that require authenticated online services or AI APIs.

### 1. Download the source

Clone your repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd KmpkDiHatiku_HealthTech_and_Clinical_Integration-main
```

Or download the project ZIP and extract it, then open a terminal inside the extracted project folder.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

See [Configuration](#configuration). Never commit real secrets.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown in your terminal (typically `http://localhost:5173`). The actual port may vary.

### 5. Create a production build

```bash
npm run build
npm run preview
```

## Configuration

This repository contains environment-dependent integrations. Inspect the sample environment files and the corresponding server-side modules before deployment.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-side credential for supported AI features |
| `COPILOT_MODEL` | Model identifier used by the Copilot service |
| `SUPABASE_URL` | Supabase project endpoint |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key used by relevant integration code |

The Copilot server checks these variables before enabling its service. Meal analysis and other integrations may have additional requirements; consult `.env.meal.example`, `src/lib/meal-analysis.server.ts`, and the relevant source files.

**Security:** Never expose `OPENAI_API_KEY` in browser-side code or public repositories. Do not copy the repository's `.env` values into documentation. Review all environment files before publishing or sharing source code, and rotate any credentials that have been exposed.

Authentication and cloud storage may require Supabase-side project setup, provider configuration, database migrations, and deployment settings beyond `npm install`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview a built application |
| `npm run test` | Run the Vitest test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files using Prettier |

## Data storage and authentication

The source includes an account-aware persistence layer, Supabase integration, and migration files. Project history also documents email and Google sign-in and account-specific online saving. A separate demo data key is defined for non-account use.

- Demo and signed-in experiences may use different persistence paths.
- Online features depend on configured services and valid credentials.
- Verify row-level access controls, authentication policies, migrations, and data isolation before using real patient information.

For implementation details, see `src/lib/persistence.ts`, `src/lib/store.tsx`, `src/routes/auth.tsx`, and `drizzle/migrations/`.

## Testing

The repository contains automated tests for components and application logic, including medication behavior, caregiver alerts, consultation summaries, glucose patterns, translation, companion features, forecasting, API handling, and store isolation.

Run:

```bash
npm run test
npm run lint
npm run build
```

Recommended manual checks include glucose entry and validation, data persistence after refresh, medication status updates, multilingual layouts on small screens, consultation printing, caregiver consent revocation, authentication, and API error handling.

## Safety and privacy

Because the application handles health-related information, deployments should prioritize:

- **Clinical safety:** Clearly distinguish educational suggestions from medical advice; route urgent symptoms to appropriate real-world help.
- **Consent:** Respect caregiver-sharing choices and revocation.
- **Privacy:** Collect only necessary data, protect it in transit and at rest, and restrict access by account and role.
- **Transparency:** Clearly identify AI-generated and estimated information.
- **Reliability:** Handle unavailable services gracefully and provide clear feedback for reminders and alerts.
- **Compliance:** Assess applicable privacy, healthcare, and data-protection obligations before handling real patient data.

Do not use real patient information in demonstrations unless an appropriate privacy and security review has been completed.

## Contributing

Contributions should preserve patient safety, accessibility, multilingual support, and existing working flows. Before proposing a change:

1. Review the related component and business logic.
2. Avoid duplicating implemented functionality.
3. Add or update targeted tests.
4. Check English, Bahasa Melayu, and Simplified Chinese text.
5. Run linting, tests, and a build.
6. Clearly document changes to health-related rules, data sharing, or authentication.

## Project resources

- **[Pitching slides](https://drive.google.com/file/d/1Y0bjGUkQ5RJaiGwFEb74CJ5qjp9DVzi6/view?usp=sharing)** — Project presentation and pitch deck.
- **[Pitching video](https://drive.google.com/file/d/1A4MUSc5pApfk3y4AFvAx7WPTB7n3G3st/view?usp=sharing)** — Video presentation of the project.

---

**DiaMonitor Global — Making diabetes self-management clearer, more accessible, and easier to discuss with healthcare professionals.**
