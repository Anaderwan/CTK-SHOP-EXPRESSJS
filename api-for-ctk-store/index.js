import bodyParser from "body-parser";
import { Client } from "pg";
import express from "express";

const db = new Client({
  user: "postgres",
  host: "localhost",
  database: "ZADATAK",
  password: "123456",
  port: 5432,
});

const app = express();
const port = 3000;

app.use(bodyParser.json());

db.connect()
  .then(() => console.log(`Connected to DB`))
  .catch((err) => {
    console.log(`Cannot connect to DB`);
    process.exit(1);
  });

//---------------------------------------------------------------------------------------------- GET
//----------------STORES
app.get("/stores", async (req, res) => {
  try {
    const result = await db.query(`
        SELECT
            s.id AS store_id,
            s.store_name AS store_name,
            i.id AS item_id,
            i.item_name AS item_name,
            i.price AS price
        FROM stores AS s
        LEFT JOIN items AS i ON i.store_id = s.id
        ORDER BY s.id ASC, i.id ASC`
        );

    const storesMap = new Map();

    result.rows.forEach(row => {
      if (!storesMap.has(row.store_id)) {
        storesMap.set(row.store_id, {
          id: row.store_id,
          name: row.store_name,
          items: []
        });
      }
      if (row.item_id) {
        storesMap.get(row.store_id).items.push({
          id: row.item_id,
          name: row.item_name,
          price: row.price
        });
      }
    });

    const stores = Array.from(storesMap.values());
    res.json(stores);

  } catch (err) {
    console.log("Error GET to stores table:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

app.get("/stores/:id", async (req, res) => {
  const storeId = req.params.id;

  try {
    const result = await db.query(`
      SELECT
        s.id AS store_id,
        s.store_name AS store_name,
        i.id AS item_id,
        i.item_name AS item_name,
        i.price AS price
      FROM stores s
      LEFT JOIN items i ON i.store_id = s.id
      WHERE s.id = $1
      ORDER BY s.id ASC, i.id ASC
    `, [storeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = {
      id: result.rows[0].store_id,
      name: result.rows[0].store_name,
      items: []
    };

    result.rows.forEach(row => {
      if (row.item_id) {
        store.items.push({
          id: row.item_id,
          name: row.item_name,
          price: row.price
        });
      }
    });

    res.json(store);
  } catch (err) {
    console.error("Error GET /stores/:id:", err.stack);
    res.status(500).json({ error: err.message });
  }
});
//-----------------------ITEMS
app.get("/items", async (req, res) => {
  try {
    const result = await db.query(`
        SELECT
            i.id AS item_id,
            i.item_name AS item_name,
            i.price AS price,
            s.id AS store_id,
            s.store_name AS store_name
        FROM items AS i
        LEFT JOIN stores AS s ON i.store_id = s.id
        ORDER BY i.id ASC, s.id ASC`
        );

    const itemsMap = new Map();

    result.rows.forEach(row => {
      if (!itemsMap.has(row.item_id)) {
        itemsMap.set(row.item_id, {
          id: row.item_id,
          name: row.item_name,
          price: row.price,
          stores: []
        });
      }
      if (row.store_id) {
        itemsMap.get(row.item_id).stores.push({
          id: row.store_id,
          name: row.store_name,
        });
      }
    });

    const items = Array.from(itemsMap.values());
    res.json(items);

  } catch (err) {
    console.log("Error GET to items table:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

app.get("/items/:id", async (req, res) => {
    const id = req.params.id
  try {
    const result = await db.query(`
        SELECT
            i.id AS item_id,
            i.item_name AS item_name,
            i.price AS price,
            s.id AS store_id,
            s.store_name AS store_name
        FROM items AS i
        LEFT JOIN stores AS s ON i.store_id = s.id
        WHERE i.id = $1
        ORDER BY i.id ASC, s.id ASC`,
        [id]
        );

    const itemsMap = new Map();

    result.rows.forEach(row => {
      if (!itemsMap.has(row.item_id)) {
        itemsMap.set(row.item_id, {
          id: row.item_id,
          name: row.item_name,
          price: row.price,
          stores: []
        });
      }
      if (row.store_id) {
        itemsMap.get(row.item_id).stores.push({
          id: row.store_id,
          name: row.store_name,
        });
      }
    });

    const items = Array.from(itemsMap.values());
    res.json(items);

  } catch (err) {
    console.log("Error GET to items table:", err.stack);
    res.status(400).json({ error: err.message });
  }
});


//---------------------------------------------------------------------------------------------- POST
//-------------POST STORES
app.post("/stores", async (req, res) => {
  const { store_name } = req.body;

  if (!store_name) {
    console.log("Data validation failed");
    return res
      .status(400)
      .json({ error: "Polje 'store_name' je obavezno" });
  }

  try {
    const result = await db.query(
      `INSERT INTO stores (store_name)
       VALUES ($1)
       RETURNING *`,
      [store_name]
    );

    return res.status(201).json({
      message: `Uspješno smo unijeli store: ${store_name} `,
      store: result.rows[0],
    });
  } catch (err) {
    console.log("Error POSTING to stores table:", err.stack);
    res.status(400).json({ error: err.message });
  }
});
//-------------POST ITEMS
app.post("/items", async (req, res) => {
  const { item_name, price, store_id } = req.body;

  if (!item_name || !price || !store_id) {
    console.log("Data validation failed");
    return res
      .status(400)
      .json({ error: "Polja 'item_name', 'price', 'store_id'  su obavezna" });
  }

  try {
    const result = await db.query(
      `INSERT INTO items (item_name, price, store_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [item_name, price, store_id]
    );

    return res.status(201).json({
      message: `Uspješno smo unijeli item: ${item_name}, sa cijenom: ${price}`,
      item: result.rows[0],
    });
  } catch (err) {
    console.log("Error POSTING to items table:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

//---------------------------------------------------------------------------------------------- PUT
//-------------PUT STORES
app.put("/stores/:id", async (req, res) => {
  const id = req.params.id;
  const { store_name } = req.body;

  try {
    const result = await db.query(
      `
      UPDATE stores 
      SET store_name = $1
      WHERE id = $2
      RETURNING *`,
      [store_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Store sa tim id-em nije pronađena" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("Error updating stores:", err.stack);
    res.status(400).json({ error: err.message });
  }
});
//-------------PUT ITEMS
app.put("/items/:id", async (req, res) => {
  const id = req.params.id;
  const { item_name, price, store_id } = req.body;

  try {
    const result = await db.query(
      `
      UPDATE items 
      SET 
        item_name = $1,
        price = $2,
        store_id = $3
      WHERE id = $4
      RETURNING *`,
      [item_name, price, store_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item sa tim id-em nije pronađena" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("Error updating items:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

//---------------------------------------------------------------------------------------------- PUT
//-------------PUT STORES
app.delete("/stores/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query(`
        DELETE FROM stores 
        WHERE id = $1
        RETURNING *;`,
        [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Store sa tim id-em nije pronađen" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("Error GET store by ID:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

app.delete("/items/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query(`
        DELETE FROM items
        WHERE id = $1
        RETURNING *;`,
        [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Items sa tim id-em nije pronađen" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log("Error GET item by ID:", err.stack);
    res.status(400).json({ error: err.message });
  }
});

app.get("/", async (req, res) => {
  res.send(`
    <h1>CRUD operacije</h1>
    <ul>
        <li> GET /stores ------------ Dohavati sve stores </li>
        <li> GET /stores/:id -------- Dohvati stores po id-u</li>
        <li> GET /items ------------- Dohavati sve stores </li>
        <li> GET /items/:id --------- Dohvati stores po id-u</li>
        <li> POST /stores ----------- Dodaj novi store</li>
        <li> POST /item ------------- Dodaj novi item</li>
        <li> PUT /stores/:id -------- Ažuriraj postojeći store po id-u</li>
        <li> PUT /items/:id --------- Ažuriraj postojeći item po id-u</li>
        <li> DELETE /stores/:id ----- Brisanje store-a po id-u</li>
        <li> DELETE /items/:id ------ Brisanje item-a po id-u</li>
    </ul>
  `);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
