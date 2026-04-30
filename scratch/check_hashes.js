
const crypto = require('crypto');
function hashPassword(plain, salt) {
  const hash = crypto.createHash('sha256');
  hash.update(plain + salt);
  return hash.digest('hex');
}
const target = 'fea984842c50087541de5f2df8b5fefa31977fff64dc17cd76f0429dba4a23b9';
console.log('password123 + salt-for-passwords:', hashPassword('password123', 'salt-for-passwords'));
