import { annotations } from "../data/seed";

export type AiProvider = {
  providerName: string;
  createReadingSummary(input: { lensName: string }): Promise<{
    summary: string;
    annotations: typeof annotations;
  }>;
  draftLens(input: { text: string }): Promise<LensDraft>;
};

export type LensDraft = {
    name: string;
    englishName: string;
    category: "CUSTOM";
    color: string;
    description: string;
    prompt: string;
};

export function createMockAiProvider(): AiProvider {
  return {
    providerName: "mock",
    async createReadingSummary(input) {
      return {
        summary: `${input.lensName}视角下，普通现场显露出另一层秩序。`,
        annotations
      };
    },
    async draftLens(input) {
      return {
        name: input.text.includes("考古") ? "城市考古者" : "私人观察者",
        englishName: input.text.includes("考古") ? "URBAN ARCHAEOLOGIST" : "PRIVATE OBSERVER",
        category: "CUSTOM",
        color: "#F0997B",
        description: input.text.includes("考古") ? "把街道、招牌和裂缝看成未来遗址" : "以私人经验重新整理日常现场",
        prompt: `以用户描述的视角解读画面：${input.text}`
      };
    }
  };
}

export function createOpenAiCompatibleProvider(input: { apiKey?: string; baseUrl: string; model: string }): AiProvider {
  if (!input.apiKey) return createMockAiProvider();

  async function completeJson<T>(prompt: string, fallback: T): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${input.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: input.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are the Prism backend AI adapter. Return compact JSON only." },
            { role: "user", content: prompt }
          ]
        })
      });
    } catch {
      return fallback;
    }

    if (!response.ok) return fallback;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback;

    try {
      return JSON.parse(content) as T;
    } catch {
      return fallback;
    }
  }

  return {
    providerName: "openai-compatible",
    async createReadingSummary(readingInput) {
      return completeJson(
        `Create a Chinese worldview-lens reading for lens "${readingInput.lensName}". JSON schema: {"summary": string}.`,
        { summary: `${readingInput.lensName}视角下，普通现场显露出另一层秩序。`, annotations }
      ).then((result) => ({ ...result, annotations }));
    },
    async draftLens(draftInput) {
      return completeJson<LensDraft>(
        `Create a custom lens from this Chinese user idea: ${draftInput.text}. JSON schema: {"name": string, "englishName": string, "category": "CUSTOM", "color": "#RRGGBB", "description": string, "prompt": string}.`,
        {
          name: "私人观察者",
          englishName: "PRIVATE OBSERVER",
          category: "CUSTOM",
          color: "#F0997B",
          description: "以私人经验重新整理日常现场",
          prompt: `以用户描述的视角解读画面：${draftInput.text}`
        }
      );
    }
  };
}

export function createAiProvider(input: { provider: "mock" | "openai-compatible"; apiKey?: string; baseUrl: string; model: string }) {
  if (input.provider === "openai-compatible") return createOpenAiCompatibleProvider(input);
  return createMockAiProvider();
}
