---
name: doc-sync
description: Enforce docs ↔ code consistency before and after implementation.
  Launches doc-reviewer agent to cross-check domain documentation against actual
  codebase, detects drift, and ensures documentation updates accompany code changes.
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
  audience: developers
  workflow: feature-development
---

# SKILL: Doc Sync

Before and after any feature implementation, ensure `docs/` domain documentation stays consistent with the codebase. This skill orchestrates the `doc-reviewer` agent for independent, thorough cross-validation.

## What I do

- Identify which `docs/` files are relevant to the current task
- Launch `doc-reviewer` agent for pre-implementation conflict detection
- After implementation, launch `doc-reviewer` agent for post-implementation drift detection
- Apply docs updates when the reviewer identifies inconsistencies
- Maintain the single-source-of-truth chain: `docs/` = domain truth, `AGENTS.md` = coding truth

## When to use me

### Mandatory (always run)

- Before implementing a new feature (pre-check)
- After implementing a feature (post-check)
- When modifying an existing domain entity, rule, or API endpoint
- When adding a new entity type, business rule, or API endpoint

### Conditional (run if)

- Bug fix that changes documented behavior (e.g., pruning threshold changed)
- Refactoring that changes public API surface or data flow
- Renaming that affects ubiquitous language terms

### Skip (do not run)

- Pure test additions with no code behavior change
- Comment-only or formatting changes
- Dependency version updates
- CSS/style changes that don't affect component API

## Domain → Docs Mapping

Use this mapping to identify relevant docs for any given task:

```
Task involves                     → Check these docs
─────────────────────────────────────────────────────────────
Likes (entity, repo, API)         → docs/likes.md
History (entity, repo, API)       → docs/history.md
Playlists (entity, repo, API)     → docs/playlists.md
Channels (entity, repo, API)      → docs/channels.md
Playback / Audio / Queue          → docs/playback.md
Search / Melon / Recommend        → docs/discovery.md
Auth / User / Session             → docs/auth.md
Any domain entity                 → docs/ubiquitous-language.md
Cross-domain changes              → docs/README.md (relationships, data flow)
Layer/architecture changes        → docs/architecture.md
API endpoint changes              → AGENTS.md (API Specification table)
```

## Workflow

### Step 1: Identify Scope

Before launching the reviewer, determine what to check:

```
1. What domain(s) does this task touch?
2. Which docs files are relevant? (see mapping above)
3. What code files will change? (entities, rules, repos, routes, schemas)
4. What type of review? (pre-implementation or post-implementation)
```

### Step 2: Launch doc-reviewer Agent

Launch a `doc-reviewer` Task agent with a specific prompt based on review type.

#### Pre-implementation Prompt Template

```
You are reviewing a planned feature before implementation.

## Feature Brief
[BRIEF DESCRIPTION OF WHAT WILL BE BUILT]

## Affected Domains
[LIST DOMAINS: e.g., likes, playlists, playback]

## Files that will change
[LIST EXPECTED CODE FILES]

## Your Task
1. Read the relevant docs files: [LIST DOCS FILES]
2. Read the current code that will be affected: [LIST CURRENT CODE FILES]
3. Check for conflicts between the planned feature and documented policies
4. Identify what docs updates will be needed after implementation
5. Return your review in the standard output format

Focus on: business rule conflicts, undocumented entity changes, API surface changes.
```

#### Post-implementation Prompt Template

```
You are reviewing completed code changes for docs consistency.

## What Changed
[DESCRIPTION OF WHAT WAS IMPLEMENTED]

## Changed Files
[LIST ALL MODIFIED/ADDED CODE FILES]

## Your Task
1. Read the relevant docs files: [LIST DOCS FILES]
2. Read the changed code files: [LIST CODE FILES]
3. Cross-check entity attributes, business rules, identifiers, API endpoints
4. Identify any drift between docs and the new code
5. Return your review in the standard output format with a specific Update Plan

Focus on: missing attributes, changed policies, new endpoints, terminology drift.
```

#### Full Audit Prompt Template

```
You are performing a full docs ↔ code consistency audit.

## Scope
[LIST DOMAINS TO AUDIT, or "ALL" for everything]

## Your Task
1. Read docs/README.md for domain index
2. For each domain:
   a. Read the domain doc file
   b. Read the corresponding entity schema in server/domain/entities/
   c. Read the Drizzle schema in server/infrastructure/persistence/schema.ts
   d. Read the API routes in app/api/
   e. Read the domain rules in server/domain/rules/ (if any)
3. Cross-check all items per your validation checklist
4. Return comprehensive review

Focus on: accumulated drift, stale sections, missing documentation.
```

### Step 3: Handle Review Result

Based on the reviewer's verdict:

| Verdict | Action |
|---------|--------|
| **SYNCED** | Proceed. No docs changes needed. |
| **NEEDS_UPDATE** | Apply the Update Plan from the reviewer's output. Then re-verify. |
| **CONFLICT** | STOP. Present the conflict to the user. Resolve before proceeding. |

### Step 4: Apply Docs Updates

When the reviewer identifies `NEEDS_UPDATE`:

1. Read the specific doc file that needs updating
2. Apply the changes from the reviewer's Update Plan
3. Verify the update doesn't introduce new inconsistencies with other docs
4. Check if `ubiquitous-language.md` or `docs/README.md` index also needs updating

### Step 5: Verify (optional but recommended)

After applying docs updates, launch a quick follow-up check:

```
Launch doc-reviewer with:
"I've updated docs/X.md based on the previous review. Verify these specific changes
are consistent with the code: [list specific changes made]. Quick check only."
```

## Integration Points

### With feature-consensus

The feature-consensus protocol includes a doc-review step. When used together:

```
feature-consensus Step 2 → includes doc-reviewer as 3rd reviewer
                        ↓
                  consensus reached
                        ↓
              doc-sync pre-implementation check
                        ↓
                   TDD implementation
                        ↓
              doc-sync post-implementation check
                        ↓
                   docs updated
                        ↓
              build + lint + test + typecheck
```

### With AGENTS.md Checklist

The AGENTS.md 작업 완료 체크리스트 includes docs sync items:

```
기능 추가 시:
  - [ ] docs 동기화 (pre): 관련 docs 읽고 충돌 확인
  - [ ] docs 동기화 (post): 코드 변경 후 docs 업데이트

버그 수정 시:
  - [ ] docs 동기화: 문서화된 정책이 변경된 경우 docs 업데이트
```

## Docs Update Rules

### When to update docs

| Code Change | Docs Update |
|-------------|-------------|
| New entity property added to Zod schema | Add to attribute table in domain doc |
| Entity property removed | Remove from attribute table |
| Business rule changed in `server/domain/rules/` | Update corresponding policy section |
| New API endpoint added | Update AGENTS.md API table + domain doc if relevant |
| API endpoint removed or method changed | Update AGENTS.md API table |
| New composite key or constraint in Drizzle schema | Update 식별자 section |
| New ubiquitous language term introduced | Add to `ubiquitous-language.md` |
| Cross-domain relationship changed | Update `docs/README.md` Context 간 관계 + Data Flow |
| New track adapter added | Update `docs/playback.md` 트랙 어댑터 table |
| Queue behavior changed | Update `docs/playback.md` 큐 관리 section |

### When NOT to update docs

- Internal implementation details (algorithm choice, variable naming)
- Bug fixes that restore documented behavior (code was wrong, docs was right)
- Test additions or modifications
- Build/config changes

### Priority order for updates

1. `docs/ubiquitous-language.md` — terminology changes propagate everywhere
2. Domain-specific doc (e.g., `docs/likes.md`) — entity/rule changes
3. `docs/README.md` — relationship/index changes
4. `docs/architecture.md` — layer/structural changes
5. `AGENTS.md` — API spec table changes

## Common Drift Scenarios

### Scenario 1: New attribute added to entity

```
Code: server/domain/entities/like.ts gains `source` field
Docs: docs/likes.md attribute table missing `source`
Fix: Add row to attribute table, describe what source means
```

### Scenario 2: Business rule threshold changed

```
Code: server/domain/rules/ changes pruning from 200→100 to 300→150
Docs: docs/history.md still says "200개를 초과...100개로 축소"
Fix: Update pruning policy section with new thresholds
```

### Scenario 3: New API endpoint added

```
Code: app/api/playlists/{id}/share/route.ts created (POST)
Docs: AGENTS.md API table missing the endpoint
Fix: Add row to protected routes table
```

### Scenario 4: Ubiquitous language drift

```
Code: Uses "FollowedChannel" consistently
Docs: ubiquitous-language.md uses "Channel Follow" as term
Fix: Align — decide on one term, update the other
```

### Scenario 5: Cross-domain relationship changed

```
Code: Discovery now also uses channels (new feature)
Docs: docs/README.md Context 간 관계 missing Discovery → Channels
Fix: Add relationship row
```

## Checklist

Before marking a task complete:

- [ ] doc-sync pre-check completed (relevant docs read, no conflicts)
- [ ] Implementation completed
- [ ] doc-sync post-check completed (doc-reviewer launched, verdict received)
- [ ] All HIGH severity inconsistencies resolved
- [ ] All MEDIUM severity items addressed (updated or explicitly deferred)
- [ ] `docs/ubiquitous-language.md` checked for new terms
- [ ] `docs/README.md` index checked for new relationships
- [ ] `AGENTS.md` API table checked for endpoint changes
- [ ] If docs were updated, no new inconsistencies introduced

## Quick Reference

| Review Type | When | Agent Prompt | Time |
|-------------|------|-------------|------|
| Pre-implementation | Before coding | Feature brief + affected domains | ~30s |
| Post-implementation | After coding | Changed files list | ~45s |
| Full audit | Periodic / on request | Scope = ALL or specific domains | ~2min |

| Verdict | Meaning | Next Step |
|---------|---------|-----------|
| SYNCED | Docs match code | Proceed |
| NEEDS_UPDATE | Docs missing or slightly wrong | Apply Update Plan |
| CONFLICT | Docs contradict code | STOP and resolve with user |

---

**Related SKILLS:** feature-consensus, api-route-development, react-components, parser-patterns, zod-validation
