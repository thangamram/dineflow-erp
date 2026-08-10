const mysql = require('mysql2/promise');
async function run() {
  let conn;
  try {
    conn = await mysql.createConnection({
      uri: 'mysql://root:tNtbGvXvBfHnFzLqMbnYVwJkZpTcDqYl@viaduct.proxy.rlwy.net:19028/railway',
      connectTimeout: 20000
    });
    console.log('Connected!');
    
    console.log('Deleting from user_roles...');
    await conn.execute("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username IN ('EMP-0001', 'EMP-0002', 'EMP-0003', 'testwaiter', 'testkitchen'))");
    
    console.log('Deleting from employees...');
    await conn.execute("DELETE FROM employees WHERE user_id IN (SELECT id FROM users WHERE username IN ('EMP-0001', 'EMP-0002', 'EMP-0003', 'testwaiter', 'testkitchen'))");
    
    console.log('Deleting from users...');
    await conn.execute("DELETE FROM users WHERE username IN ('EMP-0001', 'EMP-0002', 'EMP-0003', 'testwaiter', 'testkitchen')");
    
    console.log('Success!');
  } catch (err) {
    console.log('Error:', err);
  } finally {
    if (conn) await conn.end();
  }
}
run();
