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
      model: "llama-3.3-70b-versatile",
      temperature: 0.95,
      messages: [
        { role: "system", content: `You are AIxMUSIC GENERATOR engine. Return ONLY valid JSON: {"bpm":80-170,"scale":[freqs Hz 4-7 notes],"bass":[16 ints 0/1],"lead":[16 ints scale index or null],"drums":{"kick":[16 bools],"hat":[16 bools],"clap":[16 bools]},"mood":"string","wave":"sawtooth|square|sine|triangle"} Genre=${genre}` },
        { role: "user", content: `Genre: ${genre}, Prompt: ${prompt}. Generate variation.` }
      ],
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`AIxMUSIC GENERATOR running on ${PORT}`));