export async function loader() {
  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: { type: "realtime", model: "gpt-realtime" },
      }),
    },
  );

  const data = await response.json();
  return { key: data.value };
}
