const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("journal-entries");

    // create schema
    const entryData = req.body;
    const entry = {
      userId: decoded.userId,
      ...entryData,
      date: Date.now()
    };

    // Insert the journal entry into the database
    const result = await collection.insertOne(entry);
    if (result.acknowledged) {
      res.status(200).send({ success: "Entry added successfully" });
    } else {
      res.status(500).send({ error: "Failed to add entry" });
    }
  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
