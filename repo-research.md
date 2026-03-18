# Repo Structure Research: Monorepo vs Polyrepo for Office OS

## Context

Planning a full Office OS platform with multiple product domains, heavy integrations, IoT/hardware telemetry, and queue-based async processing. Need to decide on repo strategy that works well with Claude Code (CLAUDE.md / constitution workflow).

## Product Domains

- Access control
- Visitor management
- Mail room management
- Resource reservation
- Video surveillance

## Integration Layer

- SSO integrations
- Communication integrations (Slack, Teams)
- Third-party vendor integrations (VMS companies)

## Technical Architecture

- IoT-based, telemetry-based system
- Queue-based async processing (hardware events → consumers → databases)
- Dual database strategy: NoSQL for telemetry/events, relational for business data
- Hardware + software project

## Decision: Monorepo (for teams up to ~30 engineers)

### Recommendation

**Monorepo** using pnpm workspaces or Nx/Turborepo. One repo, multiple packages/services.

### Why Monorepo Wins

1. **Cross-cutting event contracts are the biggest risk.** Events flow: Hardware → Queue → Consumer → NoSQL DB → API → UI. Changing an event schema touches 3-4 packages. In a polyrepo, that's 3-4 PRs with careful coordination. In a monorepo, it's one atomic commit.

2. **Claude works dramatically better with monorepos.**
   - Single constitution at the root governs everything
   - Claude can trace events across the full stack in one session
   - Cross-service refactors are trivial (one PR, not N PRs)
   - Nested `CLAUDE.md` files for per-package guidance while root constitution stays authoritative

3. **High integration density.** SSO, Slack, VMS vendors — these integrations touch multiple domains. Polyrepo forces publishing shared types as packages, versioning them, keeping consumers in sync. Unnecessary overhead.

4. **Type changes propagate immediately.** No version bumping, no publishing, no "wait for the common package release."

### Suggested Monorepo Structure

```
office-os/
├── CLAUDE.md                          # Root rules — points to constitution
├── .specify/memory/constitution.md    # Single source of truth
├── packages/
│   ├── shared/
│   │   ├── events/          # Event schemas (the contract layer)
│   │   ├── types/           # Shared domain types
│   │   └── utils/           # Common utilities
│   ├── services/
│   │   ├── access-control/
│   │   │   └── CLAUDE.md    # Domain-specific guidance
│   │   ├── visitor-mgmt/
│   │   ├── mailroom/
│   │   ├── resource-reservation/
│   │   └── video-surveillance/
│   ├── consumers/           # Queue consumers (IoT event processing)
│   ├── integrations/
│   │   ├── sso/
│   │   ├── slack/
│   │   └── vms-vendors/
│   ├── gateway/             # API gateway
│   └── web/                 # Frontend
├── firmware/                # Hardware-side code (or separate repo if C/Rust)
└── infra/                   # Docker, queue config, DB migrations
```

### CLAUDE.md Layering

- Root `CLAUDE.md`: points to constitution, global rules (queue patterns, async handling)
- Package-level `CLAUDE.md`: domain-specific context (e.g., "Mailroom uses package-tracking events. See shared/events/mailroom-events.ts")
- Claude reads root → package-level → has full context. One session, one PR.

### The One Exception: Firmware

If actual embedded/firmware code exists (C, Rust, MicroPython), it CAN live in a separate repo. Different build toolchain, deployment cycle, and review process. The contract between firmware and software is the event schema — keep that in the monorepo's `shared/events/` and have firmware reference it as documentation.

## Scaling Thresholds

| Team Size | Recommendation |
|---|---|
| <15 engineers | Monorepo, no question |
| 15-30 engineers | Monorepo with Nx/Turborepo + CODEOWNERS |
| 30-50+ engineers | Hybrid — domain-bounded repos with shared platform repo |

### Hybrid Approach (30-50+ engineers)

Split by **domain boundary**, not individual service:

```
office-os-platform/     # Shared libs, gateway, infra, queues, ROOT constitution
office-os-access/       # Access control + badge hardware
office-os-visitor/      # Visitor mgmt + check-in kiosks
office-os-mailroom/     # Mailroom + package tracking
office-os-reservations/ # Resource reservation
office-os-surveillance/ # Video + camera firmware
office-os-integrations/ # SSO, Slack, VMS vendors
```

Each domain repo has its own constitution that **extends** the root constitution from the platform repo. Root constitution published as a versioned artifact (git submodule or CI copy step).

### When to Split the Monorepo

Split only when forced by **team pain**, not arbitrary headcount:

- CI takes >10 min even with caching
- Teams are blocking each other's merges daily
- A domain needs a fundamentally different tech stack
- Security requires code isolation (e.g., SOC2 audit for video surveillance)

### Why NOT Polyrepo (at <30 engineers)

- **Constitution drift**: Sync constitution files across 8+ repos — they will diverge
- **Claude context fragmentation**: Claude can't cross-repo reason
- **Integration testing pain**: Queue-based architecture needs E2E tests spanning producers and consumers
- **Premature team boundaries**: Polyrepo makes sense for distinct teams with independent release cadences, not for building the platform
- **Multi-PR coordination hell**: A single type change = N PRs merged in the right order
