import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/generate', async (req, res) => {
  const { genre, prompt } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.95,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a music composer API. You MUST return valid JSON only.

Return this exact structure:
{"tracks":[{"bpm":124,"scale":[55,62,73,82,98,110,130],"chordProgression":[0,3,4,3],"bass":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],"chords":[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],"lead":[{"n":2,"v":0.7},{"n":null},{"n":5,"v":0.5},{"n":null},{"n":2,"v":0.8},{"n":null},{"n":4,"v":0.6},{"n":null},{"n":2,"v":0.7},{"n":null},{"n":5,"v":0.8},{"n":null},{"n":6,"v":0.9},{"n":null},{"n":4,"v":0.5},{"n":null}],"mood":"Deep Tech","wave":"sawtooth","voicing":"7th","swing":0.1}]}

Rules:
- bpm: number 70-170
- scale: array of 5-7 numbers (frequencies in Hz, 40-400)
- chordProgression: array of 4 ints 0-6
- bass/chords: array of 16 ints 0/1
- lead: array of 16 objects {n: 0-6 or null, v:0.3-1}
- wave: sawtooth,sine,triangle,square
- voicing: triad,7th,power
- swing: 0-0.25
- Return 3 tracks, all different.`
        },
        { role: "user", content: `Genre: ${genre}, Prompt: ${prompt}, generate 3 tracks` }
      ]
    });

    let data = JSON.parse(completion.choices[0].message.content);
    // normalize
    let tracks = (data.tracks || [data]).map(t => ({
      bpm: Number(t.bpm)||124,
      scale: (Array.isArray(t.scale)?t.scale:[55,62,73,82,98]).filter(n=>typeof n==='number'&&isFinite(n)),
      chordProgression: t.chordProgression||[0,3,4,3],
      bass: { pattern: t.bass||t.bassPattern||Array(16).fill(0).map((_,i)=>i%4===0?1:0) },
      chords: { pattern: t.chords||t.chordPattern||Array(16).fill(0).map((_,i)=>i%4===0?1:0), voicing: t.voicing||"triad" },
      lead: { pattern: (t.lead||[]).map(l=> l===null?null: typeof l==='object'? (l.n!==undefined?{note:l.n,vel:l.v||0.6,len:0.5}:{note:l.note||0,vel:l.vel||0.6,len:l.len||0.5}) : null), humanize:true },
      drums: { kick: t.bass||Array(16).fill(0).map((_,i)=>i%4===0?1:0), snare:Array(16).fill(0).map((_,i)=>i===4||i===12?1:0), hat:Array(16).fill(0).map((_,i)=>i%2===1?1:0), openHat:Array(16).fill(0).map((_,i)=>i===15?1:0) },
      mood: t.mood||genre,
      wave: t.wave||"sawtooth",
      swing: Number(t.swing)||0
    }));
    res.json({ tracks });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`PRO V5 FIXED on ${PORT}`))
