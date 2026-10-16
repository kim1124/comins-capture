# Comins Site Integration

[한국어](../ko/10-site-integration.md) · [Documentation index](../README.md)

[Comins Brand](https://comins-website.vercel.app/ko/) ·
[Capture introduction](https://comins-website.vercel.app/ko/capture/) ·
[Capture site overview](https://comins-website.vercel.app/ko/docs/capture/overview/)

The website is a separate repository and deployment. Its Capture page currently
represents a development introduction, not a published 0.0.1 package or a
guarantee that the latest repository guides are synchronized.

The implementation contract is maintained in docs/guide in this repository.
The numbered English references live in docs/user; Korean references in docs/ko
are generated from that contract. The documentation index connects both languages.

Website examples must use the package root capture/CaptureError/paperSize API.
Do not advertise crop/tiles/partial output or internal adapter imports.
After an approved release, align the module catalog, source snapshot, guides,
demo version and exact published artifact. Do not edit generated synchronization
files directly. Website modifications and deployment are separate approved work.
