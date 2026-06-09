import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockCreateSignedUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  },
}));

import { getDocumentUrl, isPreviewable, isImage, isPdf } from "@/composables/useDocumentFile";
import { supabase } from "@/lib/supabase";

describe("useDocumentFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isImage", () => {
    it("erkennt PNG als Bild", () => {
      expect(isImage("image/png")).toBe(true);
    });

    it("erkennt JPEG als Bild", () => {
      expect(isImage("image/jpeg")).toBe(true);
    });

    it("erkennt PDF nicht als Bild", () => {
      expect(isImage("application/pdf")).toBe(false);
    });
  });

  describe("isPdf", () => {
    it("erkennt application/pdf", () => {
      expect(isPdf("application/pdf")).toBe(true);
    });

    it("erkennt image/png nicht als PDF", () => {
      expect(isPdf("image/png")).toBe(false);
    });
  });

  describe("isPreviewable", () => {
    it("Bilder sind previewable", () => {
      expect(isPreviewable("image/png")).toBe(true);
      expect(isPreviewable("image/jpeg")).toBe(true);
    });

    it("PDFs sind previewable", () => {
      expect(isPreviewable("application/pdf")).toBe(true);
    });

    it("Unbekannte Typen sind nicht previewable", () => {
      expect(isPreviewable("application/octet-stream")).toBe(false);
      expect(isPreviewable("text/plain")).toBe(false);
    });
  });

  describe("getDocumentUrl", () => {
    it("gibt signedUrl für gültigen Storage-Pfad zurück", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://storage.example.com/signed/doc123" },
        error: null,
      });

      const url = await getDocumentUrl("documents/abc123/test.png");

      expect(supabase.storage.from).toHaveBeenCalledWith("documents");
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(
        "documents/abc123/test.png",
        3600,
      );
      expect(url).toBe("https://storage.example.com/signed/doc123");
    });

    it("gibt null bei Fehler zurück", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const url = await getDocumentUrl("documents/invalid/path");
      expect(url).toBeNull();
    });

    it("gibt null bei leerem Pfad zurück", async () => {
      const url = await getDocumentUrl("");
      expect(url).toBeNull();
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });
  });
});
