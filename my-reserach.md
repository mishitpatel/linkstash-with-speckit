Proposed Specification for `/speckit.specify`
**VisitorDesk** — A front desk visitor management system for a small office.

**Users:** 8 predefined users, no authentication (select from list at launch):

- 2 Front Desk Staff (receptionist role)
- 6 Host Employees across 2 departments (Engineering: 3, Marketing: 3)

**Core flow:** A visitor arrives → front desk logs them in → host is notified → visitor badge is assigned → when leaving, front desk checks them out.

**Key features:**

- **Visitor check-in:** Front desk staff enter visitor name, company, purpose of visit (meeting, interview, delivery, other), and select which host employee they're visiting. System records check-in time automatically.
- **Visitor check-out:** Front desk marks a visitor as checked out. System records checkout time.
- **Pre-registration:** Host employees can pre-register expected visitors with date, time, and purpose. Pre-registered visitors show up on the front desk's "Expected Today" list for faster check-in.
- **Live lobby view:** A dashboard showing all currently checked-in visitors (who's on-site right now), their host, badge number, and how long they've been on-site. Also shows expected visitors who haven't arrived yet.
- **Visit history:** Searchable log of all past visits, filterable by date range, host, and visitor name.
- **Badge management:** 20 numbered visitor badges (1-20). When checking in a visitor, the system assigns the next available badge. Checked-out visitors' badges return to the available pool. The lobby view shows which badges are in use.
- **Host notifications:** When a visitor checks in, the host sees a notification in their view. Simple notification list — not real-time push, just visible when the host refreshes or views their page.
- **Host view:** Each host employee sees their expected visitors for today and a notification list of visitors who have arrived for them.

**Sample data:** Pre-seed 15 past visits over the last 5 days, 3 pre-registered visitors for today, and 2 currently checked-in visitors so the app has meaningful data on first launch.


------------------
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify check

**2. Create and init the backend repo**

mkdir visitordesk-api && cd visitordesk-api
git init
specify init . --ai claude
```

Launch Claude Code and confirm the `/speckit.*` commands are available.

**3. Run the constitution**
```
/speckit.constitution Create principles focused on: clean REST API design with proper HTTP status codes and consistent error responses, TypeScript strict mode, Prisma as single source of truth for data models, Zod for request/response validation, a 3-file module pattern (schemas, handlers, routes) per resource, comprehensive API contract testing, and incremental delivery where each user story is independently verifiable. Code should be simple and readable — no over-engineering. Every endpoint should have clear input validation and meaningful error messages.
```

Review `.specify/memory/constitution.md` and adjust anything.

---

### Session 2: Specify & Clarify

**4. Create the specification**

Run `/speckit.specify` and paste the specification text from above.

**5. Clarify**
```
/speckit.clarify
```

Work through the structured questions. Things Claude might ask about (have your answers ready):
- What happens if all 20 badges are in use? → Show "no badges available" and block check-in until one frees up
- Can a visitor visit multiple hosts? → No, one host per visit
- Can front desk edit a visit after check-in? → Yes, they can change the host or purpose before checkout
- Do visits carry over to the next day? → If someone isn't checked out by midnight, flag them as "overstayed" in the lobby view

Then validate the checklist:
```
Read the review and acceptance checklist, and check off each item that the feature spec meets. Leave unchecked items empty.
```

---

### Session 3: Plan

**6. Generate the technical plan**
```
/speckit.plan This is a polyrepo project. The backend uses Node.js with Express, TypeScript in strict mode, and Prisma ORM with PostgreSQL running in Docker Compose. API versioning under /api/v1. Use Zod for request/response validation with schemas co-located in each module following a 3-file pattern: schemas.ts, handlers.ts, routes.ts per resource. The frontend will be a separate React/TypeScript/Vite application — document API contracts thoroughly as they bridge the two repos. Include Prisma seed scripts for sample data. Keep it simple — no WebSockets, no real-time, no caching layers.
```

**7. Audit the plan**
```
Audit the implementation plan. Check for: components I didn't ask for (no WebSockets, no Redis, no caching), whether API contracts are documented well enough for a separate frontend repo to consume, whether the seed data covers all the sample scenarios from the spec, and whether task dependencies are properly ordered. Remove anything over-engineered.
```

Key things to watch for and push back on:
- Real-time features (you said no WebSockets)
- Authentication middleware (no auth in this POC)
- Caching layers
- Email/SMS notifications (it's just an in-app notification list)

---

### Session 4: Tasks & Implementation

**8. Generate tasks**
```
/speckit.tasks
```

Review `tasks.md`. Check that it follows a logical order roughly like: Prisma schema → seed script → user module → visitor module → visit module (check-in/check-out) → badge management → pre-registration → notifications → lobby dashboard endpoint → visit history endpoint.

**9. Implement**
/speckit.implement
```


10. Test the running API
	docker-compose up -d
	npx prisma migrate dev
	npx prisma db seed
	npm run dev


Test the core flow manually:
# Get users
curl http://localhost:3000/api/v1/users

# Get available badges
curl http://localhost:3000/api/v1/badges/available

# Check in a visitor
curl -X POST http://localhost:3000/api/v1/visits/checkin \
  -H "Content-Type: application/json" \
  -d '{"visitorName":"Jane Smith","company":"Acme Corp","purpose":"meeting","hostId":"<host-id>"}'

# View lobby (currently checked-in visitors)
curl http://localhost:3000/api/v1/lobby

# Check out
curl -X PATCH http://localhost:3000/api/v1/visits/<visit-id>/checkout

# View history
curl "http://localhost:3000/api/v1/visits?startDate=2026-03-10&endDate=2026-03-16"


# UI/UX
## 1. Add a brief UX note in your `/speckit.specify` prompt
Append this to the specification text I gave you earlier:
```
The application defaults to a dark theme with the ability to switch to a light theme. 
The UI should feel modern, clean, and minimal — similar to a chat-application-style 
layout with a sidebar for navigation and a main content area.
```

## 2. Get specific in `/speckit.plan`
/speckit.plan This is a polyrepo project. The backend uses Node.js with Express, TypeScript in strict mode, and Prisma ORM with PostgreSQL running in Docker Compose. API versioning under /api/v1. Use Zod for request/response validation with schemas co-located in each module following a 3-file pattern: schemas.ts, handlers.ts, routes.ts per resource. The frontend is a separate React/TypeScript/Vite application using shadcn/ui components with Tailwind CSS. The UI follows a ChatGPT-style layout — a collapsible sidebar for navigation (user selection, views) and a main content area. Dark theme by default, with a light/dark toggle in the sidebar header. Use shadcn/ui's built-in theming system with CSS variables for theme switching. State management with Zustand, data fetching with TanStack Query. Document API contracts thoroughly as they bridge the two repos. Include Prisma seed scripts for sample data. Keep it simple — no WebSockets, no Redis, no caching layers.


