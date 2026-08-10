const OCR_API_KEY = Deno.env.get("OCR_SPACE_API_KEY");

Deno.serve(async (req) => {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No image URL provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!OCR_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OCR API key is not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const formData = new FormData();

    formData.append("apikey", OCR_API_KEY);
    formData.append("url", imageUrl);
    formData.append("language", "eng");
    formData.append("OCREngine", "2");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");

    const response = await fetch(
      "https://api.ocr.space/parse/image",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    console.log("OCR RESULT:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OCR request failed",
          details: result,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const parsedText =
      result?.ParsedResults?.[0]?.ParsedText || "";

    return new Response(
      JSON.stringify({
        success: true,
        text: parsedText,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("OCR ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});