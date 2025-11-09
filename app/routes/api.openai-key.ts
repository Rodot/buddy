export async function loader() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set");
    return Response.json(
      { error: "Server configuration error: Missing OPENAI_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: { type: "realtime", model: "gpt-realtime" },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "OpenAI API error:",
        response.status,
        response.statusText,
        errorData,
      );
      return Response.json(
        {
          error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (!data.value) {
      console.error("OpenAI API did not return a client secret");
      return Response.json(
        { error: "Failed to obtain ephemeral key from OpenAI" },
        { status: 500 },
      );
    }

    return { key: data.value };
  } catch (error) {
    console.error("Error fetching OpenAI client secret:", error);
    return Response.json(
      {
        error: `Failed to connect to OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
