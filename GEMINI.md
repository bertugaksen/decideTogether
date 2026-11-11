<!-- GSD:project-start source:PROJECT.md -->

## Project

**DecideTogether**

DecideTogether, çiftlerin ve arkadaşların "Ne yesek?" kararsızlığını ve seçim felcini (choice paralysis) 10 saniyelik eğlenceli bir oyuna dönüştüren mobil-web uygulamasıdır. Kullanıcılar üye olmadan 4 haneli PIN veya tek tık WhatsApp linkiyle odaya katılır; Google Places API ile çekilen civardaki gerçek mekanları bağımsız kaydırır; ortak ilk "Sağ" kaydırmada eşleşip anında yol tarifi veya sipariş linkine ulaşır. Deste biterse karar 5 saniyelik "Rapid Tapper" (Parmak Güreşi) düellosuyla verilir.

**Core Value:** İki insanın sıfır sürtünmeyle (uygulama indirmeden / kayıt olmadan) 10 saniye içinde ortak bir yemek kararına varması veya beraberlikte tek telefondan/online eğlenceli bir düelloyla kazananı belirlemesi.

### Constraints

- **Platform**: Mobil Web (PWA) — İndirme bariyeri olmaksızın mobil tarayıcılarda tam ekran ve akıcı çalışmalı.
- **Performans**: Eşleşme ve WebSocket gecikmesi <100ms olmalı.
- **Bütçe**: Sıfır altyapı maliyeti (Vercel/Railway ücretsiz host + Google Cloud ücretsiz kota).
- **Zaman Sınırı**: Bir karar oturumu maksimum 60 saniyede tamamlanmalı.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
