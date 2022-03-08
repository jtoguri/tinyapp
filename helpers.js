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

module.exports = {
  getUserByEmail
}