---
name: skill-format
description: Official SKILL file format with YAML frontmatter and structure guidelines
license: MIT
compatibility: opencode
metadata:
  category: documentation
  complexity: basic
---

## What I do
- Create SKILL files with proper YAML frontmatter
- Follow official structure with sections
- Use lowercase alphanumeric names for SKILL names
- Add descriptive metadata
- Include purpose statement (1 sentence)
- List related SKILLS at bottom

## When to use me
Use this when you need to:
- Create a new SKILL file
- Review SKILL format compliance
- Ensure SKILLS follow official structure

I'll ask clarifying questions if:
- SKILL format is unclear
- SKILL name validation needs clarification

## Pattern: SKILL File Example

```markdown
---
name: component-development
description: Create React components with proper props and state
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create React components with props
- Use TypeScript for type safety
- Handle state with hooks
- Use 'use client' directive when needed

## When to use me
Use this when you need to create a component.
```

## Pattern: SKILL Name Validation

SKILL names must:
- Be 1-64 characters
- Be lowercase alphanumeric with single hyphen separators
- Not start or end with `-`
- Not contain consecutive `--`
- Match directory name that contains `SKILL.md`

Valid name: `^[a-z0-9]+(-[a-z0-9]+)*$`

## Section Order

```markdown
1. Title (# SKILL: [Name])
2. Purpose statement
3. ## What I do
4. ## When to use me
5. Pattern sections (multiple)
6. Checklist
7. Quick Reference (tables/lists)
8. Related SKILLS links
```

## Metadata Fields

```yaml
name: skill-name
description: 1-1024 chars describing purpose
license: MIT
compatibility: opencode
metadata:
  category: development | testing | documentation
  complexity: basic | intermediate | advanced
  audience: developers | maintainers
  workflow: github | jira | custom
```

## Code Example Guidelines

```markdown
// Show both good and bad patterns
// Use ✅ for good practice
// Use ❌ for bad practice
// Keep examples concise
// Focus on common use cases
```

## Formatting Rules

- Headings: Level 1 only at start
- Code blocks: Use appropriate language tags
- Tables: Format with proper columns
- Lists: Use unordered or ordered lists
- Emphasis: Bold, italic, code

## Checklist

Before creating a SKILL file:

- [ ] Title follows "SKILL: [Name]" format
- [ ] Brief purpose statement (1 sentence)
- [ ] YAML frontmatter with name and description
- [ ] Name validates: lowercase alphanumeric with hyphens
- [ ] Name is 1-64 characters
- [ ] Description is 1-1024 characters
- [ ] Sections include: What I do, When to use me, Pattern sections
- [ ] Code examples are actual code from codebase
- [ ] Checklist section included
- [ ] Quick reference included
- [ ] Related SKILLS listed at bottom
- [ ] Consistent formatting with other SKILLS

## Quick Reference

| Field | Requirement |
|-------|------------|
| Title | # SKILL: [Name] |
| Purpose | 1 sentence description |
| Name | Lowercase alphanumeric with hyphens, 1-64 chars |
| Description | 1-1024 characters |
| Sections | What I do, When to use me, Patterns, Checklist, Quick Reference |
| Related SKILLS | 3-5 relevant SKILLS |

| Category | Complexity |
|----------|-------------|
| development | basic |
| development | intermediate |
| testing | basic |
| documentation | basic |

---

**Related SKILLS:** code-standards.md, react-components.md
