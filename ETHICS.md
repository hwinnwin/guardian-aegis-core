# Guardian Ethics Framework

**Protection without surveillance. Safety without control.**

This document defines the ethical principles, behavioral guidelines, and red lines that govern all Guardian development, deployment, and operation.

---

## Core Ethical Commitments

### 1. Protection, Not Control

Guardian exists to protect children from external threats—specifically online predators and human-initiated harm. We do not exist to control, monitor, or restrict normal childhood development.

**What this means:**
- We detect dangerous adults, not normal teen behavior
- We block predators, not autonomy
- We provide safety, not surveillance
- We support parents, not authoritarian control

**Design implications:**
- No features that enable spying on normal activity
- No tools for enforcing rules unrelated to safety
- No data collection beyond threat detection
- No "gotcha" moments or entrapment mechanics

---

## Detection Ethics

### What Guardian Detects

**Human threats only:**
- Adult grooming patterns
- Sexual solicitation
- Isolation tactics
- Personal information requests
- Off-platform movement attempts
- IRL meeting planning
- Peer-to-peer harm (bullying, sextortion, coercion)
- Age-inappropriate boundary violations
- Manipulation and exploitation patterns

**Behavioral indicators:**
- Power imbalance exploitation
- Secrecy requests ("don't tell your parents")
- Love bombing and excessive attention
- Gradual boundary erosion
- Testing responses to inappropriate content
- Coercive language
- Threat escalation patterns

### What Guardian Does NOT Detect

**Normal development and privacy:**
- Academic performance or school activity
- Screen time or app usage patterns
- Device unlock times
- Search history unrelated to threats
- Age-appropriate conversations with peers
- Political, religious, or social views
- Family disagreements
- Friend group dynamics
- Creative expression
- Exploration of identity

**Age-appropriate behavior:**
- Teen flirting with peers
- Swearing or informal language
- Venting about parents
- Pop culture consumption
- Gaming chat
- Meme sharing
- Normal risk-taking within peer groups

---

## Privacy Principles

### Minimal Data Collection

**We only collect data necessary for threat detection.**

**This means:**
- No full message logging
- No metadata harvesting
- No behavioral profiling beyond safety
- No location tracking
- No contact list scraping
- No media library access beyond reported threats

### Local-First Processing

**Default to on-device inference.**

- Layer 1 (pattern rules) runs locally
- Layer 2 (ML classifier) runs locally when possible
- Layer 3 (cloud AI) requires explicit opt-in
- All local processing uses RAM-only rolling buffers

### Data Lifecycle

**Every piece of data has an expiration.**

- Rolling buffer: Cleared on app close or session end
- Evidence sealed at detection: 30-day auto-delete
- Analytics: Aggregated, anonymized, time-limited
- Logs: Retention only for active debugging, max 7 days
- No indefinite storage of any user data

### Encryption Standards

**All sensitive data encrypted at rest and in transit.**

- Evidence sealed with parent PIN required for unlock
- Tamper-proof sealing prevents backdating or modification
- Transport encryption for any cloud communication
- No plaintext storage of conversation fragments

---

## Transparency Requirements

### Explainable Detection

Every detection decision must be explainable in human terms.

**Users have the right to know:**
- Why content was flagged
- What pattern triggered detection
- What data was examined
- How long data is retained
- Who has access to sealed evidence

**We provide:**
- Plain-language detection summaries
- Pattern match explanations
- Severity scoring rationale
- Appeal mechanisms
- Full audit trails

### Open-Source Logic

Core detection rules and model architecture must be publicly verifiable.

**Public repositories include:**
- Pattern matching rules
- Severity scoring algorithms
- Privacy-preserving ML model architecture
- Crisis protocol procedures
- Evidence handling specifications

**This enables:**
- Security researcher audits
- Community contributions
- Trust through verification
- Independent testing

---

## Child-Centered Design

### Trauma-Informed Communication

All Guardian messaging must be:
- Gentle, not alarming
- Supportive, not shaming
- Empowering, not fear-based
- Clear and honest

**Language guidelines:**
- "We detected something concerning" ✓
- "You're in trouble" ✗
- "This person may not be safe" ✓
- "You made a bad choice" ✗

### Age-Appropriate Responses

Detection responses scale with child developmental stage:

**8-11 years:**
- Simpler language
- Immediate adult notification
- Gentle blocking without detailed explanations
- Focus on "trusted adults can help"

**12-14 years:**
- More context provided
- Explanation of detected pattern
- Resources for understanding grooming
- Encouragement to talk to trusted adults

**15-17 years:**
- Full transparency on detection
- Detailed pattern analysis
- Autonomy in next steps (with safety guardrails)
- Educational resources on manipulation tactics

### Respect for Autonomy

Even while protecting, we respect developing autonomy:
- Teens are informed, not infantilized
- Explanations are educational, not patronizing
- Appeals are possible and reviewed fairly
- Privacy is maintained from peers and siblings

---

## Parental Role Ethics

### Parents as Partners, Not Spies

Guardian positions parents as:
- Safety partners
- Resource providers
- Support systems
- Trusted adults

**NOT as:**
- Surveillance operators
- Authority enforcers
- Privacy invaders
- Punishment dispensers

### Evidence Access Boundaries

**Parents can only access:**
- Pre-sealed evidence from detection events
- Summary information about threat patterns
- Resources for handling disclosures
- Recommended next steps

**Parents CANNOT access:**
- Live conversation streams
- Historical unrelated messages
- Location history
- Social connections
- Normal activity logs

### Guidance Over Punishment

Guardian provides parents with:
- Trauma-informed response guides
- Scripts for difficult conversations
- Resources on grooming education
- Community support connections

**We explicitly discourage:**
- Punishment-first responses
- Shame-based interventions
- Privacy removal as consequence
- Technology bans without context

---

## Institutional Ethics

### School Deployment Principles

When deployed in educational settings:

**Required:**
- Clear communication to students and families
- Opt-in with informed consent
- Limited to school-managed devices/networks
- Adult-to-student threat focus only
- No academic surveillance features

**Prohibited:**
- Secret deployment without disclosure
- Use for disciplinary enforcement
- Access by non-safety personnel
- Sharing data with law enforcement without legal process
- Expansion beyond safety mission

### Data Sovereignty

Schools and institutions do not own student safety data.

- Evidence remains sealed for parents/guardians only
- Institutions receive threat alerts, not raw data
- No data sharing with third parties
- Students maintain privacy from institutional overreach

---

## Red Lines (Absolute Prohibitions)

Guardian will **NEVER**:

### Build surveillance features:
- Message reading for non-threats
- Location tracking
- Keylogging
- Screen recording
- Camera/mic activation
- Social graph mapping

### Enable authoritarian control:
- Content blocking based on values/politics/religion
- Peer communication restriction beyond threats
- Parental spying on normal activity
- Punishment automation

### Exploit user data:
- Sell data to third parties
- Share with advertisers
- Use for non-safety ML training without consent
- Provide to law enforcement without legal warrant
- Create behavioral profiles for marketing

### Compromise privacy:
- Implement backdoors for any entity
- Provide unencrypted access to evidence
- Retain data beyond stated retention periods
- Share data across sibling users
- Link identity across platforms without consent

### Engage in deceptive practices:
- Hide detection capabilities
- Misrepresent data collection
- Obscure retention policies
- Provide false security assurances
- Use dark patterns to obtain consent

---

## Ethical Decision Framework

When evaluating new features or partnerships, apply this test:

### 1. Mission Alignment
Does this serve child protection from human threats?
If no → reject.

### 2. Privacy Impact
Does this require new data collection or retention?
If yes → justify necessity and minimize scope.

### 3. Surveillance Risk
Could this be repurposed for non-safety surveillance?
If yes → redesign or reject.

### 4. Transparency
Can we explain this clearly to users and auditors?
If no → reject or simplify.

### 5. Autonomy Respect
Does this treat children as people with dignity?
If no → reject.

### 6. Abundance Alignment
Does this maintain free universal access?
If no → reject or restructure.

**If any answer violates ethics, the feature does not ship.**

---

## Continuous Ethical Review

### Regular Audits
- Quarterly ethics review of all features
- Annual third-party privacy audit
- Community feedback integration
- Red-team testing for surveillance risks

### Accountability Mechanisms
- Public transparency reports
- Open incident disclosure
- Community oversight board (when scale permits)
- Researcher bug bounty for ethics violations

### Evolution Commitment
Ethics frameworks must evolve with:
- New threat patterns
- Technological capabilities
- Privacy best practices
- Community standards
- Regulatory landscapes

**But core principles remain immutable.**

---

## For Developers

Every line of code must pass the ethics test:

**Ask yourself:**
- Would I want this used on my child?
- Can I explain this decision in plain language?
- Does this respect privacy and autonomy?
- Could this be misused for surveillance?
- Does this align with our mission?

**If you're unsure, escalate.**

Ethics violations are never acceptable, even for:
- Performance gains
- Engagement metrics
- Revenue opportunities
- Competitive advantages
- Regulatory pressure

**Mission integrity > all other concerns.**

---

## Commitment

Guardian exists because children deserve safety **and** privacy.

We refuse the false choice between protection and surveillance.
We build the third way: **threat detection without monitoring.**

This is our ethical foundation.
This is non-negotiable.
This is Guardian.

---

**Version:** 1.0
**Last Updated:** 2025-11-18
**Status:** Binding on all Guardian development and operations
