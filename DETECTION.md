# Guardian Threat Detection Framework

**Privacy-preserving detection of human threats targeting children.**

This document details Guardian's multi-layer detection architecture, threat taxonomy, severity scoring, and privacy-first processing approach.

---

## Detection Philosophy

Guardian detects **predator behavior patterns**, not individual words or phrases.

**Core principles:**
- Pattern-based, not keyword-based
- Context-aware, not reactive
- Escalation-detecting, not snapshot-based
- Privacy-preserving by design
- Explainable and auditable

**We detect manipulation, not conversation.**

---

## Multi-Layer Detection Architecture

Guardian uses a four-layer cascade model, processing from fastest/most-private to slowest/most-accurate.

### Layer 1: Fast Path (Pattern Rules)
**Latency:** <50ms
**Location:** Local device (browser extension, app)
**Privacy:** RAM-only, no data leaves device

**How it works:**
- Pattern matching against known grooming indicators
- Severity scoring based on phrase combinations
- Context window analysis (rolling buffer)
- Escalation tracking across conversation

**Detects:**
- Explicit solicitation language
- Personal info requests (address, phone, school)
- Platform migration attempts ("add me on...")
- Secrecy requests ("don't tell your parents")
- Meeting planning language
- Age-checking followed by inappropriate content

**Example patterns:**
- "how old are you" + sexual reference
- "where do you live" + isolation language
- "you're so mature for your age" + boundary testing
- "delete this conversation" + previous flags

**Advantages:**
- Instant response
- Zero privacy impact
- Works offline
- No external dependencies

**Limitations:**
- Cannot understand nuanced context
- May miss novel manipulation tactics
- Requires continuous rule updates

---

### Layer 2: Local ML Classifier
**Latency:** ~500ms
**Location:** Local device (TensorFlow.js / ONNX Runtime)
**Privacy:** On-device inference, no data transmission

**How it works:**
- Trained on grooming conversation patterns
- Contextual understanding of manipulation tactics
- Semantic analysis beyond keyword matching
- Confidence scoring for each detection

**Detects:**
- Subtle boundary testing
- Gradual escalation patterns
- Emotional manipulation
- Love bombing and excessive attention
- Power imbalance exploitation
- Guilt and shame tactics

**Model architecture:**
- Privacy-preserving embedding layer
- Transformer-based context analysis
- Minimal data retention (rolling window only)
- Explainable decision outputs

**Advantages:**
- Nuanced understanding
- Adapts to new manipulation tactics
- Works offline
- Maintains full privacy

**Limitations:**
- Requires device compute resources
- Model size constraints
- Update cycle slower than rules

---

### Layer 3: Cloud AI (Opt-In)
**Latency:** 1-3 seconds
**Location:** Privacy-preserving cloud inference
**Privacy:** Encrypted, anonymized, context-limited

**How it works:**
- Advanced LLM-based analysis for edge cases
- Multi-turn conversation understanding
- Cross-platform pattern detection
- Sophisticated manipulation detection

**Detects:**
- Novel grooming tactics not seen before
- Complex multi-stage manipulation
- Sophisticated social engineering
- Context-dependent threat assessment

**Privacy protections:**
- Requires explicit user opt-in
- Message encryption in transit
- No persistent storage
- Anonymized identifiers
- Minimal context window
- No linkage across sessions

**Advantages:**
- Highest accuracy
- Adapts to emerging threats fastest
- Can leverage largest models
- Handles complex edge cases

**Limitations:**
- Requires network connection
- Privacy trade-off (mitigated but present)
- Latency impact
- Operational cost

**Users can disable Layer 3 entirely while retaining Layers 1-2.**

---

### Layer 4: Community Reports
**Latency:** Human review cycle
**Location:** Encrypted report system
**Privacy:** Evidence-sealed, reviewed by trained moderators

**How it works:**
- Users (children or parents) can flag concerning interactions
- Trained safety reviewers assess reports
- Validated threats added to detection corpus
- False positives improve model training

**Purpose:**
- Catch zero-day manipulation tactics
- Validate detection accuracy
- Provide human judgment on edge cases
- Rapid response to emerging threats

**Privacy protections:**
- Reports encrypted and access-controlled
- Reviewers bound by strict confidentiality
- Evidence auto-deleted after review cycle
- No sharing with third parties

---

## Threat Taxonomy

### Category 1: Adult Sexual Predation

**Behaviors detected:**
- Grooming conversation patterns
- Sexual solicitation of minors
- Requests for explicit images
- Adult-initiated sexual content
- Age-inappropriate sexual discussions

**Severity:** High to Critical

**Response:**
- Immediate block
- Evidence sealing
- Parent notification
- Optional law enforcement resources provided

---

### Category 2: Personal Information Extraction

**Behaviors detected:**
- Requests for home address
- School location probing
- Phone number requests
- Full name extraction
- Schedule/routine questions
- Family structure probing

**Severity:** Medium to High (context-dependent)

**Response:**
- Warning to child
- Block if combined with other red flags
- Parent notification if escalating
- Educational resources on information safety

---

### Category 3: Isolation Tactics

**Behaviors detected:**
- "Don't tell your parents/friends"
- Platform migration to less monitored spaces
- Deletion requests ("delete our conversation")
- Secrecy cultivation
- Relationship concealment pressure

**Severity:** Medium to High

**Response:**
- Immediate flag
- Parent notification
- Educational intervention about healthy relationships
- Block if combined with sexual content

---

### Category 4: Meeting Planning

**Behaviors detected:**
- Attempts to arrange in-person meetings
- Location sharing requests
- Schedule coordination
- Transportation offers
- "Let's meet up" + location details

**Severity:** High to Critical

**Response:**
- Immediate block
- Evidence sealing
- Parent notification
- Safety resources provided

---

### Category 5: Boundary Testing & Escalation

**Behaviors detected:**
- Gradual introduction of sexual topics
- Testing comfort with inappropriate content
- Normalized desensitization patterns
- Progressive boundary erosion
- Response-based escalation

**Severity:** Low to High (based on escalation trajectory)

**Response:**
- Monitor and track escalation
- Warn if pattern strengthens
- Block if crosses severity threshold
- Educational resources on grooming tactics

---

### Category 6: Emotional Manipulation

**Behaviors detected:**
- Love bombing (excessive flattery/attention)
- Guilt and shame tactics
- "You're so mature for your age"
- Special relationship claims
- Emotional dependency cultivation
- Isolation from support network

**Severity:** Medium to High

**Response:**
- Educational intervention
- Parent notification if escalating
- Resources on healthy relationships
- Block if combined with sexual content

---

### Category 7: Coercion & Threats

**Behaviors detected:**
- Sextortion attempts
- Blackmail or threats
- Distribution threats of images/info
- Pressure tactics
- Intimidation language

**Severity:** Critical

**Response:**
- Immediate block
- Evidence sealing
- Parent notification
- Law enforcement resources provided
- Crisis support resources

---

### Category 8: Peer-to-Peer Harm

**Behaviors detected:**
- Bullying and harassment
- Peer sextortion
- Non-consensual image sharing
- Sustained emotional abuse
- Group-based harassment

**Severity:** Low to High (context-dependent)

**Response:**
- Educational intervention
- Parent notification for sustained patterns
- School reporting resources (if applicable)
- Mental health support resources

---

## Severity Scoring

Guardian uses a dynamic severity model based on:

### Factors that increase severity:
- Adult-to-child interaction (vs. peer-to-peer)
- Sexual content present
- Multiple red flags in combination
- Escalation over time
- Requests for secrecy
- Real-world meeting planning
- Power imbalance (age, authority, influence)
- Coercive or threatening language

### Severity Tiers:

**Low (Score 1-3):**
- Single borderline indicator
- Peer-to-peer with mild concern
- No escalation pattern
- Ambiguous context

**Response:** Log, monitor, educate

**Medium (Score 4-6):**
- Multiple indicators present
- Clear manipulation pattern
- No immediate danger but concerning
- Escalation beginning

**Response:** Warn, educate, notify parent if persists

**High (Score 7-9):**
- Strong grooming pattern
- Sexual content or solicitation
- Isolation tactics present
- Clear predatory behavior

**Response:** Block, seal evidence, notify parent immediately

**Critical (Score 10):**
- Imminent danger
- Meeting planning with adult
- Explicit sexual solicitation
- Threats or coercion
- Multiple severe indicators

**Response:** Immediate intervention, evidence preservation, parent alert, law enforcement resources provided

---

## Privacy-First Processing

### Rolling Buffer Architecture

**Purpose:** Maintain conversation context without persistent storage

**Implementation:**
- Fixed-size circular buffer in RAM
- Typical size: Last 50-100 messages or 10-minute window
- Cleared on app close or session end
- Never written to disk unless threat detected

**Why this matters:**
- Normal conversations leave no trace
- Only threats trigger evidence preservation
- Memory automatically cleared
- No historical surveillance database

### Evidence Sealing

**Triggered only when threat detected (Medium severity or higher).**

**Process:**
1. Extract minimal context (threat message + 5 messages before/after)
2. Encrypt with parent PIN-derived key
3. Timestamp and cryptographically seal
4. Store locally (encrypted, tamper-proof)
5. Auto-delete after 30 days unless parent accesses

**Parents cannot:**
- Access unsealed conversations
- Retrieve messages outside threat context
- View historical non-threat messages
- Unlock without PIN

**This prevents:**
- Surveillance of normal activity
- Backdating or modifying evidence
- Unauthorized access
- Indefinite data retention

### Context Minimization

**Guardian extracts only what's necessary:**

**For pattern rules:**
- Phrase patterns (not full messages)
- Temporal spacing between flags
- Escalation trajectory
- No identity linkage

**For ML inference:**
- Semantic embeddings (not raw text)
- Contextual relationships
- Confidence scores
- No persistent storage of inputs

**For cloud processing (opt-in only):**
- Anonymized conversation snippets
- Encrypted in transit
- No session linkage
- Immediate deletion post-inference

---

## Shadow Mode (Calibration & Testing)

**Purpose:** Validate detection accuracy without impacting users.

**How it works:**
- Runs Layer 1 (rules) and Layer 2 (ML) in parallel
- Compares detection agreements and disagreements
- Logs discrepancies for model refinement
- Does not trigger blocks or alerts

**Used for:**
- Tuning severity thresholds
- Identifying false positives
- Training new ML models
- A/B testing detection improvements

**Privacy:** Same as production (rolling buffer, local processing, no persistent storage)

**Toggle:** `localStorage.guardian_shadow = "1"`

---

## Explainability

Every detection provides:

**What was detected:**
- Category (e.g., "Personal information request + isolation tactic")
- Severity score
- Specific indicators matched

**Why it was flagged:**
- Plain-language explanation
- Pattern breakdown
- Escalation context if applicable

**What happens next:**
- Response action (warn, block, notify)
- Resources provided
- Appeal process

**Example output:**
```
Detection: Medium Severity (Score 5)
Category: Personal Information Request + Boundary Testing
Indicators:
  - Request for school location
  - Previous age-inappropriate comment
  - Escalation from general chat to personal questions
Action: Warning displayed, parent notified if pattern continues
Appeal: Available through dashboard
```

---

## Continuous Improvement

### Model Training
- Federated learning approaches for privacy
- Community-contributed edge cases
- Red-team generated scenarios
- Security researcher validation

### Rule Updates
- Weekly rule refinement based on threat intelligence
- Community feedback integration
- False positive reduction priority
- Transparency in rule changes

### Performance Metrics
- Detection accuracy (true positive rate)
- False positive rate (minimize disruption)
- Latency benchmarks
- Privacy audit compliance

---

## For Developers

### Adding New Detection Rules

**Requirements:**
1. Justify threat alignment (not surveillance)
2. Severity scoring rationale
3. Explainability output
4. Privacy impact assessment
5. False positive mitigation

**Process:**
1. Draft rule with examples
2. Shadow mode testing (minimum 1000 conversations)
3. False positive review
4. Ethics approval
5. Staged rollout
6. Transparency disclosure

### Training ML Models

**Data sources (all privacy-preserving):**
- Synthetic grooming conversations (generated)
- Community-reported validated threats (anonymized)
- Public safety datasets (academic)
- Red-team scenarios

**Prohibited data:**
- Real user conversations without explicit consent
- Scraped social media
- Purchased datasets of unknown provenance
- Any data that compromises user privacy

---

## Threat Intelligence

Guardian participates in privacy-preserving threat intelligence sharing:

**We share (anonymized, aggregated):**
- Novel manipulation tactics detected
- Emerging grooming patterns
- Platform-specific threat vectors

**We receive:**
- Industry threat feeds
- Academic research on predator behavior
- Law enforcement alerts (zero-day tactics)

**Always privacy-preserving. Never user-identifying.**

---

## Commitment

Guardian detection exists to protect children from human threats.

Every detection decision is:
- Privacy-preserving
- Explainable
- Auditable
- Necessary
- Proportional

**We detect predators, not people.**

---

**Version:** 1.0
**Last Updated:** 2025-11-18
**For questions or threat reports:** security@lumenguardian.app
