interface ChatMessage {
  system: string;
  user: string;
}

export interface GeneratedImageResult {
  imageUrl: string;
  mimeType: string;
}

export async function callOpenAI(
  apiKey: string,
  model: string,
  messages: ChatMessage,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: messages.system },
        { role: "user", content: messages.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return content;
}

export async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: messages.system,
      messages: [{ role: "user", content: messages.user }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return text;
}

export async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: messages.system }] },
      contents: [{ parts: [{ text: messages.user }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function callDalle(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<GeneratedImageResult> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Images API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const image = data.data?.[0];
  const b64 = image?.b64_json;

  if (b64) {
    return {
      imageUrl: `data:image/png;base64,${b64}`,
      mimeType: "image/png",
    };
  }

  if (image?.url) {
    return {
      imageUrl: image.url,
      mimeType: "image/png",
    };
  }

  throw new Error("OpenAI Images API returned no image data.");
}

export async function callImagen(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<GeneratedImageResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        personGeneration: "allow_adult",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Imagen API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    predictions?: Array<{
      bytesBase64Encoded?: string;
      mimeType?: string;
      raiFilteredReason?: string;
    }>;
  };

  const prediction = data.predictions?.[0];

  if (prediction?.raiFilteredReason) {
    throw new Error(
      `Imagen blocked this prompt: ${prediction.raiFilteredReason}`,
    );
  }

  const b64 = prediction?.bytesBase64Encoded;
  if (!b64) {
    throw new Error("Imagen API returned no image data.");
  }

  const mimeType = prediction.mimeType ?? "image/png";

  return {
    imageUrl: `data:${mimeType};base64,${b64}`,
    mimeType,
  };
}

export interface GeneratedVideoResult {
  videoUrl: string;
  mimeType: string;
  placeholder: boolean;
}

const PLACEHOLDER_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

/** Simulates TTS/video synthesis until a real provider is wired in. */
export async function callVideoOrTtsAPI(
  voiceoverText: string,
  imagePrompt?: string,
): Promise<GeneratedVideoResult> {
  void voiceoverText;
  void imagePrompt;

  await new Promise((resolve) => {
    setTimeout(resolve, 400);
  });

  return {
    videoUrl: PLACEHOLDER_VIDEO_URL,
    mimeType: "video/mp4",
    placeholder: true,
  };
}
