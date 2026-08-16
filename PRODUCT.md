# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Car owners in Khartoum, Sudan who book car wash services, register/login via OTP, track loyalty points, and manage a wallet/balance. This is the customer-facing counterpart to the separate `Rasha-Staff` app that staff use to run operations.

## Product Purpose

Rasha's customer app lets car owners book a wash online, pay/track balance via a wallet, and earn loyalty rewards, with account/settings management. It is one of two Rasha codebases: this one is customer-facing; staff operations live entirely in the separate `Rasha-Staff` project (its own app/subdomain, not a route here).

## Positioning

Operational efficiency for staff remains the core differentiator for the Rasha product as a whole — the fact that staff operations warrant their own dedicated app (`Rasha-Staff`) rather than an admin route bolted onto the customer app is itself evidence of that investment. This customer app's job is to be a clean, low-friction booking/loyalty surface that doesn't have to carry staff-ops complexity.

## Operating Context

- Customer-facing routes: `/`, `/book`, `/confirmation`, `/register`, `/login`, `/loyalty`, `/wallet`, `/settings`, `/contact`, `/privacy`, `/terms`, `/forgot-password`, `/reset-password`.
- Logged-in customers are redirected from `/` straight to `/loyalty` (see `App.jsx`).
- OTP-based login/registration (`OtpInput` component), plus forgot/reset password flow.
- Market: Khartoum, Sudan. UI language: Arabic + English (bilingual).
- Staff never operate inside this app — they use the separate `Rasha-Staff` project.

## Capabilities and Constraints

- React 19 + Vite + Tailwind CSS + react-router-dom.
- Loyalty points program (`/loyalty`) and a customer wallet/balance feature (`/wallet`).
- Light/dark theme toggle is a real, ongoing feature (`AppShell` theme state, full light+dark CSS custom-property token sets in `index.css`).
- Toast notifications, mobile bottom nav, glassmorphism component classes (`.glass`, `.glass-high`, `.glass-popup`).
- Global app state via `AppContext`.

## Brand Commitments

Name: Rasha.

## Product Principles

1. Staff operational efficiency is a first-class product priority, expressed as its own dedicated app rather than a secondary admin panel.
2. Booking, loyalty, and wallet flows must stay simple and fast (OTP login, minimal friction) for customers in Khartoum.
3. Bilingual (Arabic/English) support and light/dark theming are durable, ongoing product facts, not afterthoughts.
