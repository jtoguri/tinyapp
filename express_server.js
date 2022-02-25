const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID"},
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "userRandomID" }
};

const SALTROUNDS = 10;
const password1 = "purple-monkey-dinosaur";
const hashedPassword1 = bcrypt.hashSync(password1, SALTROUNDS);

const password2 = "dishwasher-funk";
const hashedPassword2 = bcrypt.hashSync(password2, SALTROUNDS);

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: hashedPassword1
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: hashedPassword2
  }
}

function generateRandomString() {
  let result = '';
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 6;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result;
};

// Generate a random string until one is created that does not already exist in the provided database
function createNewId(database) {
  let id = '';
  do {
    id = generateRandomString();
  } while (database[id])

  return id;
}

function checkEmailExists(email, database) {
  for (const user in database) {
    if (database[user].email === email) return database[user].id;
  }
  return false;
}

function urlsForUser(id) {
  const urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url].longURL;
    }
  }
  return urls;
}

app.post("/urls", (req, res) => {

  const shortURL = createNewId(urlDatabase);
  
  // Add the short and long url key value pair to the database
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies['user_id'] };
  console.log(urlDatabase);

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urls = urlsForUser(req.cookies['user_id']);
  if (urls[req.params.shortURL]) delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect("/urls");
})

app.post("/urls/:shortURL", (req, res) => {
  const urls = urlsForUser(req.cookies['user_id']);
  if (urls[req.params.shortURL]) urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
})

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {  
  const templateVars = {
      user: users[req.cookies['user_id']],
      urls: urlsForUser(req.cookies['user_id']) 
    };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies['user_id']) res.redirect("/login");
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies['user_id']],
    urls: urlsForUser(req.cookies['user_id'])
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL =  urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const userId = checkEmailExists(req.body.email, users);
  if (!userId || !bcrypt.compareSync(req.body.password, users[userId].password)) res.sendStatus(403);
  res.cookie('user_id', userId);
  res.redirect('/urls');
  console.log(users);
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("registration_form", templateVars)
});

app.post("/register", (req, res) => {
  
  // Check if email or password is empty, or if email already exists
  // *NOTE potential refactoring this at later point, specifically test out res.status options compared to res.sendStatus
  if (req.body.email.length === 0 || req.body.password.length === 0 || checkEmailExists(req.body.email, users)) {
    res.sendStatus(400);
  }
  
  const userId = createNewId(users);

  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, SALTROUNDS)
  };
  
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login_form", templateVars)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});