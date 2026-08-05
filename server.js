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

// موسیقی تئوری حرفه ای برای هر ژانر
const THEORY = {
  "Deep House": { scales: [["D","F","A","C"], ["G","A#","D","F"]], chords: [[0,3,4,3],[5,3,0,0]], bpm:"122-126" },
  "Rock": { scales: [["E","G","A","B","D"]], chords: [[0,3,4,0],[0,5,3,4]], bpm:"130-145" },
  "Metal": { scales: [["E","F","G","A#","C"]], chords: [[0,6,5,3]], bpm:"150-170" },
  "Classic": { scales: [["C","D","E","F","G","A","B"]], chords: [[0,3,4,4],[0,5,1,4]], bpm:"70-90" },
  "Jazz": { scales: [["D","E","F","G","A","B","C"]], chords: [[1,4,0,5],[2,5,1,4]], bpm:"100-120" },
  "Blues": { scales: [["A","C","D","D#","E","G"]], chords: [[0,0,0,0,3,4,0,0]], bpm:"75-95" },
  "Lo-Fi": { scales: [["C","D#","F","G","A#"]], chords: [[0,3,2,1]], bpm:"70-88" },
  "Trap": { scales: [["F","G#","A#","C","D#"]], chords: [[0,5,3,4]], bpm:"135-150" }
};

app.post('/api/generate', async (req, res) => {
  const { genre, prompt } = req.body;
  const theory = THEORY[genre] || THEORY["Deep House"];
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 1.1,
      max_tokens: 1500,
      messages: [
        { role: "system", content: `You are a PROFESSIONAL music composer. Not random.
Genre: ${genre}. Theory hint: ${JSON.stringify(theory)} BPM:${theory.bpm}

Return ONLY JSON: {"tracks": [ 5 tracks ] }
Each track:
{
  "bpm": int,
  "key": "C, D#, etc",
  "scale": [freqs Hz, 7 notes, REAL musical scale for genre, e.g Blues A minor pentatonic + blue note],
  "chordProgression": [4 ints index of scale, e.g [0,3,4,3] = I-IV-V-IV],
  "bass": {"pattern":[16 ints 0/1 + velocity 0.3-1], "octave": -1},
  "chords": {"pattern":[16 bools when chord hits], "voicing":"triad|7th|power"},
  "lead": {"pattern":[16 vals: null or {note:scaleIndex, vel:0.5-1, len:0.2-0.8}], "humanize":true},
  "drums": {"kick":[16 bools], "snare":[16 bools], "hat":[16 bools], "openHat":[16 bools]},
  "mood": string,
  "wave": "sawtooth|square|sine|triangle",
  "swing": 0-0.3
}
RULES:
- Deep House: off-beat hat, 4-on-floor kick, 7th chords
- Rock/Metal: power chords, kick doubles, lead with bends (use high scale notes)
- Classic: arpeggio chords, no drums or soft
- Jazz: ii-V-I, swing 0.2, 7th/9th, walking bass
- Blues: 12-bar feel, shuffle, blue note (b5)
- Never same pattern twice. Make evolving.

Return 5 DIFFERENT tracks.` },
        { role: "user", content: `Compose 5 pro tracks for: ${genre} - ${prompt}` }
      ],
      response_format: { type: "json_object" }
    });
    const data = JSON.parse(completion.choices[0].message.content);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`PRO ENGINE on ${PORT}`));
