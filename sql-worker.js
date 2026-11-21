importScripts('./sql-wasm.js');
const loading = initSqlJs({ locateFile: file => new URL(file,self.location.href).href });
self.onmessage = async ({data}) => {
  let db;
  try {
    const SQL = await loading;
    db = new SQL.Database();
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(data.setup);
    if (data.inspect) db.exec(data.query);
    const stmt = db.prepare(data.inspect || data.query);
    try {
      const columns = stmt.getColumnNames();
      if (!columns.length) throw new Error('Oczekiwano tabeli wynikowej.');
      const results = [];
      while (stmt.step()) {
        results.push(stmt.get());
        if (results.length > 100) throw new Error('Wynik zawiera ponad 100 wierszy.');
      }
      self.postMessage({results,columns});
    } finally {
      stmt.free();
    }
  } catch(error) {
    self.postMessage({error:String(error.message||error)});
  } finally {
    db?.close();
  }
};
