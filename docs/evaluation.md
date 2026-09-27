# Evaluation bestehender Open-Source-Lösungen

Vor dem Eigenbau wurden 30+ Tools und Plattformen gegen die fünf Pflicht-Anforderungen aus `CLAUDE.md` geprüft
(Upload mit Archiv, Mistral OCR, Auto-Tagging, Volltextsuche + Chat/RAG, ein Dashboard).
Stars und Zustand der Projekte: Stand 08.02.2026.

## Fazit

**KEINES erfüllt alle 5 Anforderungen.**

Beste Teilstücke:
- **Bestes DMS-UI:** Papermerge (Ordner, Tags, Versionierung, REST API)
- **Bestes Auto-Tagging:** Docspell (ML via Stanford NLP, lernt dazu)
- **Bestes RAG/Chat:** kotaemon (Hybrid Volltext+Vektor, Multi-Hop)
- **Mistral OCR:** Kein Tool hat es nativ — überall Custom-Code nötig

## DMS-/RAG-Projekte nach Stars

| # | Projekt | Stars | Upload | Mistral OCR | Auto-Tag | Volltext | RAG/Chat | RAM | Ergebnis |
|---|---|---|---|---|---|---|---|---|---|
| 1 | [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | 36.4K | Ja | Nein | Nein | Ja | Nein | Mittel | VERWORFEN (2 UIs) |
| 2 | [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) | 54.3K | Ja | Nein | Nein | Nein | Ja | 2 GB | VERWORFEN (nur RAG) |
| 3 | [kotaemon](https://github.com/Cinnamon/kotaemon) | 25.0K | Ja | Custom Loader | Nein | Hybrid | Ja | ~4 GB | VERWORFEN (kein Tagging) |
| 4 | [CKAN](https://github.com/ckan/ckan) | 4.9K | Datenkatalog | Custom Ext. | Nein | Solr | Alpha | 6 Container | VERWORFEN (falsches Tool) |
| 5 | [Papra](https://github.com/papra-hq/papra) | 3.8K | Ja | Nein (fest) | Regeln | Einfach | Nein | ~200 MB | VERWORFEN (zu simpel) |
| 6 | [Papermerge](https://github.com/ciur/papermerge) | 2.9K | Ja | Worker-Fork | Regeln | Solr | Nein | Leicht | VERWORFEN (kein RAG) |
| 7 | [Teedy](https://github.com/sismics/docs) | 2.4K | Ja | Nein (fest) | Nein | Ja | Nein | ~1 GB | VERWORFEN (kein Tagging/RAG) |
| 8 | [Docspell](https://github.com/eikek/docspell) | 2.2K | Ja | Workaround | ML (Stanford) | SOLR | Nein | 3-5 GB | VERWORFEN (kein RAG, zu schwer) |
| 9 | [paperless-gpt](https://github.com/icereed/paperless-gpt) | 1.9K | Addon | LLM-Vision | Ja | Via Paperless | Via Paperless | Braucht Paperless | VERWORFEN |
| 10 | [PdfDing](https://github.com/mrmn2/PdfDing) | 1.6K | Ja | Nein | Nein | Nein | Nein | Leicht | VERWORFEN (nur PDFs) |
| 11 | [OpenKM](https://github.com/openkm/document-management-system) | 827 | Ja | Java-Plugin | Nur Prof. | Lucene | Nein | 3.5 GB | VERWORFEN (Paywall, veraltet) |
| 12 | [Mayan EDMS](https://github.com/mayan-edms/Mayan-EDMS) | 775 | Ja | Custom | Regeln | Ja | Nein | Mittel | VERWORFEN (~40-60h) |
| 13 | [Lodestone](https://github.com/LodestoneHQ/lodestone) | 522 | Ja | Nein | Nein | ES | Nein | 8 Container | VERWORFEN (TOT seit 2024) |
| 14 | [Papermerge Core](https://github.com/papermerge/papermerge-core) | 436 | Ja | Worker-Fork | Regeln | Solr | Nein | Leicht | = Papermerge v3 |
| 15 | [OCA/dms](https://github.com/OCA/dms) | 150 | Via Odoo | Nein | Regex | Schwach | Nein | Odoo nötig | VERWORFEN (Overkill) |
| 16 | [RAG-Anything](https://github.com/HKUDS/RAG-Anything) | 1K+ | Nein | Nein | Nein | Indirekt | Ja | MinerU nötig | VERWORFEN (nur Framework) |

## RAG-/AI-Frameworks (getestet)

| Projekt | Stars | Ergebnis |
|---|---|---|
| [Open WebUI](https://github.com/open-webui/open-webui) | 70K+ | VERWORFEN (kein DMS-Archiv) |
| [Dify](https://github.com/langgenius/dify) | 70K+ | VERWORFEN (kein DMS) |
| [private-gpt](https://github.com/zylon-ai/private-gpt) | 57.1K | VERWORFEN (kein DMS-Archiv) |
| [RAGFlow](https://github.com/infiniflow/ragflow) | 35K+ | VERWORFEN (lokale OCR hardcoded) |

## Lokale OCR-Tools — nicht nutzbar (Hardware)

| Projekt | Stars | Warum nicht? |
|---|---|---|
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 70.4K | Braucht viel RAM/GPU |
| [MinerU](https://github.com/opendatalab/MinerU) | 54.0K | 16-32 GB RAM |
| [Docling](https://github.com/docling-project/docling) | 52.4K | 3-4 GB RAM Spitzen |
| [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | 32.5K | Nur Preprocessing |

## Weitere (andere Kategorie)

| Projekt | Stars | Warum nicht? |
|---|---|---|
| [Seafile](https://github.com/haiwen/seafile) | 14.3K | File Sync, kein OCR/Tagging |
| [Filestash](https://github.com/mickael-kerjean/filestash) | 13.5K | Universal File Platform, kein OCR |
| [TagStudio](https://github.com/TagStudioDev/TagStudio) | 6.7K | Desktop-App, kein RAG/Web |
| [ArchiveBox](https://github.com/ArchiveBox/ArchiveBox) | 26.8K | Web-Archivierung, kein Dok-DMS |

## ERP/PIM/NoCode — alle verworfen

| Tool | Typ | Warum nicht? |
|---|---|---|
| Odoo | ERP | Community kein DMS. Enterprise kostet. Kein RAG. |
| ERPNext | ERP | 10 Container. Kein DMS-Modul. Kein RAG. |
| NocoBase | No-Code | RAG ab $8.000. Kein OCR. |
| Pimcore | PIM/DAM | POCL-Lizenz. 5+ Container. Overengineered. |
| UnoPIM | PIM | Reines Produktdaten-Tool. |
