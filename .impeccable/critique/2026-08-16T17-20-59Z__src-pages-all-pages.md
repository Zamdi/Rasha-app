---
target: all pages (src/pages)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-16T17-20-59Z
slug: src-pages-all-pages
---
# Rasha Customer App — All Pages Critique

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Settings saveProfile silently console.errors on failure. |
| 2 | Match System / Real World | 4 | SDG currency, Khartoum branch, WhatsApp, staff-mediated top-up. |
| 3 | User Control and Freedom | 3 | No edit-email escape once on OTP step. |
| 4 | Consistency and Standards | 3 | Wallet/Settings drift into flat dashboard styling. |
| 5 | Error Prevention | 3 | Booking validation solid; Register 409 handling is a strength. |
| 6 | Recognition Rather Than Recall | 3 | Booking step indicator and review screen strong. |
| 7 | Flexibility and Efficiency | 2 | No saved vehicle profiles for returning customers. |
| 8 | Aesthetic and Minimalist Design | 3 | Settings crams 5+ concerns into one scroll. |
| 9 | Error Recovery | 3 | Toasts specific/bilingual; Settings silent failure is the exception. |
| 10 | Help and Documentation | 2 | No inline help in Booking/Wallet. |
| Total | | 29/40 | Good (73%) |

## Design Specificity Verdict
Home/Booking/Register/Confirmation show real authorship (RTL-mirrored hero, Khartoum specifics, loyalty mechanic). Wallet/Settings read as generic fintech dashboard with Rasha vocabulary pasted on (database icon on balance card). Detector: exit 2, 103 findings (83 color, 9 radius, 5 bounce-easing, 4 layout-transition). Font swap to Space Grotesk/IBM Plex Sans confirmed clean, not flagged. Light-mode hero fix confirmed holding; same bug confirmed present in dark mode (verified independently via computed styles). RTL toggle works; 2 hardcoded English labels found (Home.jsx:116,146). 404 page works. Contact form toast behavior inconclusive in both assessments.

## Priority Issues
- [P1] Language choice doesn't persist across reloads (AppContext.jsx:5-9) -> /impeccable harden
- [P1] Dead UI + off-brand database icon on Wallet (Wallet.jsx:7,91,171-219) -> /impeccable audit, /impeccable polish
- [P2] Dark-mode hero-to-services seam, same bug as light-mode fix but unverified symmetrically -> /impeccable harden
- [P2] No bridge from insufficient-wallet-balance to top-up instructions at payment moment -> /impeccable clarify
- [P3] OTP flows have no in-place recovery for mistyped email/phone -> /impeccable clarify

## Persona Red Flags
Jordan: defaults to English regardless of device language, no navigator.language check.
Sam: OtpInput six unlabeled digit inputs, no aria-label.
Casey: Settings crop modal fixed 220px circle, no zoom-reset/center affordance.

## Minor Observations
Hardcoded #22c55e success green not in DESIGN.md; index.css:402 mixed-case hex typo #bDb0ee; PDF receipt hardcodes light-mode teal in dark mode; Home's giant wordmark footer doesn't repeat elsewhere; Wallet empty-state well done.

## Questions to Consider
1. Why do Wallet/Settings default to generic dashboard chrome instead of Tidal Glass vocabulary?
2. Is English-default defensible for a Khartoum-first bilingual product?
3. Is account-required booking a deliberate loyalty lock-in or worth reconsidering for guest checkout?
