const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const axios = require("axios");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const request = require("request");
require("dotenv").config();

const app = express();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = "http://localhost:5000/callback";

function generateRandomString(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

var stateKey = "spotify_auth_state";

app.use(express.json()).use(morgan("tiny")).use(cors()).use(cookieParser());

app.get("/", (req, res) => {
  res.send("ayyy lmao");
});

app.get("/test", async (req, res) => {
  const spaceUrl = "http://api.open-notify.org/astros.json";

  const axResponse = await axios(spaceUrl);
  res.json(axResponse.data);
});

app.get("/login", (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = "streaming user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id,
        scope,
        redirect_uri,
        state,
      })
  );
});

app.get("/callback", (req, res) => {
  // application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState)
    return res.status(400).json({ status: "state mismatch" });

  res.clearCookie(stateKey);

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code,
      redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const { access_token, refresh_token } = body;

      const options = {
        url: "https://api.spotify.com/v1/me",
        headers: { Authorization: "Bearer " + access_token },
        json: true,
      };

      res.status(200).json({ access_token, refresh_token });
    } else {
      res.status(400).json({ error: "invalid token" });
    }
  });
});

app.get("/refresh_token", (req, res) => {
  const { refresh_token } = req.body;

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token,
    },
    json: true,
  };

  request.post(authOptions, (err, response, body) => {
    if (!err && response.statusCode === 200) {
      const { access_token } = body;
      res.status(200).json({ access_token });
    } else {
      res.status(400).json({ status: "error or something" });
    }
  });
});

app.listen(5000, () => console.log("\nlistening at 5000\n"));
