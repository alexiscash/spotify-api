const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

app.use(express.json()).use(morgan("tiny")).use(cors());

app.get("/", (req, res) => {
  res.send("ayyy lmao");
});

app.listen(5000, () => console.log("listening at 5000"));
