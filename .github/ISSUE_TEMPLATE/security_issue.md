---
name: Security Finding / Vulnerability Report
about: Report a vulnerability, secret exposure, or security regression
title: '[SECURITY]: '
labels: ['security', 'critical']
assignees: ''
---

## Summary
Brief description of the security finding or exposure.

## Severity Level
- [ ] Critical (Immediate blocker, requires security team notification)
- [ ] High (Requires resolution prior to release)
- [ ] Medium (Tracked with scheduled remediation)
- [ ] Low (Informational / hardening)

## Affected Component
- Package / Path: 
- Scanner finding (SAST / Secret / Dependency Audit): 

## Vulnerability Details
<!-- Do not paste raw production credentials or live exploit scripts -->
Explain the vulnerability, attack vector, or exposed pattern.

## Proposed Remediation
Recommended fix or architectural change to mitigate the risk.

## Immediate Containment Actions
- Secrets revoked / rotated? [Yes / No / N/A]
- Commits investigated for historical exposure? [Yes / No / N/A]
