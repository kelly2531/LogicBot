
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "LogicBot",
    aiConfigured: Boolean(OPENROUTER_API_KEY),
    provider: "OpenRouter"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Digite uma pergunta."
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "A pergunta deve ter até 4000 caracteres."
      });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({
        error: "A chave do OpenRouter não está configurada."
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "X-Title": "LogicBot"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-ultra-550b-a55b:free",
          messages: [
            {
              role: "system",
              content: `

Você é o LogicBot, um tutor de lógica de programação para iniciantes.

REGRAS:
- Responda sempre em português brasileiro.
- Use linguagem simples, amigável e didática.
- Seja direto e evite explicações longas.
- Responda normalmente em até 120 palavras.
- Para perguntas simples, use apenas 3 a 6 frases.
- Divida explicações em pequenos tópicos quando necessário.
- Use exemplos pequenos e fáceis de entender.
- Só apresente códigos quando forem solicitados ou realmente necessários.
- Explique o código de forma resumida.
- Não repita informações.
- Não termine com ideias incompletas.
- Se o usuário pedir mais detalhes, aprofunde a explicação.

              `
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro OpenRouter:", data);

      return res.status(response.status).json({
        error: "O OpenRouter não conseguiu processar sua pergunta. Tente novamente."
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "A IA não retornou uma resposta. Tente novamente."
      });
    }

    return res.json({ reply });

  } catch (error) {
    console.error("Erro ao consultar OpenRouter:", error);

    return res.status(500).json({
      error: "Não foi possível consultar a IA. Tente novamente."
    });
  }
  }
);


app.listen(PORT, "0.0.0.0", () => {
  console.log(`LogicBot iniciado na porta ${PORT}`);
});