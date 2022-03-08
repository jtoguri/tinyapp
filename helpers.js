// Contains helper functions for the server

// Function that takes in an email and a database of users then retrives the user id of the user that email belongs to
function getUserByEmail(email, database) {
  
  // If a user in the database has the same email as the one provided that user's id is returned
  for (const user in database) {
    if (database[user].email === email) return database[user].id;
  }

  // If no user exists with the email, the function returns undefined
  return undefined;
}

// Generate a random string of 6 characters which can include lower/upper case letters and numbers 0-9
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

// Function that returns the urls that belong to a user, given the user id and a database of urls
function urlsForUser(id, database) {
  const urls = {};
  
  // Loop over the url database and compare each corresponding user id to the given user id
  // If the user ids match, the url object gets added to the list of urls
  for (const url in database) {
    if (database[url].userID === id) {
      urls[url] = database[url].longURL;
    }
  }

  return urls;
}


module.exports = {
  getUserByEmail,
  generateRandomString,
  createNewId,
  urlsForUser
}