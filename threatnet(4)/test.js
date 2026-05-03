const r = await fetch('https://api.fbi.gov/wanted/v1/list?pageSize=50');
const j = await r.json();
const items = j.items;
const filtered = items.filter(i => true).map(i => ({
  title: i.title,
  files: i.files,
  url: i.url,
  locations: i.locations,
  place_of_birth: i.place_of_birth,
  nationality: i.nationality
})).slice(0, 5);
console.log(JSON.stringify(filtered, null, 2));
