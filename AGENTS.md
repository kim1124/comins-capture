<!-- comins-reference:managed-start contract=v1.10 -->
# Comins Module AGENTS.md

## Common Policy

- Before changing this repository, read the canonical
  [Comins Contract v1.10](https://github.com/kim1124/comins-governance/blob/main/COMINS_CONTRACT.md)
  or, for explicitly approved local-only adoption, its matching version in the
  verified Governance checkout, once per run. For inspection-only work, load it only when a Contract stage
  is relevant. Stop if it is unavailable or its heading does not match this
  block's version. Governance is the only common-policy owner.
- Report an approved local-only revision as unpublished.
- Load the Contract's license, sensitive-data, or release policy only when its
  corresponding stage is triggered.
- Keep module API, implementation, performance, browser, and checker commands
  in `Module Guidance`; the module owns their CI implementation.
<!-- comins-reference:managed-end -->

## Module Guidance

- Independent private, unreleased `comins-capture` package. Preserve local
  research evidence and exclude it from distributed package files.
- SnapDOM 3.2.0 is conditionally adopted; keep an engine-independent adapter
  boundary and prioritize the first external-engine release. Imports stay in
  `src/engine`; public declarations must not expose engine types.
- Derive current exports from `src/index.ts`. It includes local `capture`,
  `CaptureError`, geometry helpers, and related types; implemented exports do
  not establish release readiness or general browser support.
- Source belongs in `src`, fixtures in `playground`, and official guides in
  `docs/guide`. For engine/resource/output work, read only the relevant
  [implementation evidence and limitations](docs/development/instruction-evidence.md)
  and [output contract](docs/guide/output-options.md); verify dated observations.
- Run `npm run verify` for source, type, build, or package changes. For research
  mechanics use `npm run test:research` and, when Python workbench behavior
  changes, `python3 -m unittest discover -s output/playwright/workbench -p 'test_*.py'`.
  Use `npm run dev` for the local demo (default port 6004).
- G1/G2/G3/G4 remain release conditions. Browser claims require installed Chrome
  and native Safari evidence; WebKit and authored fixtures do not establish
  native Safari or general product support.
