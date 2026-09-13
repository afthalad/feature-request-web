import "server-only";

interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage: string;
}

const GOOGLE_TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

export async function translateText(text: string, targetLang: string): Promise<TranslateResult> {
  if (!text.trim()) return { translatedText: "", detectedSourceLanguage: targetLang };

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("Translation is not configured for this deployment.");

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target: targetLang, format: "text" }),
  });

  if (!response.ok) {
    throw new Error("Translation request failed.");
  }

  const data = await response.json();
  const translation = data?.data?.translations?.[0];
  if (!translation) throw new Error("Translation request failed.");

  return {
    translatedText: translation.translatedText as string,
    detectedSourceLanguage: (translation.detectedSourceLanguage as string | undefined) ?? targetLang,
  };
}
