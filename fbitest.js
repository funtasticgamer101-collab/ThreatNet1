const https = require('https');
https.get('https://api.fbi.gov/wanted/v1/list?pageSize=1', (resp) => {
  let data = '';
  resp.on('data', (chunk) => data += chunk);
  resp.on('end', () => console.log(Object.keys(JSON.parse(data).items[0])));
});
