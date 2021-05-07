var express = require('express')
var b = require('browserify')();
var fs = require('fs')
b.add('./script.js')
function streamToString (stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  })
}
;(async () => {
  const f = await streamToString(b.bundle())
  fs.writeFileSync('./public/script.js', f);
  
  var app = express()
  app.use(express.static('public'))
  console.log('starting')
  app.listen(3334)
})()