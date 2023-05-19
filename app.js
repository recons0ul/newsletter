const express = require("express");
const https = require("node:https");
const app = express();

const API_KEY = "350d53c236b4493a9f3116076daa6f6e-us14";
const AUDIENCE_ID = "b089107cbd";
const SUBSCRIPTION_URL = "us14.api.mailchimp.com";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

function httpsRequest(options, data) {
  return new Promise(function (resolve, reject) {
    let req = https.request(options, function (res) {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(res.statusCode));
      } else {
        res.on("data", data => {
          let parsed = JSON.parse(data);
          if (parsed.errors.length !== 0) {
            reject(parsed.errors[0].error);
          }
          resolve(parsed);
        });
      }
    });

    req.on("error", e => {
      console.error(e);
    });
    req.write(data);
    req.end();
  });
}

async function subscribeUser(mail, firstname, surname) {
  let data = {
    members: [
      {
        status: "subscribed",
        email_address: mail,
        merge_fields: {
          FNAME: firstname,
          LNAME: surname,
        },
      },
    ],
  };
  let jsonData = JSON.stringify(data);
  let options = {
    hostname: SUBSCRIPTION_URL,
    port: 443,
    path: "/3.0/lists/" + AUDIENCE_ID,
    method: "POST",
    auth: "recon0ul:" + API_KEY,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": jsonData.length,
    },
  };
  return await httpsRequest(options, jsonData);
}

app.post("/signup", (req, res) => {
  let params = req.body;
  subscribeUser(params.mail, params.firstname, params.surname)
    .then(() => {
      res.sendFile(__dirname + "/success.html");
    })
    .catch((e) => {
      console.log(e);
      res.sendFile(__dirname + "/failure.html");
    });
});

app.post("/failure", (req, res) => {
  res.redirect("/");
})

app.listen(3000, () => {
  console.log("Server is up and running on port 3000");
});
