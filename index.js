const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const https = require("https");
const exec = require('child_process').exec;


const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send('This is an AWS EC2 instance running...');
});

app.post("/compile", (req, res) => {
  try {
    fs.writeFile('input.cpp', req.body.input, err => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          status: 'FAILED',
          message: 'Cannot write input to file.'
        })
      } else {
        console.log('written successsfully');

        // run bash script to compile .cpp to .wasm and .js
        exec('emcc input.cpp -o out.js && node out.js', (error, stdout, stderr) => {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          console.log('exec error: ' + error);
          if (stderr) {
            return res.status(200).json({
              status: 'SUCCESS',
              compiledSuccessfully: false,
              output: stderr
            })
          }
          if (error) {
            return res.status(500).json({
              status: 'FAILED',
              message: 'Internal server error',
            })
          }
          return res.status(200).json({
            status: 'SUCCESS',
            compiledSuccessfully: true,
            output: stdout
          })
        });
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'FAILED',
      message: err.message
    })
  }
});

app.get('/.well-known/pki-validation/80355D682AB7852A538151930467D357.txt', (req, res) => {
  res.sendFile(__dirname + '/.well-known/pki-validation/80355D682AB7852A538151930467D357.txt');
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});


const cert = fs.readFileSync('./cred/certificate.crt');
const key = fs.readFileSync('./cred/private.key');
const cred = { cert, key }
const httpsServer = https.createServer(cred, app);
httpsServer.listen(443, () => {
  console.log(`Listening on port 443`);
});