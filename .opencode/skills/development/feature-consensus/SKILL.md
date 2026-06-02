---
name: feature-consensus
description: Runs PM-Designer-Doc triple review protocol to reach consensus
  on feature specs before implementation. Includes domain documentation consistency
  check. Use before implementing any new screen, component, or significant feature.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: feature-development
  rounds: "15"
  agents: pm-reviewer,designer-reviewer,doc-reviewer
---

# Feature Consensus Protocol

Before implementing any new screen, component, or significant feature, run this protocol to ensure PM/UX, Design, and Domain Documentation perspectives are all aligned.

## When to Use

- Before implementing a new page or screen
- Before implementing a significant new component
- Before adding a new API endpoint or service
- Before refactoring an existing feature that changes behavior or UX

## When NOT to Use

- Bug fixes that don't change behavior
- Test additions for existing features
- Minor text or copy changes
- Refactoring that doesn't change UX or API surface
- Dependency version updates

## Protocol

### Step 1: Prepare the Feature Brief

Write a concise feature brief that includes:
- What is being built (1-2 sentences)
- Which part of the app it affects (page, component, API, store)
- Which user flow it serves (search → play, chart → play, playlist, library, settings)
- Which domain(s) are affected (likes, history, playlists, channels, playback, discovery, auth)
- Any known constraints or open questions

### Step 2: Launch Facilitator Task Agent

Launch a `general` Task agent with the following prompt structure:

```
You are a debate facilitator. Your job is to run a PM-Designer-Doc
consensus protocol for the following feature:

[FEATURE BRIEF]

## Protocol

Run up to 15 rounds of debate between PM, Designer, and Doc reviewers.

### Round 1: PM Review
Launch @pm-reviewer agent with the feature brief.
Collect their review and verdict.

### Round 2: Designer Review
Launch @designer-reviewer agent with the feature brief AND the PM's review.
Collect their review and verdict.

### Round 3: Doc Review
Launch @doc-reviewer agent with the feature brief, focusing on:
- Which docs/ files are relevant to this feature
- Whether the planned feature conflicts with documented policies
- What docs updates will be needed after implementation
Collect their review and verdict.

### Subsequent Rounds (if needed):
- Pass unresolved objections between reviewers in rotation:
  PM → Designer → Doc → PM → Designer → Doc → ...
- Each reviewer sees only:
  1. The original feature brief
  2. Their own previous review
  3. The specific objections they need to respond to
- Continue until all three AGREE or 15 rounds reached

### Termination Conditions:
1. ALL THREE reviewers output AGREE → Consensus reached. Stop.
2. Round 15 reached → Return last state with "CONSENSUS_NOT_REACHED"
3. 3 consecutive rounds with no change in objections → Stalemate. Return "STALEMATE"

### Output Format (return to main context):

If consensus reached:
---
## Consensus: [Feature Name]
### Agreed Specification
[The final specification all reviewers agreed on]
### PM Concerns Addressed
[List of PM objections that were resolved]
### Designer Concerns Addressed
[List of Designer objections that were resolved]
### Doc Concerns Addressed
[List of Doc objections that were resolved]
### Docs Update Plan
[Specific docs files and sections that need updating after implementation]
---

If no consensus:
---
## No Consensus: [Feature Name]
### Current State
[Latest specification]
### Remaining PM Objections
[Unresolved PM concerns]
### Remaining Designer Objections
[Unresolved Designer concerns]
### Remaining Doc Objections
[Unresolved Doc concerns]
### Recommendation: ASK_USER
---
```

### Step 3: Handle the Result

**If consensus reached**: Use the agreed specification to implement the feature. Note the Docs Update Plan — these will need to be applied post-implementation.

**If no consensus**: Present the remaining disagreements to the user and ask for a decision. Do NOT proceed with implementation until the user resolves the conflict.

### Step 4: Pre-implementation Doc Sync

After consensus but before coding, run the `doc-sync` skill:

1. Load `doc-sync` skill: `skill({ name: "doc-sync" })`
2. Launch a `doc-reviewer` Task agent for a focused pre-implementation check
3. Verify no conflicts exist between the agreed spec and current docs
4. If conflicts found, resolve them before starting TDD

### Step 5: Implement (TDD)

Follow the TDD workflow per AGENTS.md:
1. Red → Write failing tests
2. Green → Write minimum code to pass
3. Refactor → Clean up while tests pass

### Step 6: Post-implementation Doc Sync

After implementation is complete and tests pass:

1. Launch `doc-reviewer` Task agent for post-implementation check
2. Apply the Docs Update Plan from the consensus (Step 3)
3. Verify all HIGH and MEDIUM items are resolved
4. Run `npm run build && npm run lint && npm run test && npm run typecheck`

## SONG-Specific Review Checks

### PM Reviewer checks against:
- `AGENTS.md` — Architecture, conventions, forbidden practices
- API specification — RESTful design, auth requirements, Zod validation
- TDD compliance — Test cases identified before implementation
- `src/lib/track-adapters.ts` — No inline track mapping
- `server/lib/route-helpers.ts` — Proper use of requireAuth/validateBody/handleErrors
- `src/lib/api-client.ts` — apiFetch throws on error pattern

### Designer Reviewer checks against:
- `src/styles/globals.css` — Theme tokens, CSS variables
- `src/components/ui/` — Existing component reuse
- Dark/light mode — Both themes supported
- Mobile PWA — Touch targets, safe areas, responsive
- Player integration — Coexists with bottom-nav, player-bar, full-player

### Doc Reviewer checks against:
- `docs/ubiquitous-language.md` — Terminology consistency with planned feature
- Domain-specific doc (e.g., `docs/likes.md`) — Policy conflicts with planned behavior
- `docs/README.md` — Cross-domain relationship impacts
- `docs/architecture.md` — Layer boundary violations in planned implementation
- `AGENTS.md` API table — Endpoint changes need docs updates
- Entity schemas (`server/domain/entities/`) — Attribute changes need docs updates

## Example Usage

```
User: "Implement a playlist detail page"

Agent:
1. Loads this skill: skill({ name: "feature-consensus" })
2. Prepares brief: "Playlist detail page at /playlist/[id] showing tracks in
   order, with play all, shuffle, and track management (remove, reorder).
   Uses usePlaylist query hook and useRemoveTrackFromPlaylist mutation.
   Mobile-first with track list using track-item component.
   Domains: playlists, playback."
3. Launches facilitator Task agent
4. PM, Designer, Doc reviewers debate → consensus reached
5. Pre-implementation doc-sync check
6. TDD implementation: Red → Green → Refactor
7. Post-implementation doc-sync check
8. Docs updated (if needed)
9. Build + lint + test + typecheck pass
```

## Notes

- Each reviewer agent reads ONLY their own reference documents (AGENTS.md for PM, globals.css for Designer, docs/* for Doc)
- Each agent runs in a fresh independent context
- The facilitator passes outputs between agents but does not influence the debate
- The main implementation context receives ONLY the final result, not the debate history
- Doc reviewer adds ~1 round of latency but catches policy conflicts before they become code rework
- This protocol costs extra tokens but produces higher quality, more consistent features with accurate documentation
- After consensus, follow TDD workflow: Red → Green → Refactor
- After implementation, always run post-implementation doc-sync before marking complete
