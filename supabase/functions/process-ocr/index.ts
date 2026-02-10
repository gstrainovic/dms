import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  definePDFJSModule,
  extractText,
  getDocumentProxy,
} from "https://esm.sh/unpdf";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Nächste Pipeline-Stufe triggern mit Fehlerbehandlung */
function triggerNext(url: string, documentId: string, supabase: SupabaseClient) {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ documentId }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.text().catch(() => "unknown");
        throw new Error(`${url} antwortete mit ${res.status}: ${body}`);
      }
    })
    .catch(async (err) => {
      console.error(`Pipeline-Trigger fehlgeschlagen: ${err.message}`);
      await supabase
        .from("documents")
        .update({ status: "error", error_message: `Pipeline-Trigger fehlgeschlagen: ${err.message}` })
        .eq("id", documentId);
    });
}

// Minimale Zeichenzahl pro Seite (Durchschnitt), ab der lokaler Text als ausreichend gilt
const MIN_CHARS_PER_PAGE = 50;

interface OcrPage {
  markdown?: string;
  tables?: { id: string; content: string }[];
}

function processPages(rawPages: OcrPage[]): string[] {
  return rawPages.map((p) => {
    let md = p.markdown || "";
    if (p.tables?.length) {
      for (const tbl of p.tables) {
        md = md.replace(`[${tbl.id}](${tbl.id})`, tbl.content);
      }
    }
    return md;
  });
}

/**
 * Versucht Text lokal aus einem PDF zu extrahieren (ohne Mistral API).
 * Gibt null zurück wenn der Text nicht ausreicht (z.B. bei gescannten PDFs).
 */
async function tryLocalPdfExtraction(
  buffer: ArrayBuffer,
): Promise<{ text: string; pageCount: number } | null> {
  try {
    await definePDFJSModule(() => import("https://esm.sh/unpdf/pdfjs"));

    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });

    // Qualitätsprüfung: genug Text pro Seite?
    const pageTexts = text as string[];
    const totalChars = pageTexts.reduce((sum, t) => sum + t.trim().length, 0);
    const avgCharsPerPage = totalPages > 0 ? totalChars / totalPages : 0;

    await pdf.destroy();

    if (avgCharsPerPage >= MIN_CHARS_PER_PAGE) {
      return {
        text: pageTexts.join("\n\n"),
        pageCount: totalPages,
      };
    }

    return null;
  } catch (error) {
    console.warn(
      "Lokale PDF-Extraktion fehlgeschlagen, Fallback auf Mistral OCR:",
      error.message,
    );
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const mistralKey = Deno.env.get("MISTRAL_API_KEY");
  if (!mistralKey) {
    return new Response(
      JSON.stringify({ error: "MISTRAL_API_KEY ist nicht konfiguriert" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let documentId: string | null = null;

  try {
    const body = await req.json();
    documentId = body.documentId;

    if (!documentId) throw new Error("documentId fehlt");

    // Status auf "processing" setzen
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Dokument laden
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (!doc) throw new Error("Dokument nicht gefunden");

    // Datei aus Storage laden
    const { data: fileData } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (!fileData) throw new Error("Datei nicht gefunden");

    const buffer = await fileData.arrayBuffer();

    let ocrText: string;
    let pageCount: number;
    const isPdf = doc.mime_type === "application/pdf";

    // PDF: Zuerst lokale Text-Extraktion versuchen
    if (isPdf) {
      const localResult = await tryLocalPdfExtraction(buffer);
      if (localResult) {
        ocrText = localResult.text;
        pageCount = localResult.pageCount;
        console.log(
          `PDF-Text lokal extrahiert: ${pageCount} Seiten, ${ocrText.length} Zeichen`,
        );
      } else {
        // Fallback: Mistral OCR für gescannte PDFs
        console.log("Lokaler Text unzureichend, sende an Mistral OCR...");
        const result = await callMistralOcr(buffer, doc.mime_type, mistralKey);
        ocrText = result.text;
        pageCount = result.pageCount;
      }
    } else {
      // Bilder: immer Mistral OCR
      const result = await callMistralOcr(buffer, doc.mime_type, mistralKey);
      ocrText = result.text;
      pageCount = result.pageCount;
    }

    // OCR-Text speichern
    await supabase
      .from("documents")
      .update({
        ocr_text: ocrText,
        page_count: pageCount,
        status: "ocr_done",
      })
      .eq("id", documentId);

    // Trigger extract-data mit Fehlerbehandlung
    const extractUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/extract-data`;
    triggerNext(extractUrl, documentId, supabase);

    return new Response(JSON.stringify({ status: "ocr_done", pageCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (documentId) {
      await supabase
        .from("documents")
        .update({ status: "error", error_message: error.message })
        .eq("id", documentId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/** Mistral OCR API aufrufen (für gescannte PDFs und Bilder) */
async function callMistralOcr(
  buffer: ArrayBuffer,
  mimeType: string,
  apiKey: string,
): Promise<{ text: string; pageCount: number }> {
  const uint8 = new Uint8Array(buffer);

  // Base64-Encoding in Chunks (vermeidet Stack Overflow bei großen Dateien)
  // chunkSize MUSS durch 3 teilbar sein, sonst fügt btoa Padding (=) mitten im String ein
  let base64 = "";
  const chunkSize = 32766;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    base64 += btoa(String.fromCharCode(...uint8.subarray(i, i + chunkSize)));
  }

  const isPdf = mimeType === "application/pdf";
  const ocrPayload = isPdf
    ? {
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          document_url: `data:application/pdf;base64,${base64}`,
        },
        table_format: "markdown",
      }
    : {
        model: "mistral-ocr-latest",
        document: {
          type: "image_url",
          image_url: `data:${mimeType};base64,${base64}`,
        },
        table_format: "markdown",
      };

  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(ocrPayload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral OCR failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const pages = processPages(data.pages || []);

  return {
    text: pages.join("\n\n"),
    pageCount: pages.length,
  };
}
