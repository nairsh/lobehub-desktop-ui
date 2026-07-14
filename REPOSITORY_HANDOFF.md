# Desktop Repository Handoff

Future desktop builds, releases, and updater fallback metadata now live in:

<https://github.com/nairsh/lobehub-server>

`UPDATE_SERVER_URL` remains the canonical updater feed for packaged desktop apps. When that feed is not configured, desktop builds in this repository now fall back to GitHub release metadata from `nairsh/lobehub-server`.

Do not publish new routine desktop releases from this repository. Use `lobehub-server` for combined server and desktop work, and reserve this repository for handoff fixes or emergency compatibility changes.
