// Import the express framework
const express = require("express");

// Import all of the middleware
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');


// Import the helper functions
const { getUserByEmail, generateRandomString, createNewId, urlsForUser } = require("./helpers.js");

// Create a new express server
const app = express();
const PORT = 8080; // default port 8080

// Set EJS as the template engine for the app
app.set("view engine", "ejs");

// Use the body-parser library to parse incoming request bodies in a middleware before the handlers
app.use(bodyParser.urlencoded({extended: true}));

// Use the method-override library to override request methods
app.use(methodOverride('_method'))

// Use the cookie session middleware to encrypt cookies, note that in practice a more robust secret key should be used (longer and more random)
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

// An example database containing existitng urls so there is pre-existing data on server start
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID"},
  "b6UTxQ": { longURL: "https://www.tsn.ca", userID: "userRandomID" }
};

// Hashing of the example users' passwords using bcrypt
const SALTROUNDS = 10;
const password1 = "purple-monkey-dinosaur";
const hashedPassword1 = bcrypt.hashSync(password1, SALTROUNDS);

const password2 = "dishwasher-funk";
const hashedPassword2 = bcrypt.hashSync(password2, SALTROUNDS);

// The users object stores the data for all of the users, the first two users are examples so that user data already exists on server startup
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

app.listen(PORT, () => {
  // console.log(`Example app listening on port ${PORT}!`);
});

// The index page redirects to the urls page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Route handler to display the current user's urls
app.get("/urls", (req, res) => {

  // Include the object containing the current user's info and the list of urls that belong to them as template variables
  // If the user is not logged the user object will be undefined and the list of urls will be emptyx
  const templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id, urlDatabase) 
    };
  res.render("urls_index", templateVars);
});

// Route handler to create a new url and add it to the url datatbase
app.post("/urls", (req, res) => {

  // Create a unique short url
  const shortURL = createNewId(urlDatabase);
  
  // Add the short url to the url database
  // Each short url is an object containing the corresponding long url and the id of the user it belongs to
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  // Redirect the user to the page displaying the long url they just added along with the corresponding short url
  res.redirect(`/urls/${shortURL}`);
});

// Route handler to display the page for users to add a new url
app.get("/urls/new", (req, res) => {

  // If the user is not logged in they are redirected to the login page
  if (!req.session.user_id) res.redirect("/login");

  // If the user is logged in, include the object containing the current user's info as a template variable
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

// Route handler to look up a short url in the url database and redirect users to the corresponding long url
app.get("/u/:shortURL", (req, res) => {

  // If the specified short url does not exist, the user is redirected to the home page
  if (!urlDatabase[req.params.shortURL]) res.redirect("/urls");

  // If the shor url exists the user is redirected to the long url
  const longURL =  urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Rout handler to view info about a provided short url, as well as edit the long url if the url belongs to the user
app.get("/urls/:shortURL", (req, res) => {

  // If the short url does not exist in the database, redirect the user to the home page
  if (!urlDatabase[req.params.shortURL]) res.redirect("/urls");
  
  // Include the short/long urls, the object containing the user's info, and the list of the user's urls as template variables
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render("urls_show", templateVars);
});

// Route handler to allow users to update a url from the app
app.put("/urls/:shortURL", (req, res) => {

  // Access the urls that belong to the current user
  const urls = urlsForUser(req.session.user_id, urlDatabase);

  // If the url to be updated belongs to the current user then update it
  if (urls[req.params.shortURL]) urlDatabase[req.params.shortURL].longURL = req.body.longURL;

  // Redirect the user to the home page to see their full url list
  res.redirect("/urls");
})

// Route handler to delete a url from the url database
app.delete("/urls/:shortURL", (req, res) => {
  
  // Access the urls that belong to the current user, if the user is not logged in this will be empty
  const urls = urlsForUser(req.session.user_id, urlDatabase);

  // Delete the url specified only if it belongs to the current user, it the url does not belong to thc current user no changes will be made
  if (urls[req.params.shortURL]) delete urlDatabase[req.params.shortURL];
  
  // Redirect to the home page so the user may see any changes
  res.redirect("/urls");
})

// Route handler to render the login page
app.get("/login", (req, res) => {

  // If the user is already logged in, redirect them to the home page
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  
  // Set the user to be null and render the login form
  const templateVars = { user: null };
  res.render("login_form", templateVars);
})

// Route handler to allow users to login to the app
app.post("/login", (req, res) => {

  // Confirm the user has inputed an existing email
  const userId = getUserByEmail(req.body.email, users);

  // If the user did not input a valid email or password then a 'forbidden' HTTP response status code is sent, indicating the user is un-authorized
  if (!userId || !bcrypt.compareSync(req.body.password, users[userId].password)) {
    return res.status(403).send("Invalid email or password.");
  }

  // If the user is valid, set the user_id cookie to be the user id corresponding to the provided email
  req.session.user_id = userId;
  res.redirect('/urls');
});

// Allow users to logout by clearing the session cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Render the registration form for new users
app.get("/register", (req, res) => {
  
  // If the user is already logged in, redirect them to the home page
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  
  // Set the user to be null and render the registration form
  const templateVars = { user: null };
  res.render("registration_form", templateVars)
});

// Add new users to the user object
app.post("/register", (req, res) => {
  
  // If the email/password are empty, or if the email already exists a 400 status code will be sent, signalling a bad request due to client error
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    return res.status(400).send("Invalid email or password.");
  }
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send("A account with this email already exists.");
  }
  
  // Generate a new user id
  const userId = createNewId(users);

  // Add the the new user id ot the users object along with the provided email/password
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, SALTROUNDS)
  };
  
  // Set the user_id cookie to be the newly added user id
  req.session.user_id = userId;
  res.redirect('/urls');
});