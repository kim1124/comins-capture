# Security Policy

## Reporting a Vulnerability

Report potential vulnerabilities privately through [GitHub Private Vulnerability
Reporting](https://github.com/kim1124/comins-capture/security/advisories/new).
Do not disclose an unpatched vulnerability in a public issue, pull request, or
discussion. Include a minimal reproduction, affected version and browser, and
the observed security impact. Remove credentials, personal information, and
private DOM content from examples.

## Supported Versions

Version `0.0.1` is published and receives security reports and applicable fixes.
Before `1.0.0`, only the latest verified published version receives security
fixes. Publication and the remaining release closure checks are recorded
separately in the repository's release evidence.

## System and Security Boundaries

Comins Capture runs in the consumer's browser and captures a connected static
`HTMLElement` into a single PNG, JPEG, Canvas, or foreignObject SVG output.
It does not provide a server capture service or isolate hostile JavaScript.
The consumer controls the page, options, and any explicitly supplied resource
resolver. Referenced DOM, CSS, images, and fonts can contain untrusted input.

- Resource network access requires consumer opt-in. Default denial, origin,
  redirect, and credential restrictions must remain effective.
- A supplied resolver is trusted consumer code. Network denial does not
  sandbox its side effects.
- Only prepared resources may cross the internal engine and SVG verification
  boundaries. Engine-specific acquisition must not bypass resource policy.
- Preparation and output limits, cancellation, timeout, and disposal must
  remain effective. Resource byte limits apply after acquisition and do not
  constitute a streaming download limit.
- Capturing must not add telemetry or transmit DOM content without consumer
  opt-in. Third-party engines remain internal to the adapter boundary.

Report reachable violations of these boundaries with their prerequisites and
impact. Browser rendering differences or unsupported inputs alone do not
establish a security vulnerability; an associated security impact is still
eligible for review. Native Safari's known shadow/clip rendering limitation
remains outside the current browser support claim.

## Release Controls

Keep Private Vulnerability Reporting and available dependency and secret alerts
enabled. Check the exact release artifact for sensitive data, license evidence,
package contents, and consumer behavior before publication.

Use a verified, delivery-capable Comins service identity. Expected name and
email are held only in provider-managed `COMINS_NPM_PUBLIC_NAME` and
`COMINS_NPM_PUBLIC_EMAIL` Secrets. Never record their values or credentials in
source, reports, or logs. Unavailable or mismatched identity evidence blocks
publication.

A new package is bootstrapped interactively with maintainer 2FA and no
automation token. After bootstrap, configure the exact repository, workflow
filename, and `npm` environment as its trusted publisher, permit only staged
publishing, disallow token publishing, and require maintainer 2FA approval.
These controls are requirements, not a claim that publishing automation
already exists. Follow the repository's [release procedure](docs/development/releasing.md).

## Disclosure and Incidents

The maintainer assesses private reports, prepares applicable remediation, and
coordinates disclosure and a GitHub security advisory or CVE when appropriate.
No fixed response deadline is promised.

Credential or personal-data incidents block the affected release. Rotate
exposed credentials, retain only redacted evidence, and coordinate remediation
privately. Current-tree checks do not establish that historical registry
metadata or provider caches are clean.
