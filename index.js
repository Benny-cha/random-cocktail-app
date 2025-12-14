import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const PORT = 3100;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "cmddb",
  password: "123456",
  port: 5432,
});

db.connect();

app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// middleware to fetch cart count for every request
app.use(async (req, res, next) => {
  try {
    const result = await db.query("SELECT COUNT(*) as count FROM cart");
    res.locals.cartCount = parseInt(result.rows[0].count);
  } catch (error) {
    res.locals.cartCount = 0;
  }
  next();
});


// 🥂 HOME — Random Cocktail
app.get("/", async (req, res) => {

  try{
    const api_url = "https://www.thecocktaildb.com/api/json/v1/1/random.php";

    const response = await axios.get(api_url);

    console.log(response.data.drinks[0]);

    res.render("index", { drink: response.data.drinks[0] });

  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index",{
      error: error.message,
    });
  }
 
});

// 🛒 CART — Display Cart Items
app.get("/cart", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM cart");

    console.log("Cart items:", result.rows);
    console.log("First item ingredients:", result.rows[0]?.ingredients);
    console.log("Type:", typeof result.rows[0]?.ingredients);

    res.render("cart", { cartItems: result.rows });
  } catch (error) {
    console.error("Database query failed:", error.message);
    res.render("cart", {
      error: error.message,
      cartItems: [],
    });
  }
});

// ➕ ADD TO CART — Handle Form Submission
app.post("/add-to-cart", async (req, res) => {
  try {
    const { drinkId } = req.body;
    
    // Fetch drink details from API
    const response = await axios.get(
      `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`
    );
    const drink = response.data.drinks[0];
    
    // Build ingredients string
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
      const ing = drink[`strIngredient${i}`];
      const measure = drink[`strMeasure${i}`];
      if (ing) {
        ingredients.push(measure ? `${measure.trim()} ${ing}` : ing);
      }
    }
    const ingredientsString = ingredients.join(', ');
    
    // Insert into database
    await db.query(
      "INSERT INTO cart (drink_id, name, image, ingredients) VALUES ($1, $2, $3, $4)",
      [drink.idDrink, drink.strDrink, drink.strDrinkThumb, ingredientsString]
    );
    
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, message: 'Added to cart' });
    } else {
      res.redirect(req.get('referer') || '/');
    }
  } catch (err) {
    console.error(err);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ success: false, message: 'Error adding to cart' });
    } else {
      res.status(500).send("Error adding to cart");
    }
  }
});

app.post("/add-to-cart/:id", (req, res) => {
  const productId = req.params.id;

  if (!req.session.cart) req.session.cart = [];

  req.session.cart.push(productId);

  res.redirect("back"); // or your cart page
});

app.post("/remove-from-cart", async (req, res) => {
  const { id } = req.body;

  try {
    await db.query(
      "DELETE FROM cart WHERE id = $1",
      [id]
    );

    res.redirect("/cart");

  } catch (err) {
    console.error("Remove error:", err);
    res.status(500).send("Failed to remove item");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));