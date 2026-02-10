import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Erzeugt ein einzigartiges PNG indem ein zufälliger tEXt-Chunk vor dem IEND eingefügt wird
function makeUniquePng(): Uint8Array {
  // Minimales 1x1 weißes PNG ohne IEND
  const pngPrefix = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
  ]);
  // Zufällige Bytes für Einzigartigkeit
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  // IEND-Chunk
  const iend = new Uint8Array([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const result = new Uint8Array(
    pngPrefix.length + randomBytes.length + iend.length,
  );
  result.set(pngPrefix);
  result.set(randomBytes, pngPrefix.length);
  result.set(iend, pngPrefix.length + randomBytes.length);
  return result;
}

async function callFunction(
  name: string,
  body: any,
  authKey = ANON_KEY_HEADER,
): Promise<Response> {
  return fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authKey}`,
    },
    body: JSON.stringify(body),
  });
}

const ANON_KEY_HEADER = SUPABASE_ANON_KEY;

async function uploadFile(file: Blob, filename: string): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file, filename);

  return fetch(`${FUNCTIONS_URL}/upload-document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ANON_KEY_HEADER}`,
    },
    body: formData,
  });
}

function waitMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStatus(
  supabase: SupabaseClient,
  docId: string,
  targetStatus: string | string[],
  timeoutMs = 30000,
): Promise<string> {
  const targets = Array.isArray(targetStatus) ? targetStatus : [targetStatus];
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase
      .from("documents")
      .select("status")
      .eq("id", docId)
      .single();
    if (data && targets.includes(data.status)) return data.status;
    if (data?.status === "error") return "error";
    await waitMs(1000);
  }
  throw new Error(
    `Timeout: Status ${targets.join("|")} nicht erreicht nach ${timeoutMs}ms`,
  );
}

describe("Edge Functions Integration", () => {
  let supabase: SupabaseClient;
  const cleanupDocIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  });

  afterAll(async () => {
    for (const id of cleanupDocIds) {
      await supabase.from("document_embeddings").delete().eq("document_id", id);
      await supabase.from("document_fields").delete().eq("document_id", id);
      await supabase.from("document_tags").delete().eq("document_id", id);
      const { data: doc } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("id", id)
        .single();
      if (doc?.storage_path) {
        await supabase.storage.from("documents").remove([doc.storage_path]);
      }
      await supabase.from("documents").delete().eq("id", id);
    }
  });

  // --- Tier 1: upload-document ---

  describe("upload-document", () => {
    it("lädt PNG-Datei hoch und gibt ID + Status zurück", async () => {
      const file = new Blob([makeUniquePng()], { type: "image/png" });
      const res = await uploadFile(file, `test-${Date.now()}.png`);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(data.status).toBe("uploaded");
      cleanupDocIds.push(data.id);
    }, 15000);

    it("gibt 400 zurück wenn keine Datei mitgeschickt wird", async () => {
      const res = await fetch(`${FUNCTIONS_URL}/upload-document`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ANON_KEY_HEADER}`,
          "Content-Type": "multipart/form-data; boundary=---",
        },
        body: '-----\r\nContent-Disposition: form-data; name="empty"\r\n\r\n\r\n-------\r\n',
      });

      expect([400, 500]).toContain(res.status);
      const data = await res.json();
      expect(data.error).toBeDefined();
    }, 15000);

    it("erkennt SHA-256 Duplikate", async () => {
      const uniquePng = makeUniquePng();
      const file = new Blob([uniquePng], { type: "image/png" });
      const filename = `dup-test-${Date.now()}.png`;

      // Erster Upload
      const res1 = await uploadFile(file, filename);
      expect(res1.status).toBe(201);
      const data1 = await res1.json();
      cleanupDocIds.push(data1.id);

      // Zweiter Upload (gleicher Inhalt)
      const file2 = new Blob([uniquePng], { type: "image/png" });
      const res2 = await uploadFile(file2, filename);
      expect(res2.status).toBe(409);
      const data2 = await res2.json();
      expect(data2.existingId).toBe(data1.id);
    }, 15000);

    it("Dokument existiert in DB nach Upload", async () => {
      const file = new Blob([makeUniquePng()], { type: "image/png" });
      const res = await uploadFile(file, `db-check-${Date.now()}.png`);
      const { id } = await res.json();
      cleanupDocIds.push(id);

      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      expect(doc).not.toBeNull();
      expect(doc!.mime_type).toBe("image/png");
      expect(doc!.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(doc!.storage_path).toMatch(/^documents\/[0-9a-f]{64}\/.+/);
    }, 15000);

    it("Datei existiert in Storage nach Upload", async () => {
      const file = new Blob([makeUniquePng()], { type: "image/png" });
      const res = await uploadFile(file, `storage-check-${Date.now()}.png`);
      const { id } = await res.json();
      cleanupDocIds.push(id);

      const { data: doc } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("id", id)
        .single();

      const { data: fileData, error: dlError } = await supabase.storage
        .from("documents")
        .download(doc!.storage_path);

      expect(dlError).toBeNull();
      expect(fileData).not.toBeNull();
      expect(fileData!.size).toBeGreaterThan(0);
    }, 15000);
  });

  // --- Tier 2: Mistral-Pipeline ---

  describe("Mistral-Pipeline (OCR → Extract → Embed)", () => {
    let pipelineDocId: string;

    it("komplette Pipeline: Upload → OCR → Extract → Embed → ready", async () => {
      // Upload via Edge Function
      const file = new Blob([makeUniquePng()], { type: "image/png" });
      const uploadRes = await uploadFile(file, `pipeline-test-${Date.now()}.png`);
      const { id } = await uploadRes.json();
      pipelineDocId = id;
      cleanupDocIds.push(id);

      // Warte auf vollständige Pipeline
      const status = await waitForStatus(
        supabase,
        id,
        ["ready"],
        60000,
      );

      // Bei error: Fehlermeldung als Assertion-Message ausgeben
      if (status === "error") {
        const { data: errDoc } = await supabase
          .from("documents")
          .select("error_message")
          .eq("id", id)
          .single();
        expect.fail(`Pipeline stoppte mit error: ${errDoc?.error_message}`);
      }

      expect(status).toBe("ready");

      // OCR-Text muss vorhanden sein
      const { data: doc } = await supabase
        .from("documents")
        .select("ocr_text, title, document_type, status")
        .eq("id", id)
        .single();

      expect(doc!.status).toBe("ready");
      expect(doc!.ocr_text).toBeTruthy();
      expect(doc!.title).toBeTruthy();
      expect(doc!.document_type).toBeTruthy();

      // Tags müssen von AI erstellt worden sein
      const { data: tags } = await supabase
        .from("document_tags")
        .select("source, tags(name)")
        .eq("document_id", id);

      expect(tags!.length).toBeGreaterThan(0);
      expect(tags![0].source).toBe("ai");

      // Embeddings müssen existieren
      const { data: embeddings } = await supabase
        .from("document_embeddings")
        .select("chunk_index, chunk_text")
        .eq("document_id", id)
        .order("chunk_index");

      expect(embeddings!.length).toBeGreaterThan(0);
      expect(embeddings![0].chunk_index).toBe(0);
      expect(embeddings![0].chunk_text).toMatch(/\S/);
    }, 65000);
  });

  // --- Tier 2: PDF lokale Text-Extraktion ---

  describe("PDF lokale Text-Extraktion", () => {
    it("extrahiert Text aus digitalem PDF ohne Mistral OCR", async () => {
      const pdfPath = resolve(
        __dirname,
        "../../../../e2e/fixtures/test-arztbrief.pdf",
      );
      const pdfBuffer = readFileSync(pdfPath);
      const file = new Blob([pdfBuffer], { type: "application/pdf" });

      const res = await uploadFile(file, `pdf-local-${Date.now()}.pdf`);
      expect(res.status).toBe(201);
      const { id } = await res.json();
      cleanupDocIds.push(id);

      // Pipeline muss komplett durchlaufen
      const status = await waitForStatus(supabase, id, ["ready"], 60000);

      if (status === "error") {
        const { data: errDoc } = await supabase
          .from("documents")
          .select("error_message")
          .eq("id", id)
          .single();
        expect.fail(`Pipeline stoppte mit error: ${errDoc?.error_message}`);
      }

      expect(status).toBe("ready");

      const { data: doc } = await supabase
        .from("documents")
        .select("ocr_text, page_count, mime_type, title, document_type")
        .eq("id", id)
        .single();

      expect(doc!.mime_type).toBe("application/pdf");
      expect(doc!.ocr_text).toBeTruthy();
      expect(doc!.ocr_text!.length).toBeGreaterThan(50);
      expect(doc!.page_count).toBeGreaterThan(0);
      expect(doc!.title).toBeTruthy();
      expect(doc!.document_type).toBeTruthy();
    }, 35000);
  });

  // --- Tier 2: Search + Chat Edge Functions ---

  describe("search Edge Function", () => {
    it("liefert Ergebnisse für gültige Query", async () => {
      // Zuerst Seed-Daten anlegen mit Embeddings
      const { data: doc } = await supabase
        .from("documents")
        .insert({
          original_filename: "search-ef-test.pdf",
          mime_type: "application/pdf",
          file_size: 1024,
          storage_path: `documents/search-ef-${Date.now()}/test.pdf`,
          sha256: `search-ef-${Date.now()}`,
          status: "ready",
          title: "Testrechnung Elektrizität",
          ocr_text:
            "Stromrechnung der Stadtwerke. Betrag: 150 Euro. Kundennummer: 12345.",
          document_type: "invoice",
        })
        .select("id")
        .single();

      cleanupDocIds.push(doc!.id);

      const res = await callFunction("search", { query: "Stromrechnung" });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.results).toBeInstanceOf(Array);
    }, 30000);

    it("gibt 400 für leeren Query zurück", async () => {
      const res = await callFunction("search", { query: "" });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("Query");
    }, 15000);
  });

  describe("chat Edge Function", () => {
    it("gibt Antwort mit Sources zurück", async () => {
      const res = await callFunction("chat", {
        message: "Was steht in meinen Dokumenten?",
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.reply).toBe("string");
      expect(data.reply.length).toBeGreaterThan(0);
      expect(data.sources).toBeInstanceOf(Array);
    }, 30000);

    it("gibt 400 für leere Nachricht zurück", async () => {
      const res = await callFunction("chat", { message: "" });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("Nachricht");
    }, 15000);
  });

  // --- Validierungstests ---

  describe("Validierung", () => {
    it("process-ocr gibt Fehler für ungültige documentId", async () => {
      const res = await callFunction("process-ocr", {
        documentId: "00000000-0000-0000-0000-000000000000",
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(typeof data.error).toBe("string");
      expect(data.error.length).toBeGreaterThan(0);
    }, 15000);

    it("extract-data gibt Fehler für fehlende documentId", async () => {
      const res = await callFunction("extract-data", {});
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data.error).toContain("documentId");
    }, 15000);

    it("generate-embed gibt Fehler für fehlende documentId", async () => {
      const res = await callFunction("generate-embed", {});
      expect(res.status).toBe(500);

      const data = await res.json();
      expect(data.error).toContain("documentId");
    }, 15000);
  });
});
