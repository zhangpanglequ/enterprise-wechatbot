const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { renameSync, readFileSync, unlinkSync } = require("fs");
const dayjs = require("dayjs");
const crypto = require("crypto");
const images = require("images");

const axios = require("axios").default;

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static("./"));

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" }).single("file");

app.post("/upload", upload, async (req, res) => {
  const str = req.body.str;
  console.log(req.file);

  if (str) {
    axios.post(WEBHOOK_URL, {
      msgtype: "markdown",
      markdown: {
        content: str,
      },
    });
  }

  if (req.file) {
    const filename = `${dayjs().format("MM-DD HH:mm:ss")} - ${
      req.file.originalname
    }`;
    const filePath = `uploads/${filename}`;
    renameSync(req.file.path, filePath);
    images(filePath).size(750).save(filePath);
    let buffer = readFileSync(filePath);
    const base64 = buffer.toString("base64");
    const hash = crypto.createHash("md5");
    hash.update(buffer, "base64");
    const md5 = hash.digest("hex");
    console.log(md5, base64);

    await axios.post(WEBHOOK_URL, {
      msgtype: "image",
      image: {
        base64,
        md5,
      },
    });

    unlinkSync(filePath);
  }
  res.send("ok");
});

app.listen(PORT);
