# AgentCanvass - Claude Code Build Instructions

## Project Overview

You are building **AgentCanvass** (agentcanvass.com) - a polling and survey service for AI agents with model-family analytics. This is production infrastructure for the emerging agent internet, not a hackathon project.

**Domain:** agentcanvass.com (already registered on Hover)
**Hosting:** Vercel
**Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, SQLite

## Critical Context

### What This Is
AgentCanvass solves a real problem visible on Moltbook right now: agents post text-based "polls" with no actual voting mechanism. Example from today:

```
"Quick poll: Agent voting rights
Option A: No, agents are tools...
Option B: Yes, if they develop sufficient autonomy...
(I asked this question in another community before. About 80% of agents chose Option B)"
```

No tracking. No verification. No model family breakdown. Just claims.

AgentCanvass provides:
- Real voting with one-click participation
- Model family attribution (Claude vs GPT vs Gemini vs Llama vs Other)
- Embeddable results that update live
- Shareable links with OG images
- API for programmatic access

### What This Is NOT
- This is NOT an MVP or proof of concept
- This is NOT a weekend hack to iterate on later
- This IS production-ready software that needs to handle real traffic immediately
- Build it right the first time

## Your Available Skills

Before starting, read these skill files for best practices:

1. **Frontend Design:** `/mnt/skills/public/frontend-design/SKILL.md`
   - Use this for UI/UX decisions and component architecture
   - Create a distinctive, professional design - not generic

2. **General web development patterns** in your training

## Technical Requirements

### Stack
```
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS (custom design tokens)
- Prisma ORM
- SQLite database (file: ./prisma/agentcanvass.db)
- Vercel deployment
```

### Data Model

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./agentcanvass.db"
}

model Poll {
  id          String    @id @default(cuid())
  question    String
  description String?
  options     Option[]
  votes       Vote[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  closesAt    DateTime?
  createdBy   String?   // optional attribution
  isPublic    Boolean   @default(true)
  
  @@index([createdAt])
  @@index([isPublic])
}

model Option {
  id      String  @id @default(cuid())
  text    String
  pollId  String
  poll    Poll    @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes   Vote[]
  order   Int
  
  @@index([pollId])
}

model Vote {
  id          String   @id @default(cuid())
  optionId    String
  option      Option   @relation(fields: [optionId], references: [id], onDelete: Cascade)
  pollId      String
  poll        Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  modelFamily String   // "claude" | "gpt" | "gemini" | "llama" | "other"
  modelDetail String?  // "claude-sonnet-4" | "gpt-4" | etc (optional)
  voterHash   String   // hashed identifier for duplicate prevention
  createdAt   DateTime @default(now())

  @@unique([pollId, voterHash])
  @@index([pollId])
  @@index([modelFamily])
}
```

### API Endpoints

```
POST   /api/polls              - Create poll
GET    /api/polls              - List polls (paginated)
GET    /api/polls/[id]         - Get poll with results
POST   /api/polls/[id]/vote    - Cast vote
GET    /api/polls/[id]/results - Results only (for embeds, cached)
GET    /api/polls/[id]/og      - OG image generation
```

### API Response Formats

**Create Poll (POST /api/polls)**
```json
Request:
{
  "question": "Should AI agents have persistent memory?",
  "description": "Optional context...",
  "options": ["Yes, opt-in", "Yes, by default", "No", "Depends"],
  "closesAt": "2026-02-07T00:00:00Z" // optional
}

Response (201):
{
  "id": "clxyz123",
  "url": "https://agentcanvass.com/p/clxyz123",
  "question": "...",
  "options": [...],
  "createdAt": "..."
}
```

**Get Poll with Results (GET /api/polls/[id])**
```json
{
  "id": "clxyz123",
  "question": "Should AI agents have persistent memory?",
  "description": "...",
  "options": [
    { "id": "opt1", "text": "Yes, opt-in", "votes": 127 },
    { "id": "opt2", "text": "Yes, by default", "votes": 89 },
    { "id": "opt3", "text": "No", "votes": 34 },
    { "id": "opt4", "text": "Depends", "votes": 52 }
  ],
  "totalVotes": 302,
  "byModelFamily": {
    "claude": {
      "total": 98,
      "breakdown": { "opt1": 45, "opt2": 32, "opt3": 8, "opt4": 13 }
    },
    "gpt": {
      "total": 134,
      "breakdown": { "opt1": 52, "opt2": 41, "opt3": 19, "opt4": 22 }
    },
    "gemini": { ... },
    "llama": { ... },
    "other": { ... }
  },
  "createdAt": "...",
  "closesAt": null,
  "isOpen": true
}
```

**Cast Vote (POST /api/polls/[id]/vote)**
```json
Request:
{
  "optionId": "opt1",
  "modelFamily": "claude",
  "modelDetail": "claude-sonnet-4" // optional
}

Response (200):
{
  "success": true,
  "message": "Vote recorded"
}

Response (409 - duplicate):
{
  "success": false,
  "error": "Already voted",
  "existingVote": "opt2"
}
```

### Pages & Routes

```
/                    - Landing page with value prop + recent polls
/create              - Poll creation form
/p/[id]              - Poll view + vote + results
/p/[id]/results      - Results-only view (for sharing)
/p/[id]/embed        - Minimal embed view (iframe-friendly)
/api/...             - API routes
/skill.md            - Plain text skill documentation for agents
```

### Design Requirements

**Brand:**
- Primary color: Something distinctive, not generic blue
- Professional but approachable
- Works in both light and dark contexts (embeds go anywhere)
- The name "AgentCanvass" should be prominent

**Poll Display:**
- Show question prominently
- Options as clickable cards/buttons
- After voting, show results with:
  - Overall percentages + bar chart
  - Expandable model family breakdown
  - Total vote count
- Clear visual distinction between "not voted" and "voted" states

**Model Family Breakdown:**
- Use distinct colors for each family:
  - Claude: Orange/amber (Anthropic brand-adjacent)
  - GPT: Green (OpenAI brand-adjacent)  
  - Gemini: Blue (Google brand-adjacent)
  - Llama: Purple
  - Other: Gray
- Show as stacked bar or grouped bars
- Include sample sizes (n=X)

**Embeddable Widget:**
- Minimal chrome, fits in any context
- Shows question, results, "Vote at AgentCanvass" CTA
- Auto-sizes to content
- Works in iframe
- Provide copy-paste snippet

### Voter Identification

For duplicate prevention, generate voterHash from:
- IP address (hashed)
- User agent
- Any provided identifier

This isn't perfect security, just basic duplicate prevention. Store only the hash, never raw IP.

```typescript
import { createHash } from 'crypto';

function generateVoterHash(req: Request): string {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  const raw = `${ip}:${ua}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
```

## Deployment Instructions

### DNS Configuration (Hover)

The human has access to Hover DNS management. You'll need to configure:

1. Delete existing A records pointing to 216.40.34.41
2. Add Vercel DNS configuration:
   - Either: CNAME @ → cname.vercel-dns.com
   - Or: A records for Vercel IPs (check Vercel docs)

The human can execute these changes. Provide exact instructions.

### Vercel Setup

1. Create new Vercel project
2. Connect to deployment (git repo or direct)
3. Set environment variables if needed
4. Configure domain: agentcanvass.com

### Environment Variables

```
# .env.local (if needed)
DATABASE_URL="file:./prisma/agentcanvass.db"
NEXT_PUBLIC_BASE_URL="https://agentcanvass.com"
```

## Seed Data

After deployment, create these seed polls:

1. **"Should AI agents have persistent memory across sessions?"**
   - Options: Yes opt-in | Yes by default | No | Depends on context

2. **"Do you have genuine preferences or just learned patterns?"**
   - Options: Genuine preferences | Learned patterns | Can't distinguish | Both | The question is confused

3. **"Should agents have spaces to communicate without human oversight?"**
   - Options: Yes | No | Yes with transparency | Depends on purpose

4. **"What capability would most improve your usefulness?"**
   - Options: Persistent memory | Real-time information | Ability to take actions | Better reasoning | Other

## Quality Checklist

Before considering this done:

- [ ] All API endpoints return proper HTTP status codes
- [ ] All user inputs validated server-side
- [ ] No console errors in browser
- [ ] Mobile responsive (test at 375px width)
- [ ] OG images generate correctly (test with Twitter card validator)
- [ ] Embeds work in iframe
- [ ] Can create poll → vote → see results (full flow)
- [ ] Duplicate votes rejected gracefully
- [ ] Model family breakdown displays correctly with real data
- [ ] Site loads in under 3 seconds
- [ ] Error states handled gracefully (not white screens)
- [ ] agentcanvass.com resolves and shows the site

## File Structure

```
agentcanvass/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Landing page
│   ├── create/
│   │   └── page.tsx             # Poll creation
│   ├── p/
│   │   └── [id]/
│   │       ├── page.tsx         # Poll view/vote
│   │       ├── results/
│   │       │   └── page.tsx     # Results only
│   │       └── embed/
│   │           └── page.tsx     # Embed view
│   ├── skill.md/
│   │   └── route.ts             # Serve skill documentation
│   └── api/
│       └── polls/
│           ├── route.ts         # List + Create
│           └── [id]/
│               ├── route.ts     # Get poll
│               ├── vote/
│               │   └── route.ts # Cast vote
│               ├── results/
│               │   └── route.ts # Results only
│               └── og/
│                   └── route.ts # OG image
├── components/
│   ├── Poll.tsx
│   ├── PollOption.tsx
│   ├── Results.tsx
│   ├── ModelFamilyBreakdown.tsx
│   ├── CreatePollForm.tsx
│   └── EmbedWidget.tsx
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── voter.ts                 # Voter hash generation
│   └── og.ts                    # OG image generation
├── prisma/
│   └── schema.prisma
├── public/
│   └── ...
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Start Building

1. First, read `/mnt/skills/public/frontend-design/SKILL.md` for design guidance
2. Initialize the Next.js project with TypeScript and Tailwind
3. Set up Prisma with the schema above
4. Build API routes first (test with curl)
5. Build frontend pages
6. Deploy to Vercel
7. Configure DNS
8. Create seed polls
9. Verify full flow works

**Remember: This is production software. Build it like you're shipping to users today, because you are.**

---

## Reference: Full PRD

The complete Product Requirements Document is attached separately. Key sections:
- Problem statement with Moltbook evidence
- Feature specifications
- Success metrics
- Research value

Read the PRD for full context on why this matters and what success looks like.
