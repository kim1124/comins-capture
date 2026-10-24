# Third-party notices

Comins Capture includes a modified internal copy of **@zumer/snapdom 3.2.0**, licensed under MIT.

- Upstream project: https://github.com/zumerlab/snapdom
- Source distribution: https://registry.npmjs.org/@zumer/snapdom/-/snapdom-3.2.0.tgz
- Included component: `dist/engine/vendor/snapdom.mjs`
- Original copyright and permission notice: `dist/engine/vendor/LICENSE`
- Exact source and generated-file hashes, version and modification record: `dist/engine/vendor/provenance.json`

Comins modifies five functions in this fixed distribution to inject a call-owned shallow clone factory and prepared image lookup for CSS background/mask and pseudo content, to disable Material icon rasterization that would independently acquire fonts, and to collect vendor scrollbar/meter/progress/slider CSS per capture against its original inspected nodes instead of using a document-global CSS cache. Only definitely unrelated rules are excluded; mixed and unknown selectors retain the original rule. The adapter also disables stock image compression to preserve prepared resource bytes. This is a Comins modification, not an upstream API or an upstream endorsement. Other acquisition paths require adapter restrictions and verification.

The original package remains a separately installed dependency for the existing development adapter and build input. TypeScript is a development tool and is not copied into the runtime component.
