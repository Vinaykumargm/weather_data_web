const express = require("express");
const app = express();
const mysql = require("mysql2");
const path = require("path");
const methodOverride = require("method-override");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const port = 8080;
require('dotenv').config();
// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'weather',
    password: 'vinay123',
});
connection.connect();

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Add this to parse JSON body
app.use(bodyParser.json());


// Home page route
app.get("/", (req, res) => {
    res.render("home.ejs");
});

// Login form route
app.get("/login", (req, res) => {
    res.render("login.ejs");
});

// Login POST route
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = `SELECT * FROM users WHERE email='${email}' AND password='${password}'`;
    connection.query(query, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error logging in");
        } else {
            if (result.length > 0) {
                res.redirect("/login");
            } else {
                res.redirect("/signup");
            }
        }
    });
});

// Signup form route
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

// Signup POST route
app.post("/signup", (req, res) => {
    const { email, password } = req.body;
    const query = `INSERT INTO users (email, password) VALUES ('${email}', '${password}')`;
    connection.query(query, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error signing up");
        } else {
            res.redirect("/");
        }
    });
});

// Dashboard route
app.get("/dashboard", (req, res) => {
    res.render("dashboard.ejs");
});

// Weather forecast route
app.get("/weather", (req, res) => {
    res.render("weather.ejs");
});

// Weather alerts route
app.get("/alerts", (req, res) => {
    res.render("alerts.ejs");
});

// User profile route
app.get("/profile", (req, res) => {
    res.render("profile.ejs");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


// Weather alerts route
app.get("/alerts", (req, res) => {
    const city = req.query.city;

    fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=6af719c8f160363ad5c1619cf00cb08f&units=metric`)
        .then(response => response.json())
        .then(data => {
            res.json(data.weather);
        })
        .catch(error => {
            console.error('Error fetching weather alerts:', error);
            res.status(500).send("Error fetching weather alerts");
        });
});


// Define route to handle weather quiz
app.get("/quiz", (req, res) => {
    res.render("quiz.ejs"); // Assuming "quiz.ejs" is the template for the weather quiz
});


// Define a route to fetch the rank board data
app.get('/rankboard', (req, res) => {
    const query = 'SELECT email, score FROM quiz_scores ORDER BY score DESC';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching rank board data:', err);
            res.status(500).send('Error fetching rank board data');
        } else {
            const rankBoardData = results.map(row => ({ email: row.email, score: row.score }));
            res.json(rankBoardData);
        }
    });
});




// Quiz questions and answers
const quizQuestions = [
    { question: "1. What is the hottest planet in our solar system?", answer: "b" },
    { question: "2. What is the name of the process by which water changes from a liquid to a gas?", answer: "a" },
    { question: "3. What is the instrument used to measure wind speed?", answer: "b" },
    { question: "4. What is the term for the boundary between two air masses with different temperatures and humidity?", answer: "b" },
    { question: "5. What causes the green color sometimes seen in the sky during severe weather?", answer: "a" },
    { question: "6. What is the name of a rotating column of air in contact with both the surface of the Earth and a cumulonimbus cloud?", answer: "a" },
    { question: "7. What is the name of the layer of Earth's atmosphere that contains the ozone layer?", answer: "b" }
];


// Define a route to handle quiz submissions
app.post("/quiz/submit", (req, res) => {
    const email = req.body.email; // Assuming the email is sent in the request body
    if (!email) {
        return res.status(400).send("Missing email in request body");
    }

    const userAnswers = req.body; // Assuming all answers are sent in the request body

    // Calculate the score based on the user's answers
    let score = 0;
for (const key in userAnswers) {
    if (userAnswers.hasOwnProperty(key)) {
        const answer = userAnswers[key];
        // Assuming keys are like 'question0', 'question1', etc.
        const index = parseInt(key.replace('question', ''), 10);

        if (quizQuestions[index] && quizQuestions[index].answer === answer) {
            score++;
        }
    }
}

    // Store the score in the database
    const insertScoreQuery = `INSERT INTO quiz_scores (email, score, quiz_type) VALUES (?, ?, ?)`;
    connection.query(insertScoreQuery, [email, score, "Weather Quiz"], (err, result) => {
        if (err) {
            console.error("Error saving score to database:", err);
            return res.status(500).send("Error saving score to database");
        }

        // Send the score back to the client
        res.json({ score });
    });
});


app.get("/facts", (req, res) => {
    const facts = [
        "The highest recorded temperature on Earth was 134°F (56.7°C) in Furnace Creek Ranch, Death Valley, California, USA on July 10, 1913.",
        "The lowest recorded temperature on Earth was -128.6°F (-89.2°C) at the Soviet Union's Vostok Station in Antarctica on July 21, 1983.",
        "The world's largest hailstone on record fell in Vivian, South Dakota, USA, on July 23, 2010. It measured 8 inches (20.3 cm) in diameter and weighed nearly 2 pounds (907 grams).",
        "The wettest place on Earth is Mawsynram, India. It receives an average annual rainfall of about 467 inches (11,871 mm).",
        "The highest rainfall in a 24-hour period occurred in Foc-Foc, La Réunion, France, on January 7-8, 1966, with 71.9 inches (1,825 mm) recorded.",
        "The strongest recorded tornado, with wind speeds estimated at 318 mph (512 km/h), struck near Moore, Oklahoma, USA, on May 3, 1999.",
        "Lightning strikes the Earth about 8 million times a day.",
        "The average thunderstorm is 15 miles (24 km) in diameter and lasts for about 30 minutes.",
        "The first weather satellite, TIROS-1, was launched by NASA on April 1, 1960.",
        "Hurricanes, cyclones, and typhoons are all the same weather phenomenon; they are just called different names based on the region in which they occur.",
        "The polar vortex is a large area of low pressure and cold air surrounding both of the Earth's poles. It can cause extreme cold outbreaks in winter.",
        "The term 'El Niño' refers to a climate cycle in the Pacific Ocean characterized by a warming of sea surface temperatures, which can have widespread impacts on weather patterns around the world.",
        "The 'Fujita scale' measures the intensity of tornadoes based primarily on the damage they cause.",
        "Meteorology is the study of weather and the atmosphere.",
        "A 'rain shadow' is a dry area on the leeward side of a mountain range. It is caused by moist air being forced to rise over the mountains, where it cools and condenses, releasing precipitation on the windward side.",
        "The 'Beaufort scale' is a measure of wind speed based on visual observations of the sea surface.",
        "A 'derecho' is a widespread, long-lived windstorm associated with a fast-moving band of severe thunderstorms.",
        "The term 'hurricane' is derived from 'Hurican,' the Carib god of evil.",
        "The Great Red Spot on Jupiter is a giant storm that has been raging for at least 400 years.",
        "Dust storms on Mars can sometimes cover the entire planet and last for months.",
        "Raindrops can be as small as a mist or as large as a pea, depending on atmospheric conditions.",
        "Thunderstorms are most likely to occur in the spring and summer months when the atmosphere is warm and moist.",
        "The Earth's atmosphere is divided into five layers: the troposphere, stratosphere, mesosphere, thermosphere, and exosphere.",
        "The windiest place on Earth is Commonwealth Bay, Antarctica, where winds can exceed 150 miles per hour (240 km/h) on a regular basis.",
        "The coldest temperature ever recorded in the contiguous United States was -70°F (-56.7°C) at Rogers Pass, Montana, on January 20, 1954.",
        "The 'eye' of a hurricane is a roughly circular area of calm weather and clear skies found at the center of the storm.",
        "The term 'blizzard' refers to a snowstorm with very strong winds and reduced visibility.",
        "Rainbows are caused by the refraction, dispersion, and reflection of sunlight in water droplets.",
        "The fastest wind speed ever recorded on Earth's surface was 253 mph (407 km/h) during Tropical Cyclone Olivia on April 10, 1996, on Barrow Island, Australia.",
        "The field of meteorology has greatly benefited from advancements in technology, including the use of Doppler radar, satellite imagery, and computer models, allowing for more accurate weather forecasting and better understanding of complex weather phenomena."
    ];
        
    res.render("facts.ejs", { facts });
});



// Assume you have an array of people objects
const people = [
    { name: 'MSD', image: '/images/pcc.jpeg', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { name: 'KOHLI', image: 'https://media.gettyimages.com/id/1241794176/photo/birmingham-england-virat-kohli-of-india-poses-during-a-portrait-session-at-the-hyatt-hotel-on.jpg?s=612x612&w=gi&k=20&c=4uCrHub3PqhwGr9d_BuZ-bXG8hrM36vXtF99Yg_zU7A=', description: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur.' },
    
  ];
  
  // Route handler for the About Us page
  app.get("/aboutUs", (req, res) => {
      res.render("aboutUs.ejs", { people: people });
  });
  

// Route handler for handling feedback submissions
app.post("/feedback", (req, res) => {
    const { feedback } = req.body; // Assuming the feedback is sent in the request body
    const insertFeedbackQuery = `INSERT INTO feedback (message) VALUES (?)`;
    connection.query(insertFeedbackQuery, [feedback], (err, result) => {
        if (err) {
            console.error("Error saving feedback to database:", err);
            return res.status(500).send("Error saving feedback to database");
        }
        // Feedback successfully saved
        res.redirect("/aboutUs"); // Redirect back to the About Us page or any other page
    });
});


app.post('/send-email', (req, res) => {
    const { email, alerts } = req.body;

    console.log("Attempting to send email to:", email);
    console.log("Alerts:", alerts);

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Weather Alerts',
        text: alerts.join('\n\n'),
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send({ error: 'Failed to send email', details: error.message });
        }
        console.log('Email sent:', info.response);
        res.status(200).send({ message: 'Email sent successfully' });
    });
});



console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

// Start server
app.listen("3306", () => {
    console.log("Server is listening on port 8080");
});
