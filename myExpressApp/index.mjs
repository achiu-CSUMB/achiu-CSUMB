import express from 'express';
import fetch from 'node-fetch';
const planets = (await import('npm-solarsystem')).default;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get('/', async(req, res) => {
    let apiKey = "7756a1e81f817c186cf57294e1c19b37b49c54b8f34e7c499ee0ce5cd86cd16e";
	let url = `https://api.unsplash.com/photos/random/?client_id=${apiKey}&featured=true&query=solar-system`;
    let randomImage = "/img/SolarSystem.jpg"; // fallback if Unsplash fails
    try {
        let response = await fetch(url);
        let data = await response.json();
        randomImage = data.urls.full;
    } catch (err) {
        console.log("Unsplash request failed:", err.message);
    }
    res.render("index", { "image": randomImage });
});

//to connect with Render+github
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});

app.get('/planet', (req, res) => {
    let planetName = req.query.planetName;
    let getter = planets[`get${planetName}`];
    if (typeof getter !== 'function') {
        return res.status(404).send('Planet not found');
    }
    let planetInfo = getter();
    res.render('planet', { planetInfo, planetName });
});

// NASA Astronomy Picture of the Day
app.get('/nasa', async (req, res) => {
    let url = 'https://api.nasa.gov/planetary/apod?api_key=QtLz86qkkhk6PJw6HMggmdP96f6BJDPnHFwjdc8n';
    try {
        let response = await fetch(url);
        let pod = await response.json();
        res.render('nasa', { pod });
    } catch (err) {
        res.status(500).send('Could not load the NASA Picture of the Day.');
    }
});