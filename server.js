import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/generate', async (req, res) => {
  const { genre, prompt } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // 8b = 10x cheaper + limit 30 RPM but 7000 RPD
      temperature: 0.9,
      max_tokens: 1200, // محدود کردیم
      messages: [
        { role: "system", content: `Return ONLY JSON array of 5 tracks. Each: {"bpm":80-170,"scale":[freqs],"bass":[16 0/1],"drums":{"kick":[16 bool],"hat":[16 bool]},"mood":string,"wave":"sawtooth|square|sine|triangle"} Genre=${genre}` },
        { role: "user", content: `Genre: ${genre}, Prompt: ${prompt}. Generate 5 variations.` }
      ],
      response_format: { type: "json_object" }
    });
    const data = JSON.parse(completion.choices[0].message.content);
    // اگه array نبود، تبدیل به array
    const tracks = Array.isArray(data) ? data : data.tracks || [data];
    res.json({ tracks });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`AIxMUSIC OPTIMIZED on ${PORT}`));
