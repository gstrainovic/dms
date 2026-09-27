# Evaluation bestehender Open-Source-Lösungen

Geprüft gegen die fünf Pflicht-Anforderungen aus `AGENTS.md`: Upload mit Archiv, Mistral OCR, Auto-Tagging,
Volltextsuche + Chat/RAG, **eine** Oberfläche. Zweimal geprüft: am 08.02.2026 vor dem Eigenbau und am 27.09.2026.

## Fazit

Kein Projekt erfüllt alle fünf in einer Oberfläche. Am nächsten kommen:

- **Paperless-ngx 3 + paperless-gpt:** alles ausser einer Oberfläche. Paperless-ngx hat seit 3.0 (22.07.2026)
  KI-Vorschläge und einen Chat über die Dokumente, OCR in der Cloud aber nur über Azure. Mistral OCR und
  automatisches Tagging beim Einlesen bringt paperless-gpt als zweites Programm mit eigener Oberfläche.
- **Papra:** Mistral OCR und LLM-Tagging seit 26.6.0 (02.07.2026), eine Oberfläche, aber kein Chat/RAG.

## Warum im Februar 2026 selbst gebaut wurde

Ausschlaggebend war die eine Oberfläche. Paperless-ngx 2.20 hatte weder KI noch Chat. Die nächste Kombination
waren drei Programme: Paperless-ngx als Archiv, paperless-gpt für Mistral OCR und Tagging, paperless-ai für den
RAG-Chat, jedes mit eigener Oberfläche.

Die Tabelle vom Februar führte bei paperless-gpt nur «LLM-Vision» als OCR. Mistral OCR kann es aber seit 05.05.2025
(`OCR_PROVIDER=mistral_ocr`). Am Entscheid ändert das nichts, weil der Chat fehlte. paperless-ai fehlte in der
Tabelle ganz.

## Stand 27.09.2026

| Projekt | Mistral OCR | Auto-Tag | Volltext | RAG/Chat | Ergebnis |
|---|---|---|---|---|---|
| [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) 3.2 | Nein (Tesseract lokal, Remote-OCR nur Azure) | LLM-Vorschläge beim Öffnen | Ja | Ja, seit 3.0 | Ohne Mistral OCR |
| [paperless-gpt](https://github.com/icereed/paperless-gpt) 0.28 | Ja | Ja, automatisch | Via Paperless | Nein | Zweites Programm neben Paperless |
| [paperless-ai](https://github.com/clusterzx/paperless-ai) 3.0.9 | Nein | Ja | Via Paperless | Ja | Laut README nicht mehr gepflegt |
| [Papra](https://github.com/papra-hq/papra) 26.6 | Ja | LLM | Ja | Nein | Kein RAG/Chat |
| [Mayan EDMS](https://gitlab.com/mayan-edms/mayan-edms) 4.12 | Steckbares Backend | LLM über Workflows | Ja | Kein Chat für Endnutzer | ~40-60h Anpassung |
| [kotaemon](https://github.com/Cinnamon/kotaemon) 0.12 | Nein (PaddleOCR lokal) | Nein | Hybrid | Ja | Kein Archiv, kein Tagging |
| [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | Nein | Nein | Nein | Ja | Nur RAG |
| [RAGFlow](https://github.com/infiniflow/ragflow) 0.27 | Ja, seit 0.27.0 | Chunk-Tags | Hybrid | Ja | Kein DMS-Archiv, braucht 16 GB RAM |
| [Open WebUI](https://github.com/open-webui/open-webui) | Ja | Nur Chats | — | Ja | Kein DMS-Archiv |
| [Dify](https://github.com/langgenius/dify) | Plugin | Nein | — | Ja | Kein DMS |
| [private-gpt](https://github.com/zylon-ai/private-gpt) 1.0 | Nein | Nein | — | API | API-Plattform, kein DMS |
| [Papermerge Core](https://github.com/papermerge/papermerge-core) | Worker-Fork | Regeln | Solr | Nein | Kein RAG, sucht Maintainer |
| [Docspell](https://github.com/eikek/docspell) | Workaround | ML (Stanford) | SOLR | Nein | Kein RAG, 3-5 GB, letztes Release 03/2025 |
| [Teedy](https://github.com/sismics/docs) | Nein | Nein | Ja | Nein | Kein Tagging/RAG, letztes Release 2023 |
| [PdfDing](https://codeberg.org/mrmn/PdfDing) | Nein | Nein | Nein | Nein | Nur PDFs |
| [OCA/dms](https://github.com/OCA/dms) | Nein | Regex | Schwach | Nein | Braucht Odoo |
| [CKAN](https://github.com/ckan/ckan) | Custom Ext. | Nein | Solr | Nein | Datenkatalog, kein DMS |
| [RAG-Anything](https://github.com/HKUDS/RAG-Anything) | Nein | Nein | Indirekt | Ja | Framework ohne UI |

Ausgeschieden: OpenKM verteilt die Community Edition ab 7.0 ohne Quellcode, Lodestone ist seit 2021 still.

## Lokale OCR-Tools — nicht nutzbar (Hardware)

| Projekt | Warum nicht? |
|---|---|
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Braucht viel RAM/GPU |
| [MinerU](https://github.com/opendatalab/MinerU) | 16-32 GB RAM |
| [Docling](https://github.com/docling-project/docling) | 3-4 GB RAM Spitzen |
| [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | Nur Preprocessing |

## Andere Kategorie

| Tool | Warum nicht? |
|---|---|
| Seafile, Filestash | File Sync bzw. File Platform, kein OCR/Tagging |
| TagStudio | Desktop-App, kein RAG/Web |
| ArchiveBox | Web-Archivierung, kein Dokumenten-DMS |
| Odoo, ERPNext | ERP ohne DMS-Modul in der Community-Fassung, kein RAG |
| NocoBase | RAG kostenpflichtig, kein OCR |
| Pimcore, UnoPIM | Produktdaten, kein DMS |
