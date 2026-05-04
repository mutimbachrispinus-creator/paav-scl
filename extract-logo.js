const fs = require('fs');
const content = fs.readFileSync('/home/chrispinus/updates/html-122/index-122-3.html', 'utf-8');
const match = content.match(/const LOGO_IMG='data:image\/jpeg;base64,(.*?)';/);
if (match) {
  fs.writeFileSync('./public/logo.png', Buffer.from(match[1], 'base64'));
  console.log('Logo extracted successfully!');
} else {
  console.log('Logo not found.');
}
