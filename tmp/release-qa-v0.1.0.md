# ACE-Step Forge v0.1.0 Release QA Inventory

## Release Context

- repository: `Sunwood-ai-labs/ace-step-forge`
- release tag: `v0.1.0`
- compare range: `HEAD` (initial public release; no previous tag existed)
- requested outputs: GitHub release body, English/Japanese release notes, English/Japanese walkthrough, release header image
- release URLs: pending tag, Pages deployment, and GitHub release verification

## Claim Matrix

| claim | code refs | validation refs | docs surfaces touched | scope |
| --- | --- | --- | --- | --- |
| A completed Forge generation is retained in the shared Library and can produce a visualizer video | `acestep/api/http/library_routes.py`, `acestep/api/http/visualizer_routes.py`, `acestep/api/visualizer_service.py`, `frontend/src/components/VisualizerPanel.tsx`, `frontend/src/pages/LibraryPage.tsx` | `uv run --with pytest python -m pytest -q acestep/api/visualizer_renderer_test.py acestep/api/visualizer_service_test.py acestep/api/http/visualizer_routes_http_test.py`; prior running-app playback and 16:9/9:16 render check | `README.md`, `README.ja.md`, `docs/en/FORGE.md`, `docs/ja/FORGE.md`, `docs/en/releases/v0.1.0.md`, `docs/ja/releases/v0.1.0.md`, `docs/en/guide/articles/ace-step-forge-v0-1-0.md`, `docs/ja/guide/articles/ace-step-forge-v0-1-0.md` | shipped feature |
| The React/Vite workspace and local Streamable HTTP MCP gateway use the same generation queue | `frontend/src/lib/api.ts`, `frontend/src/lib/useWorkspace.ts`, `acestep/mcp_server.py`, `docker-compose.yml` | `npm.cmd test --prefix frontend`; `npm.cmd run build --prefix frontend`; `docker compose config --quiet` | `README.md`, `README.ja.md`, `docs/en/MCP.md`, `docs/ja/MCP.md`, `docs/en/releases/v0.1.0.md`, `docs/ja/releases/v0.1.0.md` | shipped feature |
| Forge is a first public, independent MIT fork with bilingual operator documentation | `frontend/package.json`, `LICENSE`, `docs/.vitepress/config.mts` | `npm.cmd run docs:build`; built HTML path and navigation inspection | `README.md`, `README.ja.md`, `docs/index.md`, `docs/en/index.md`, `docs/ja/index.md`, `docs/.vitepress/config.mts`, `docs/en/releases/v0.1.0.md`, `docs/ja/releases/v0.1.0.md` | release scope |

## Steady-State Docs Review

| surface | status | evidence |
| --- | --- | --- |
| `README.md` | pass | Documents the React workspace, shared Library, visualizer export, MCP gateway, and Docker quick start. |
| `README.ja.md` | pass | Japanese operator workflow and the same visualizer/MCP scope are documented. |
| `docs/en/FORGE.md` | pass | English Forge workflow covers generation, Library, visualizer formats, and local-first behavior. |
| `docs/ja/FORGE.md` | pass | Japanese Forge workflow mirrors the English feature claims. |
| `docs/en/MCP.md` | pass | English Streamable HTTP MCP setup remains the operator reference. |
| `docs/ja/MCP.md` | pass | Japanese MCP setup remains the operator reference. |
| `docs/index.md` | pass | Root docs landing page links the English/Japanese release notes and walkthrough. |
| `docs/en/index.md` | pass | English landing page links the v0.1.0 release notes and walkthrough. |
| `docs/ja/index.md` | pass | Japanese landing page links the v0.1.0 release notes and walkthrough. |
| `docs/.vitepress/config.mts` | pass | English/Japanese release notes and walkthrough are linked in nav and sidebar. |
| `docs/en/releases/v0.1.0.md` | pass | English release page is committed with the generated header and validation scope. |
| `docs/ja/releases/v0.1.0.md` | pass | Japanese release page is committed with the generated header and validation scope. |
| `docs/en/guide/articles/ace-step-forge-v0-1-0.md` | pass | English companion walkthrough covers start, generate, Library, visualizer, and MCP. |
| `docs/ja/guide/articles/ace-step-forge-v0-1-0.md` | pass | Japanese companion walkthrough covers the same operator path. |

## QA Inventory

| criterion_id | status | evidence |
| --- | --- | --- |
| compare_range | pass | `HEAD` initial-release mode was recorded because the repository had no prior tag. |
| release_claims_backed | pass | Claim matrix ties each release statement to implementation files, tests, and docs. |
| docs_release_notes | pass | `docs/en/releases/v0.1.0.md`, `docs/ja/releases/v0.1.0.md` |
| companion_walkthrough | pass | `docs/en/guide/articles/ace-step-forge-v0-1-0.md`, `docs/ja/guide/articles/ace-step-forge-v0-1-0.md` |
| operator_claims_extracted | pass | The claim matrix captures the Library, visualizer, MCP, bilingual UI, and Compose/GPU operator claims. |
| impl_sensitive_claims_verified | pass | Visualizer renderer/service/routes tests passed; frontend tests/build and Compose config passed. |
| steady_state_docs_reviewed | pass | README, Forge, MCP, index, nav/sidebar, and both new release surfaces are listed above. |
| claim_scope_precise | pass | Notes identify this as a first public `0.1` release, local-first, and an independent fork. |
| latest_release_links_updated | not_applicable | No previous release existed and the repository had no latest-release landing pointer. |
| svg_assets_validated | not_applicable | The requested release header is a committed PNG; no new SVG artwork is reused by this release. |
| docs_assets_committed_before_tag | pass | Release pages, walkthroughs, nav links, and header PNG are included in the release commit before tag creation. |
| docs_deployed_live | not_applicable | Pending the post-push GitHub Pages deployment check. |
| tag_local_remote | not_applicable | Pending creation and remote verification of `v0.1.0`. |
| github_release_verified | not_applicable | Pending publication and `gh release view` verification. |
| validation_commands_recorded | pass | Frontend tests/build, visualizer tests, Compose config, and VitePress build are recorded in the release pages and this inventory. |
| publish_date_verified | not_applicable | Pending the published GitHub release timestamp. |

## Validation Commands

```text
npm.cmd test --prefix frontend                         # 3 files, 12 tests passed
npm.cmd run build --prefix frontend                   # Vite production build passed
uv run --with pytest python -m pytest -q acestep/api/visualizer_renderer_test.py acestep/api/visualizer_service_test.py acestep/api/http/visualizer_routes_http_test.py  # 5 passed
docker compose config --quiet                         # passed
npm.cmd run docs:build                                 # VitePress build passed
```

## Notes

- blockers:
- waivers:
- follow-up docs tasks: verify the live Pages URLs and GitHub release metadata after publication, then replace pending statuses above with the observed URLs and timestamp.
