# Support Standard Operating Procedure (SOP)

> **How to use:** Follow this SOP for every inbound support request. Start at Step 1 and work through the triage matrix. All safeguarding, clinical risk, legal, and practitioner-approval issues **must** be escalated to a human reviewer before any action is taken — do not resolve these autonomously.

---

## Channels

| Channel | Tool | Response SLA |
|---|---|---|
| In-app contact form | Email → `support@groundpath.com.au` | 1 business day |
| Practitioner onboarding queries | Email → `practitioners@groundpath.com.au` | 1 business day |
| Urgent / crisis referrals | Phone + email escalation | Same day |

---

## Step 1 — Triage

On receiving a new ticket, classify it using the matrix below:

| Category | Example | Priority | Who handles |
|---|---|---|---|
| 🔴 **Safeguarding / crisis** | User reports harm to self or others | Immediate | Human reviewer (see §3) |
| 🔴 **Legal / compliance** | Subpoena, notifiable data breach, regulator contact | Immediate | Founder + legal counsel |
| 🟠 **Practitioner approval** | Registration dispute, credential query, scope-of-practice concern | Same day | Founder or clinical lead |
| 🟠 **Account access** | Locked out, email not received | Same day | Support team |
| 🟡 **Billing** | Incorrect charge, refund request | 1 business day | Support team |
| 🟡 **Technical bug** | Feature not working, error message | 1 business day | Support team → Engineering |
| 🟢 **General enquiry** | "How does Groundpath work?" | 2 business days | Support team |

---

## Step 2 — Acknowledgement

Send the acknowledgement template within **1 hour** of triage (same-day for 🔴 and 🟠):

```
Subject: We've received your message — Groundpath Support

Hi [Name],

Thank you for reaching out to Groundpath. We've received your message and
will get back to you within [SLA].

If this is an emergency or you're in crisis, please contact Lifeline on
13 11 14 or emergency services on 000.

Warm regards,
Groundpath Support
```

---

## Step 3 — Safeguarding & Risk Escalation

> ⚠️ **HUMAN REVIEW REQUIRED** — No automated system or agent may resolve, close, or respond substantively to any ticket in this category without sign-off from a designated human reviewer.

**Escalation triggers (any one is sufficient):**
- User mentions self-harm, suicidal ideation, or harm to others
- User describes abuse (domestic, child, elder)
- Practitioner reports a mandatory notification event under applicable law (e.g., AHPRA obligations)
- User is under 18 and the communication raises a welfare concern
- A message flagged by the AI assistant as high-risk

**Escalation steps:**
1. **Do not** reply to the user with any substantive content yet.
2. Flag the ticket as `[SAFEGUARDING]` in your support tool.
3. Notify the designated reviewer immediately: `[reviewer-name@groundpath.com.au]` / phone: `[+61 XXX XXX XXX]`.
   > ⚠️ **Before going live, replace the bracketed placeholders above with the actual reviewer name, email address, and phone number. Missing contact details could delay a safeguarding response — verify these details are current each quarter.**
4. Reviewer assesses within **2 hours** (business hours) or **4 hours** (out of hours).
5. Reviewer decides: internal response, referral to external service, mandatory notification, or no further action.
6. Document the decision and rationale in the ticket before closing.
7. If mandatory notification is required, Founder must be informed before submission.

**Key referral services (AU):**
| Service | Contact |
|---|---|
| Lifeline | 13 11 14 |
| Beyond Blue | 1300 22 4636 |
| Kids Helpline | 1800 55 1800 |
| 1800RESPECT | 1800 737 732 |
| Emergency | 000 |

---

## Step 4 — Practitioner Approval Issues

> ⚠️ **HUMAN REVIEW REQUIRED** — Decisions about practitioner registration, scope of practice, or credential validity must not be made by an automated agent.

1. Flag the ticket as `[PRACTITIONER-APPROVAL]`.
2. Collect: practitioner name, registration number (AHPRA / AASW), and a description of the concern.
3. Assign to Founder or clinical lead for review.
4. Reviewer cross-checks registration on AHPRA public register or AASW member directory.
5. Respond to practitioner only after reviewer sign-off.

---

## Step 5 — Technical Bugs

1. Reproduce the issue (browser, device, account type).
2. Check Supabase logs and Sentry (if configured).
3. If data loss or security incident: escalate immediately to Founder — treat as 🔴.
4. Otherwise, log in GitHub Issues with label `bug` and assign to the engineering backlog.
5. Notify the user of the expected resolution timeline.

---

## Step 6 — Resolution & Closure

- [ ] Issue is fully resolved or referred to the correct party.
- [ ] User has been notified of the outcome.
- [ ] Ticket is categorised, timestamped, and closed in the support tool.
- [ ] If a safeguarding or legal case: decision is documented and retained for audit.
- [ ] Recurring issues are logged in the Weekly Business Review.

---

## Weekly Support Summary (template)

Fill in during the Weekly Business Review:

| Week | Tickets opened | Tickets closed | Safeguarding escalations | Practitioner approvals | Avg resolution time |
|---|---|---|---|---|---|
| `[YYYY-MM-DD]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `[ ]` |

---

_Last updated: `[YYYY-MM-DD]` by `[Name]`_
