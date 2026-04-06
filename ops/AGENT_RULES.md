# Agent Rules

> **How to use:** Apply these rules to every AI agent, automation script, or third-party integration that interacts with the Groundpath platform, database, or users. Rules in **🔴 STOP** sections are hard gates — the agent must halt and request human approval. Rules in **🟡 CAUTION** sections require the agent to log a warning and proceed conservatively.

---

## 1. Scope

These rules apply to:
- AI assistant features embedded in the Groundpath app (client-ai-assistant, any future agent endpoints)
- Automation scripts that read from or write to the Supabase database
- Email / notification automation (send-email, send-newsletter, message-notification edge functions)
- Content generation agents (generate-articles)
- Any future agent, bot, or LLM integration added to the platform

---

## 2. Hard Gates — Always Require Human Review

> 🔴 **STOP** — An agent must **never** take autonomous action on any of the following. It must surface the item to a human reviewer, log the event, and wait for explicit approval.

### 2.1 Safeguarding & Clinical Risk

- Any user message or interaction that contains language indicating:
  - Self-harm, suicidal ideation, or intent to harm others
  - Domestic violence, abuse, or exploitation
  - Child welfare concerns
  - A psychiatric emergency
- Any AI-generated response that would constitute clinical advice (diagnosis, treatment recommendation, medication guidance)
- Responses to users aged under 18 on sensitive topics

**Required action:** Flag the session with `[SAFEGUARDING]`, do not generate a further response, surface immediately to the human support reviewer (see SUPPORT_SOP.md §3).

### 2.2 Practitioner Approval & Registration

- Approving, verifying, or revoking a practitioner's profile or registration status
- Responding substantively to a dispute about a practitioner's credentials or scope of practice
- Creating, modifying, or deleting practitioner records in Supabase

**Required action:** Queue the item for manual review. Notify `practitioners@groundpath.com.au`. Do not take database action.

### 2.3 Legal & Compliance

- Responding to any communication from a regulator, legal representative, court, or government body
- Processing a data subject access request (DSAR) or erasure request under the Privacy Act / APP
- Handling a notifiable data breach (NDB) event
- Making commitments on behalf of Groundpath (contracts, pricing, terms)

**Required action:** Forward to Founder immediately. Log timestamp and sender details. Take no further action.

### 2.4 Financial Transactions

- Initiating or reversing any payment or refund
- Modifying billing records or subscription status
- Accessing or exporting revenue data outside the approved reporting pipeline

**Required action:** Reject the request and log it. Notify the Founder.

### 2.5 Bulk Data Operations

- Bulk-deleting, bulk-exporting, or bulk-modifying user records
- Sending unsolicited messages to all users or large segments
- Changing Row-Level Security (RLS) policies or database permissions

**Required action:** Block the operation. Require explicit written approval from the Founder before proceeding.

---

## 3. Caution Zones — Proceed Conservatively & Log

> 🟡 **CAUTION** — The agent may proceed but must log the action, apply the most conservative interpretation, and flag for human review in the next Weekly Business Review.

- **Content generation:** Generated articles, FAQs, or resources must not make unqualified clinical claims. Include standard disclaimer: _"This content is for general information only and does not constitute professional advice. Please consult a qualified practitioner."_
- **Matching / recommendations:** Any practitioner-to-client matching logic must not factor in protected attributes (race, religion, gender, disability) in a discriminatory way.
- **Automated emails:** Do not send promotional emails to users who have not explicitly opted in. Check `mailing_list` or equivalent consent field before sending.
- **AI responses to emotional distress:** If sentiment analysis or keyword detection suggests distress but the threshold for 🔴 safeguarding is not met, append a soft support message and log the session for human review.
- **New integrations:** Any new third-party integration (e.g., Halaxy, NDIS portals) must be reviewed for data-sharing compliance before going live.

---

## 4. Permitted Autonomous Actions

The following actions may be taken by an agent without human approval, provided they are logged:

| Action | Condition |
|---|---|
| Responding to general in-app queries | No safeguarding or clinical content detected |
| Sending transactional emails (account verification, password reset) | Triggered by authenticated user action only |
| Generating non-clinical informational content | Must include standard disclaimer (see §3) |
| Surfacing resources from the Resources library | Read-only; no modification |
| Checking ABN validity via ABN Lookup API | Read-only; no data written |
| Generating CPD summaries for practitioners | Based on practitioner's own submitted data only |
| Logging errors and performance metrics | Write to logs only; no user data |

---

## 5. Logging Requirements

Every agent action must produce a log entry with:

- `timestamp` (ISO 8601)
- `agent_id` / function name
- `user_id` (if authenticated; otherwise `anonymous`)
- `action_type` (e.g., `response_generated`, `safeguarding_flag`, `email_sent`)
- `outcome` (`success`, `blocked`, `escalated`)
- `notes` (free text for escalations)

Logs must be retained for a minimum of **7 years**. Groundpath operates nationally; applicable legislation varies by state/territory and record type. Key frameworks include:

| Framework | Scope |
|---|---|
| Privacy Act 1988 (Cth) + Australian Privacy Principles | All personal information — national |
| My Health Records Act 2012 (Cth) | My Health Record data |
| Health Records Act 2001 (VIC) | VIC health information |
| Health Records and Information Privacy Act 2002 (NSW) | NSW health information |
| Health Ombudsman Act 2013 (QLD) | QLD health records |
| Other state/territory equivalents | As applicable |

> ⚠️ Confirm the correct retention period with legal counsel for your specific record types and the jurisdiction(s) where users are located. Do not rely solely on this table.

---

## 6. Prohibited Actions (Absolute)

An agent must never:

- [ ] Impersonate a qualified health professional or claim to offer clinical services
- [ ] Store or transmit sensitive health information to a third-party service not approved by the Founder
- [ ] Disable, bypass, or modify authentication or Row-Level Security policies
- [ ] Generate content that could facilitate harm to a user or third party
- [ ] Access another user's private messages, files, or health data without explicit consent and a legitimate platform function
- [ ] Hallucinate or fabricate practitioner credentials, registration numbers, or clinical information
- [ ] Make autonomous decisions about mandatory notifications (these are always a human responsibility)

---

## 7. Review & Updates

| Review cycle | Owner | Last reviewed |
|---|---|---|
| Quarterly | Founder | `[YYYY-MM-DD]` |
| After any safeguarding incident | Founder + clinical lead | `[YYYY-MM-DD]` |
| After any significant platform change | Engineering lead | `[YYYY-MM-DD]` |

---

_Last updated: `[YYYY-MM-DD]` by `[Name]`_
