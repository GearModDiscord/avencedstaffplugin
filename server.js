const express = require("express");
const fs = require("fs");

const app = express();

const FILE = "./licenses.json";

const PORT =
 process.env.PORT || 3000;


app.get("/verify", (req, res) => {

 const key =
  req.query.key;

 const domain =
  req.query.domain;


 if (!key || !domain)
  return res.send("INVALID");


 let licenses =
  JSON.parse(
   fs.readFileSync(FILE)
  );


 if (!licenses[key])
  return res.send("INVALID");


 if (!licenses[key].active)
  return res.send("INVALID");


 if (
  licenses[key].domain !==
  domain.toLowerCase()
 )
  return res.send("INVALID");


 return res.send("VALID");

});


app.listen(PORT, () => {

 console.log(
  "License API running"
 );

});
