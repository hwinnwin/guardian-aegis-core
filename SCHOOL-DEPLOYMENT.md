# Guardian School Deployment Guide

**Protection without surveillance. Safety without control.**

This guide provides educational institutions with a complete framework for deploying Guardian ethically, effectively, and in alignment with student privacy and dignity.

---

## Overview

Guardian is **not** a student monitoring system.

Guardian is an **antivirus for online predators** — detecting and blocking grooming behavior from adults targeting students, while preserving privacy for normal student communication.

**What Guardian does:**
- Detects adult predatory behavior patterns
- Blocks grooming attempts in real-time
- Provides summary-only alerts to school counselors
- Preserves evidence for parent review (encrypted, 30-day auto-delete)
- Respects student privacy and autonomy

**What Guardian does NOT do:**
- Monitor student messages or conversations
- Track location or browsing history
- Enable disciplinary enforcement
- Provide full chat transcripts to staff
- Spy on normal student activity

---

## Core Ethical Commitments for Schools

### 1. Protection, Not Surveillance
Guardian must never be used for general student monitoring, discipline, or control.

### 2. Summary-Only Alerts
School staff receive threat summaries, not full message access.

### 3. Counselor-First Escalation
Sensitive alerts route to trained school counselors, not teachers or administrators.

### 4. Student Dignity
Students must feel protected, not monitored or policed.

### 5. Parent Partnership
Parents are primary stakeholders in their child's safety data.

### 6. Transparent Deployment
Students and families must know Guardian exists and understand how it works.

### 7. Free Access
No student denied protection due to school's inability to pay.

**Violation of these principles violates Guardian's Charter and may result in deployment termination.**

---

## Deployment Timeline

### Phase 1: Planning & Approval (2-4 weeks)
- Stakeholder alignment
- Policy review
- Technical assessment
- Budget allocation (voluntary contribution model)

### Phase 2: Pilot Program (4-6 weeks)
- Small cohort (1-2 classes, 20-50 students)
- Counselor training
- Parent consent process
- Feedback collection

### Phase 3: School-Wide Rollout (6-8 weeks)
- Full student body deployment
- Staff training completion
- Ongoing support activation
- Monitoring and refinement

### Phase 4: District Expansion (3-6 months)
- Multi-school coordination
- Shared safety protocols
- District-level reporting
- Community of practice

---

## Pre-Deployment Checklist

**Administrative Alignment:**
- [ ] Principal/leadership approval
- [ ] School board notification (if required)
- [ ] IT department coordination
- [ ] Legal/policy review
- [ ] Budget discussion (abundance model explained)

**Safety Team Preparation:**
- [ ] Identify designated school counselor(s)
- [ ] Confirm mandatory reporting protocols
- [ ] Establish crisis response chain
- [ ] Integrate with existing safety procedures

**Technical Readiness:**
- [ ] Device inventory (BYOD vs. school-owned)
- [ ] Network infrastructure assessment
- [ ] Installation method determined
- [ ] Dashboard access configured

**Communication Planning:**
- [ ] Parent notification letter drafted
- [ ] Student introduction prepared
- [ ] Staff briefing scheduled
- [ ] FAQ document created

**Consent Framework:**
- [ ] Parent consent form finalized
- [ ] Student assent process designed
- [ ] Opt-out pathway established
- [ ] Record-keeping system ready

---

## Roles & Responsibilities

### School Safety Officer (Designated Counselor)
**Primary Guardian contact and alert recipient.**

**Responsibilities:**
- Receive and assess Guardian alerts
- Conduct initial student safety check-ins
- Coordinate with parents on threat responses
- Maintain confidentiality of sensitive information
- Document incident responses
- Provide feedback to Guardian system

**Training required:** 45-minute Guardian counselor training (see `/docs/school/counselor-training.md`)

### School Principal/Administrator
**Oversight and policy enforcement.**

**Responsibilities:**
- Ensure ethical Guardian deployment
- Support safety officer resources
- Approve crisis response protocols
- Maintain parent/community communication
- Monitor deployment compliance with Charter

**Does NOT receive:** Individual student alerts or message content

### IT Staff
**Technical deployment and maintenance.**

**Responsibilities:**
- Install Guardian on school devices (if applicable)
- Configure network settings
- Troubleshoot technical issues
- Maintain system updates
- Ensure data privacy compliance

**Does NOT have access to:** Student alerts or evidence

### Teachers
**Awareness and referral support.**

**Responsibilities:**
- Understand what Guardian does (and doesn't do)
- Refer student concerns to safety officer
- Support students who disclose threats
- Maintain normal educational relationship

**Does NOT receive:** Guardian alerts or student safety information

**Training required:** 15-minute Guardian awareness module (see `/docs/school/teacher-training.md`)

### Parents/Guardians
**Primary decision-makers for child's participation.**

**Responsibilities:**
- Provide informed consent
- Review sealed evidence if threats detected
- Communicate with school safety officer
- Support child through disclosures
- Understand privacy protections

**Access:** PIN-protected evidence review only (via Guardian app)

---

## Consent & Transparency

### Informed Consent Requirements

**For student participation, both required:**

1. **Parent/guardian written consent**
   - Explanation of Guardian functionality
   - Privacy protections outlined
   - Evidence handling described
   - Opt-out option provided
   - Abundance model explained (no payment required)

2. **Student assent (age-appropriate)**
   - 8-11: Simple explanation, verbal assent
   - 12-14: Detailed explanation, written assent
   - 15-17: Full transparency, written assent with appeal rights

**Consent must be:**
- Freely given (not coerced)
- Specific (Guardian deployment only, not general surveillance)
- Informed (clear explanation provided)
- Documented (records maintained)

**Template consent forms:** See `/docs/school/parent-consent-template.md`

### Transparency Mechanisms

**Students know:**
- Guardian is active on their device/network
- What Guardian detects (predatory behavior, not normal activity)
- Who receives alerts (counselor, not teachers)
- How evidence is handled (sealed, parent access only)
- How to report concerns directly

**Parents know:**
- How Guardian works technically
- Privacy protections in place
- Evidence access procedures
- School's crisis response protocol
- How to opt out if desired

**Staff know:**
- Guardian's ethical boundaries
- Alert routing procedures
- Their role in student safety
- What they can and cannot access

---

## Installation & Technical Setup

### Deployment Models

**Model 1: School-Owned Devices**
- Pre-install Guardian extension/app during device imaging
- Centralized configuration via MDM (Mobile Device Management)
- Automatic updates enabled
- School network integration

**Model 2: BYOD (Bring Your Own Device)**
- Parent-installed Guardian app with school configuration
- QR code or enrollment link provided
- Student device registration
- Optional network-layer detection for on-campus protection

**Model 3: Hybrid**
- Guardian on school devices (mandatory)
- Optional BYOD enrollment (parent choice)
- Consistent alert routing regardless of device

**Recommended:** Start with Model 1 (school devices) for pilot, expand to Model 3 for scale.

### Technical Configuration

**Dashboard Setup:**
1. Create school organization account
2. Add designated safety officer(s)
3. Configure alert routing (counselor-first)
4. Set severity thresholds (typically: High and Critical only)
5. Enable privacy-preserving reporting

**Device Installation:**
1. Install Guardian extension/app
2. Authenticate with school organization
3. Verify local detection operational
4. Test alert routing
5. Confirm evidence sealing

**Network Integration (Optional):**
- Deploy on-campus network monitoring for additional protection
- Privacy-preserving DPI (Deep Packet Inspection) for pattern detection
- Summary-only logging
- No full packet capture

**Privacy Requirements:**
- Local processing prioritized
- Minimal data retention (rolling buffer only)
- Encrypted evidence storage
- 30-day auto-delete
- No third-party data sharing

---

## Alert Handling Procedures

### Alert Severity Levels

**Critical (Immediate Response):**
- Explicit sexual solicitation
- Meeting planning with adult
- Coercion or threats
- Imminent danger indicators

**High (Same-Day Response):**
- Grooming behavior patterns
- Personal information extraction
- Isolation tactics
- Boundary violation escalation

**Medium (1-2 Day Response):**
- Early warning indicators
- Potential boundary testing
- Peer-to-peer concerns
- Requires monitoring

**Low (Educational Intervention):**
- Borderline interactions
- Safety education opportunity
- No immediate threat

### Alert Routing

**All Critical & High alerts → School Safety Officer immediately**
**Medium alerts → Daily summary to Safety Officer**
**Low alerts → Weekly summary (optional)**

**NOT routed to:** Teachers, administrators, IT staff, other students

### Safety Officer Response Protocol

**Upon receiving alert:**

**Step 1: Review Alert Summary (5 min)**
- Read threat category and severity
- Review pattern indicators
- Note student identity (confidential)
- Assess immediate risk

**Step 2: Immediate Safety Check (30 min)**
- Discreet check-in with student
- Assess current safety status
- Provide support resources
- Document initial contact

**Step 3: Parent Notification (same day for High/Critical)**
- Contact parent/guardian
- Explain alert (summary, not full transcript)
- Provide evidence access instructions
- Coordinate next steps

**Step 4: Intervention Planning (24-48 hours)**
- Collaborate with parent on response
- Engage law enforcement if appropriate
- Provide counseling resources
- Monitor ongoing safety

**Step 5: Documentation (ongoing)**
- Record actions taken
- Note student wellbeing
- Track resolution
- Report to Guardian system for detection improvement

**Detailed workflow:** See `/docs/school/safety-officer-playbook.md`

---

## Training Requirements

### Mandatory Training

**School Safety Officer (45 minutes):**
- Guardian detection methodology
- Alert interpretation and response
- Evidence handling procedures
- Trauma-informed communication
- Mandatory reporting integration
- Crisis protocols

**School Leadership (30 minutes):**
- Guardian ethical framework
- Oversight responsibilities
- Parent communication approach
- Policy compliance
- Budget/abundance model

**Teachers & Staff (15 minutes):**
- What Guardian does/doesn't do
- Referral procedures
- Student support best practices
- Privacy boundaries

**IT Staff (20 minutes):**
- Technical installation
- Troubleshooting
- Privacy requirements
- System monitoring

### Optional Training

**Parent Information Session (45 minutes):**
- How Guardian protects students
- Privacy guarantees
- Evidence access procedures
- Q&A

**Student Orientation (age-appropriate):**
- 8-11: 10-minute simple introduction
- 12-14: 20-minute explanation with Q&A
- 15-17: 30-minute detailed session with agency emphasis

**Training materials:** See `/docs/school/training/`

---

## Crisis Response Integration

### Mandatory Reporting Coordination

**Guardian alerts do NOT replace mandatory reporting obligations.**

When Guardian detects potential abuse:

1. Safety Officer receives alert
2. Safety Officer assesses for mandatory reporting triggers
3. If triggered: Follow school's existing mandatory reporting protocol
4. Guardian evidence may support report but is not required
5. Parent notification occurs per policy and legal requirements

**Guardian provides:**
- Encrypted evidence preservation
- Timeline documentation
- Pattern analysis
- Support for reporting process

**Guardian does NOT:**
- Replace professional judgment
- Mandate specific reporting actions
- Provide legal advice
- Substitute for investigation

### School Crisis Protocol Integration

**Guardian integrates with existing school safety procedures:**

**Threat Assessment Team:**
- Guardian alerts inform risk assessment
- Safety officer participates in team meetings
- Evidence available for review (with appropriate access controls)

**Suicide Prevention:**
- Guardian can detect concerning language patterns
- Alerts route to mental health support
- Immediate intervention protocols activated

**Law Enforcement Liaison:**
- Guardian evidence available via proper legal process
- Summary reports provided for investigations
- Preservation of evidence for longer than 30 days if legally required

**Parent Communication:**
- Guardian alerts integrated into parent safety notifications
- Consistent messaging across school communication channels

---

## Privacy & Data Governance

### Student Privacy Protections

**What Guardian collects (per device):**
- Threat pattern matches (not full messages)
- Timestamps and severity scores
- Contextual indicators for classification
- Evidence snapshots (only when threat detected)

**What Guardian does NOT collect:**
- Full message histories
- Location data
- Browsing history unrelated to threats
- Social connections or contact lists
- Academic or disciplinary records

**Data retention:**
- Rolling buffer: RAM only, cleared on session end
- Evidence: Encrypted, 30-day auto-delete (unless legally required)
- Alert summaries: School dashboard, 90-day retention
- Aggregate analytics: Anonymized, used for detection improvement only

### School Data Access Controls

**Access tiers:**

**Tier 1 - School Safety Officer:**
- Alert summaries
- Threat category and severity
- Evidence access (summary only, not full messages)
- Student support documentation

**Tier 2 - School Administrator:**
- Aggregate analytics (no student-identifying information)
- System health metrics
- Policy compliance reports

**Tier 3 - IT Staff:**
- System configuration
- Technical health monitoring
- No access to alerts or student data

**Tier 4 - Teachers:**
- No Guardian access
- Referral portal only (for student-initiated concerns)

**Tier 5 - Parents:**
- Full evidence access for their child only (PIN-protected)
- Alert notifications for their child
- Historical summary

### Compliance Requirements

**FERPA (Family Educational Rights and Privacy Act):**
- Guardian data classified as education records
- Parent access rights maintained
- Third-party sharing prohibited without consent
- Audit trail maintained

**COPPA (Children's Online Privacy Protection Act):**
- Parental consent obtained
- Minimal data collection
- Secure storage
- Transparent practices

**State/Local Privacy Laws:**
- Compliance verified during deployment planning
- Legal review recommended
- Policy alignment ensured

---

## Pilot Program Guidelines

### Pilot Cohort Selection

**Recommended size:** 20-50 students (1-2 classrooms)

**Selection criteria:**
- Diverse grade levels (if possible)
- Engaged parents willing to provide feedback
- Supportive teachers
- Technology access (school devices or BYOD capable)

**Avoid:**
- "Problem student" targeting (violates ethics)
- Selective deployment based on demographics
- Coercive participation

### Pilot Timeline

**Week 1-2: Setup & Training**
- Safety officer training
- Teacher briefing
- IT installation
- Dashboard configuration

**Week 3: Parent Consent**
- Information session
- Consent form distribution
- Q&A availability
- Enrollment confirmation

**Week 4: Student Introduction**
- Age-appropriate orientation
- Device setup (if BYOD)
- Testing and validation

**Week 5-10: Active Monitoring**
- Alert handling
- Feedback collection
- Refinement of procedures
- Support provision

**Week 11-12: Evaluation**
- Safety officer debrief
- Parent survey
- Student feedback (optional, age-appropriate)
- Decision on expansion

### Success Metrics

**Safety Outcomes:**
- Number of threats detected
- Response time to alerts
- Student safety maintained or improved
- Parent satisfaction with communication

**Operational Metrics:**
- Alert accuracy (true positives vs. false positives)
- Safety officer workflow efficiency
- Technical reliability
- Staff confidence in system

**Privacy Metrics:**
- Zero inappropriate data access incidents
- Consent completion rate
- Student trust maintained
- Transparency goals met

**Expansion decision requires:**
- Positive safety outcomes
- Operational feasibility confirmed
- Privacy protections validated
- Community support maintained

---

## Abundance Model for Schools

### Free Access Commitment

**All schools receive full Guardian access, regardless of ability to pay.**

**This includes:**
- Complete detection engine (all layers)
- School dashboard
- Safety officer training
- Technical support
- System updates
- Crisis assistance

**No feature tiers. No paywalls. No student excluded.**

### Voluntary Contribution Model

**Well-resourced schools invited to contribute:**
- Suggested contribution: Based on enrollment and budget capacity
- Contributions fund free access for under-resourced schools
- Fully voluntary, zero pressure
- Same features regardless of contribution

**Title I schools and under-resourced communities:**
- Permanently free
- Priority support
- No expectation of payment

**How contributions help:**
- Expand free deployments
- Fund detection research
- Support community safety initiatives
- Sustain ethical operations

**Financial transparency:**
- Quarterly reports on school deployment funding
- Clear allocation of contributions
- Community accountability

---

## Ongoing Support & Improvement

### Technical Support

**For IT staff:**
- Email: school-support@lumenguardian.app
- Response time: 24 hours (48 hours for non-urgent)
- Installation guides and troubleshooting docs

**For safety officers:**
- Alert interpretation guidance
- Crisis consultation available
- Best practice sharing

### Feedback Integration

**Schools provide valuable input:**
- Alert accuracy feedback
- False positive reports
- Edge case identification
- Workflow improvement suggestions

**Guardian uses feedback for:**
- Detection rule refinement
- False positive reduction
- Training material improvement
- Feature prioritization

**Community of practice:**
- Quarterly school safety officer calls
- Shared learnings and best practices
- Peer support network
- Collaboration on challenges

### Continuous Improvement

**Guardian commits to:**
- Regular detection updates
- Privacy enhancement
- Usability improvements
- Transparent communication

**Schools commit to:**
- Ethical deployment maintenance
- Consent renewal (annual)
- Staff training updates
- Feedback provision

---

## Red Lines (Prohibited Uses)

Schools must NEVER use Guardian for:

**Surveillance:**
- Monitoring student messages beyond threat detection
- Tracking location or browsing
- Disciplinary enforcement
- General "checking up" on students

**Control:**
- Restricting student communication with peers
- Blocking content based on values/politics/religion
- Parental-style controls beyond safety

**Discrimination:**
- Targeting specific demographic groups
- Selective deployment based on stereotypes
- Differential treatment based on socioeconomic status

**Punishment:**
- Using Guardian alerts for discipline
- Shaming students for flagged content
- Retaliatory actions

**Privacy Violation:**
- Sharing student data with third parties
- Accessing evidence without proper authorization
- Retaining data beyond policy limits
- Using data for non-safety purposes

**Violation of these prohibitions may result in:**
- Deployment termination
- Public disclosure
- Legal action if applicable

---

## FAQ for Schools

**Q: Will Guardian monitor everything students do online?**
A: No. Guardian detects adult predatory behavior patterns only. Normal student conversations, browsing, and online activity are not monitored.

**Q: Can teachers see student messages?**
A: No. Only designated school safety officers receive alert summaries (not full transcripts).

**Q: What if a parent doesn't want their child enrolled?**
A: Parents can opt out. Guardian is voluntary, not mandatory.

**Q: Does Guardian work on student personal devices?**
A: Only if parents choose to install it (BYOD model). School cannot force installation on personal devices.

**Q: How much does Guardian cost for schools?**
A: Guardian is free. Well-resourced schools may contribute voluntarily to support free access for others.

**Q: What happens to data when a student graduates or leaves?**
A: All data auto-deletes within 30 days of last activity. No permanent records retained.

**Q: Can Guardian prevent all online predator contact?**
A: No system is perfect. Guardian significantly reduces risk but cannot guarantee 100% prevention.

**Q: Who can access Guardian evidence?**
A: Parents only (with PIN). School safety officers receive summaries, not full evidence.

**Q: Is Guardian a replacement for counselors and safety staff?**
A: No. Guardian is a tool to support existing safety infrastructure, not replace human judgment.

**Q: What if we have a false positive?**
A: Safety officer assesses and can dismiss. Feedback helps improve accuracy. No disciplinary action for false positives.

---

## Getting Started

**Ready to deploy Guardian at your school?**

**Step 1:** Contact Guardian school partnerships team
- Email: schools@lumenguardian.app
- Subject: [School Name] Guardian Deployment Interest

**Step 2:** Schedule intro call (30 minutes)
- Overview of Guardian
- Discuss your school's needs
- Review deployment timeline
- Answer questions

**Step 3:** Access deployment resources
- Detailed planning guide
- Template communications
- Training materials
- Technical specifications

**Step 4:** Begin pilot planning
- Identify pilot cohort
- Train safety officer
- Coordinate with IT
- Engage parents

**Step 5:** Launch and learn
- Deploy to pilot
- Monitor and refine
- Collect feedback
- Plan expansion

---

## Additional Resources

**Documentation:**
- Safety Officer Playbook: `/docs/school/safety-officer-playbook.md`
- Counselor Workflows: `/docs/school/counselor-workflows.md`
- Parent Communication Templates: `/docs/school/parent-communications.md`
- Teacher Training Materials: `/docs/school/teacher-training.md`
- Student Introductions: `/docs/school/student-introductions.md`
- Policy Templates: `/docs/school/policy-templates.md`

**External Resources:**
- National Center for Missing & Exploited Children: netsmartz.org
- Internet Safety 101: internetsafety101.org
- Common Sense Media: commonsensemedia.org
- Cyberbullying Research Center: cyberbullying.org

**Support:**
- Schools: schools@lumenguardian.app
- Technical: school-support@lumenguardian.app
- Crisis: crisis@lumenguardian.app

---

## Commitment to Schools

Guardian exists to protect students while respecting their privacy and dignity.

We partner with schools as:
- Safety allies, not surveillance vendors
- Privacy advocates, not data collectors
- Student protectors, not control enforcers

**We commit to:**
- Free access for all schools
- Transparent operations
- Ethical deployment support
- Continuous improvement
- Accountability when we fail

**We ask schools to commit to:**
- Ethical use within Charter principles
- Transparent deployment with consent
- Student dignity and privacy
- Counselor-first safety culture
- Feedback and collaboration

**Together, we can protect students without surveilling them.**

---

**Version:** 1.0
**Last Updated:** 2025-11-18
**Status:** Active school deployment framework

**Questions?** schools@lumenguardian.app
