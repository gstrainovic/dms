import { describe, it, expect, beforeEach, vi } from "vitest";
import { ref } from "vue";

// Mock useAuth
vi.mock("@/composables/useAuth", () => ({
  useAuth: () => ({
    user: ref({ id: "test-user-id" })
  })
}));

// Mock supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
  then: vi.fn(), // Zum Mocken von Promise-like behavior falls nötig
  functions: {
    invoke: vi.fn().mockResolvedValue({
      data: { reply: "Test-Antwort", sources: [] },
      error: null,
    }),
  },
};

// Spezielle Rückgabewerte für bestimmte Aufrufe
const setupMocks = () => {
  vi.clearAllMocks();
  
  // Default success response für die meisten Chains
  const defaultResponse = { data: [], error: null };
  
  mockSupabase.then.mockImplementation((callback) => {
    return Promise.resolve(callback(defaultResponse));
  });

  // Wir machen es einfacher: mockResolvedValue für die Endpunkte
  mockSupabase.limit.mockResolvedValue({ data: [{ id: 'session-1' }], error: null });
  mockSupabase.single.mockResolvedValue({ data: { id: 'new-id', created_at: new Date().toISOString(), content: 'test' }, error: null });
  
  // Für die Nachrichten-Liste
  // Wir müssen aufpassen, da loadLastSession zwei verschiedene Aufrufe macht
  let callCount = 0;
  mockSupabase.order.mockImplementation(() => {
    callCount++;
    if (callCount === 1) { // First order is for sessions
       return mockSupabase; // will be followed by limit()
    }
    // Second order is for messages
    return Promise.resolve({ data: [], error: null });
  });
};

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// Import NACH den Mocks
const { useChat } = await import("@/composables/useChat");

describe("Chat-Persistenz (Database)", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("speichert Nachrichten in der Datenbank nach sendMessage", async () => {
    const { sendMessage, messages } = useChat();
    await sendMessage("Hallo Test");

    expect(messages.value.length).toBe(2);
    expect(mockSupabase.from).toHaveBeenCalledWith("chat_messages");
  });

  it("clearChat löscht die Session in der Datenbank", async () => {
    const { clearChat, sendMessage } = useChat();
    await sendMessage("Test");
    await clearChat();

    expect(mockSupabase.from).toHaveBeenCalledWith("chat_sessions");
    expect(mockSupabase.delete).toHaveBeenCalled();
  });
});
