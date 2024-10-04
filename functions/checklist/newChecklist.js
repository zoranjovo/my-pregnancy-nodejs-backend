const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const checklistsCollection = db.collection("checklists");

    const { heading, items } = req.body;

    // Ensure the request body contains the necessary fields
    if (!heading || !items || !Array.isArray(items)) {
      return res.status(400).send({ error: "Invalid data" });
    }

    // Create the new checklist object
    const newChecklist = {
      heading: heading,
      items: items,
      isEditing: false,
      userId: new ObjectId(decoded.userId), // Attach the user ID from the token
      createdAt: new Date(),
    };

    // Insert the checklist into the database
    const result = await checklistsCollection.insertOne(newChecklist);

    if (result.acknowledged) {
      res.status(201).json({ message: 'Checklist created successfully' });
    } else {
      res.status(500).json({ error: "Failed to create checklist" });
    }

  } catch (err) {
    console.error('Error creating checklist:', err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
