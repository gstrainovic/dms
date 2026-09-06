# Mitwirken

Danke, dass du DMS verbessern willst. Kurz das Wichtigste:

## 1. Contributor License Agreement

Vor dem ersten Beitrag musst du das [CLA](./CLA.md) akzeptieren. Das geht ohne externe Dienste: Trage dich in [`CLA_SIGNATURES.md`](./CLA_SIGNATURES.md) ein und committe die Zeile mit in deinen ersten Pull Request. Der Workflow «CLA Check» prüft bei jedem Pull Request, ob der Autor eingetragen ist, und blockiert sonst das Mergen.

Warum ein CLA? DMS ist AGPL-3.0. Damit das Projekt zusätzlich unter kommerziellen Bedingungen an Geschäftskunden lizenziert werden kann, braucht der Projektinhaber von allen Beitragenden das Recht dazu. Du behältst alle Rechte an deinem Code.

## 2. Entwicklung

```bash
pnpm install
cp .env.example .env        # MISTRAL_API_KEY eintragen
pnpm dev                    # Podman, Supabase und Vite starten
pnpm test                   # Unit- und Integrationstests
pnpm test:e2e               # Playwright
```

Details zu Architektur, Pipeline und Befehlen stehen in [`CLAUDE.md`](./CLAUDE.md).

## 3. Regeln

- **Test-Driven Development:** Erst ein fehlschlagender Test, dann der Code. Kein Produktionscode ohne Test.
- **Kleine Pull Requests** mit klarer Beschreibung, was und warum.
- **Deutsch** für Oberfläche, Kommentare und Commit-Messages, technische Begriffe bleiben englisch.
- **Keine Secrets** im Repository. `.env` und `supabase/functions/.env` sind ignoriert und bleiben es.
