# ✦ ScribbleVerse

> doodles go in, poetry comes out. thats literally it.

---

### what is this

ok so basically i wanted to make something where you draw stuff and it turns into a poem. started as a weekend project, kept adding features, now its a whole thing.

you sketch on a canvas (theres like 4 different brush types and a bunch of ink colors), hit a button, and GPT-4o looks at what you drew and writes a poem about it. the poem types out with this typewriter animation that i spent way too long on. theres even sound effects.

oh and you can upload images too if drawing isnt your thing.

the frontend is just html/css/js, no frameworks. the backend is a tiny flask server that keeps the api key hidden so nobody can steal it.

---

### features

**🎨 drawing stuff** — fountain pen, calligraphy, charcoal brushes. five ink colors. undo/redo. eraser. the fountain pen has pressure simulation which was honestly painful to get right

**📷 image upload** — drag and drop or click the camera icon. it throws the image onto the canvas and you can draw on top of it

**📜 ai poetry** — sends your canvas to gpt-4o vision through a flask proxy. the prompt is tuned to actually describe what it sees instead of writing generic poems about "the beauty of creation" or whatever

**🔊 text to speech** — click speak and it reads the poem out loud. slow dramatic pacing. its kinda nice actually

**💾 gallery** — save your favorites locally. thumbnails and everything. you can click old ones to load them back

**🖼️ export** — generates a printable card with your drawing on top and the poem below. parchment paper vibes

---

### tech

- **frontend:** html, css, vanilla js. no react no tailwind no nothing
- **backend:** python flask. just proxies the api calls so the key stays safe
- **ai:** openai gpt-4o via hack club ai proxy

---

### running it locally

```bash
pip install -r requirements.txt
python app.py
```

then open `localhost:5000`

---

### ai disclosure

gpt-4o does the image analysis and poem writing. for the code itself — ai helped with some of the ui structure and css, but the canvas engine, brush physics, typewriter animation timing, and audio synthesis were all built by hand. ai was more of a rubber duck than a ghostwriter

---

*doodling since 2026 ✦*
