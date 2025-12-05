const bcrypt = require('bcryptjs');

async function hashPwd(pwd) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pwd, salt);
  console.log(hash);
}

hashPwd('mypassword')
  .catch(err => console.error(err));

