# Third-party notices

Comins Capture includes a modified internal copy of **@zumer/snapdom 3.2.0**, licensed under MIT.

- Upstream project: https://github.com/zumerlab/snapdom
- Source distribution: https://registry.npmjs.org/@zumer/snapdom/-/snapdom-3.2.0.tgz
- Included component: `dist/engine/vendor/snapdom.mjs`
- Original copyright and permission notice: `dist/engine/vendor/LICENSE`
- Exact source and generated-file hashes, version and modification record: `dist/engine/vendor/provenance.json`

Comins modifies three functions in this fixed distribution to inject a call-owned shallow clone factory and prepared image lookup for CSS background/mask and pseudo content. This is a Comins modification, not an upstream API or an upstream endorsement. Other acquisition paths require separate integration and verification.

The original package remains a separately installed dependency for the existing development adapter and build input. TypeScript is a development tool and is not copied into the runtime component.
