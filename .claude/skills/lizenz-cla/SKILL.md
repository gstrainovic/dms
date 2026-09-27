---
name: lizenz-cla
description: Lizenz (AGPL-3.0-only), Abhängigkeitslizenzen und CLA-Prüfung per GitHub Action in dms. Laden bei neuen Abhängigkeiten, fremden Beiträgen/PRs, Änderungen an .github/workflows/cla.yml, CLA.md oder der Branch Protection.
---

# Lizenz und CLA

- AGPL-3.0-only für das gesamte Repo, `LICENSE` ist der offizielle Text von gnu.org.
- Alle Abhängigkeiten sind permissiv (MIT, Apache 2.0, ISC, BSD) oder MPL 2.0 (nur lightningcss als Build-Tool), kein GPL/AGPL im Baum. Neue Abhängigkeiten auf ihre Lizenz prüfen.
- CLA in `CLA.md`, Signaturen in `CLA_SIGNATURES.md`, Prüfung per `.github/workflows/cla.yml` mit actions/github-script. Eigene Lösung, weil das contributor-assistant GitHub Action archiviert ist und cla-assistant.io extern bei SAP/Azure speichert.
- Die Branch Protection für `main` verlangt den Status-Check `cla` (Job-Name aus `cla.yml`, App GitHub Actions). Admins sind ausgenommen, direkte Pushes des Inhabers auf `main` gehen weiter. Wer den Job umbenennt, muss den Check in der Branch Protection nachziehen, sonst wartet jeder PR auf einen Check, der nie kommt.
- Der CLA-Text ist nicht juristisch geprüft. Vor dem ersten fremden Beitrag anwaltlich prüfen lassen, vor allem die Relizenzierungsklausel.
