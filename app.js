const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
const dbPath = path.join(__dirname, "userData.db");
const port = 3000;
let db = null;

app.use(express.json());

async function dbServer() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(port, () => {
      console.log(`server is running on localhost:${port}`);
    });
  } catch (error) {
    console.log(err.message);
    process.exit(1);
  }
}

dbServer();

//get User
app.get("/users/", async (req, res) => {
  const getUserQuery = `SELECT * FROM user;`;
  const dbUser = await db.all(getUserQuery);
  res.send(dbUser);
});

//add User
app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  if (password.length < 5) {
    res.status(400).send("Password is too short");
    throw new Error("Password is too short");
  }
  const getUserQuery = `SELECT * FROM user WHERE username="${username}";`;
  try {
    const dbUser = await db.get(getUserQuery);
    if (!dbUser) {
      const hashPassword = await bcrypt.hash(password, 10);
      const addUserQuery = `INSERT INTO user (name,username, password, gender, location) 
            VALUES (
                "${name}",
                "${username}",
            "${hashPassword}",
            "${gender}",
            "${location}"
            );
        `;
      await db.run(addUserQuery);
      res.status(200).send("User created successfully");
    } else {
      res.status(400).send("User already exists");
    }
  } catch (error) {
    console.error(error.message);
  }
});

//delete user
app.delete("/users/:id/", async (req, res) => {
  const { id } = req.params;
  const removeUserQuery = `DELETE FROM user WHERE username="${id}";`;
  await db.run(removeUserQuery);
  res.send(`deleted the username:${id}`);
});

//Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(getUserQuery);
  if (!dbUser) {
    res.status(400).send("Invalid user");
  } else {
    const isMatch = await bcrypt.compare(password, dbUser.password);
    console.log(isMatch);
    if (isMatch) {
      res.status(200).send("Login success!");
    } else {
      res.status(400).send("Invalid password");
    }
  }
});

// update user Data
app.put("/change-password/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { username, oldPassword, newPassword } = req.body;
  if (newPassword.length < 5) {
    res.status(400).send("Password is too short");
    throw new Error("Password is too short");
  }
  const getUserQuery = `SELECT * FROM user WHERE username="${username}";`;
  try {
    const dbUser = await db.get(getUserQuery);
    const isMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isMatch) {
      const updateHashPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `UPDATE user
        SET password="${updateHashPassword}"
        WHERE username = "${username}";`;
      await db.run(updateQuery);
      res.status(200).send("Password updated");
    } else {
      res.status(400).send("Invalid current password");
    }
  } catch (error) {
    console.error(error.message);
  }
});
