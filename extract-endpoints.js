import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./postman.json', 'utf8'));

const endpoints = [];

function extractEndpoints(items, parentName = '') {
  if (!items) return;
  items.forEach(item => {
    const name = item.name;
    if (item.item && Array.isArray(item.item)) {
      extractEndpoints(item.item, name);
    } else if (item.request && item.request.url) {
      const url = item.request.url;
      let path = '';
      if (Array.isArray(url.path)) {
        path = '/' + url.path.filter(p => p).join('/');
      } else if (url.raw) {
        const match = url.raw.match(/{{baseUrl}}(.*?)$/);
        path = match ? match[1] : url.raw;
      }
      
      endpoints.push({
        name,
        method: item.request.method || 'GET',
        path: path.replace(/\/+/g, '/'),
        category: parentName,
        hasBody: item.request.body ? true : false,
        bodyType: item.request.body?.mode
      });
    }
  });
}

extractEndpoints(data.item);

// Group by category
const grouped = {};
endpoints.forEach(e => {
  if (!grouped[e.category]) {
    grouped[e.category] = [];
  }
  grouped[e.category].push(e);
});

console.log(JSON.stringify(grouped, null, 2));
