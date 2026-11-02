require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  await c.query(
    "DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email='layout-test@jyp.local')"
  );
  await c.query("DELETE FROM users WHERE email='layout-test@jyp.local'");

  const hash = bcrypt.hashSync('123456', 10);
  const [r] = await c.query(
    "INSERT INTO users (username,email,password_hash,role,policies_accepted) VALUES ('layouttest','layout-test@jyp.local',?,'client',1)",
    [hash]
  );
  await c.query(
    "INSERT INTO user_profiles (user_id,person_type,names,surnames,city,dni,is_available) VALUES (?,'natural','Layout','Test','Lima','99999999',1)",
    [r.insertId]
  );

  console.log('created user id', r.insertId);
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
