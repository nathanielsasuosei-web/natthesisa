/* sql.js and its WebAssembly binary are served by this application. */
importScripts("/vendor/sqljs/sql-wasm.js");
self.onmessage = async (event) => {
  try {
    const SQL = await initSqlJs({ locateFile: () => "/vendor/sqljs/sql-wasm.wasm" });
    const db = new SQL.Database();
    try {
      db.run(`
        CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, joined INTEGER);
        INSERT INTO customers VALUES (1,'Ama Serwaa','Accra',2022),(2,'Kofi Mensah','Kumasi',2021),(3,'Efua Adu','Accra',2023),(4,'Yaw Owusu','Takoradi',2022);
        CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
        INSERT INTO products VALUES (1,'Canvas tote',85),(2,'Kente scarf',240),(3,'Shea butter set',120),(4,'Bead bracelet',45),(5,'Leather sandals',310),(6,'Adinkra notebook',60);
        CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, qty INTEGER);
        INSERT INTO orders VALUES (1,1,2,1),(2,3,1,3),(3,2,5,1),(4,1,6,5);
      `);
      const results = db.exec(event.data.query);
      self.postMessage({ ok: true, results, changes: db.getRowsModified() });
    } finally {
      db.close();
    }
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
