const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) { return res.status(401).send({ error: "Token invalid" }); }

    // Fetch the user from the database
    const db = mclient.db("my-pregnancy-dev");
    const users = db.collection("users");
    const user = await users.findOne({ email: decoded.email });
    if (!user) { return res.status(404).send({ error: "User not found" }); }

    // Extract checklist ID and data from the request
    const { id } = req.params;
    const { heading, items } = req.body;

    // Validate input
    if (!heading || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Prepare updated checklist
    const updatedChecklist = {
      heading,
      items,
    };

    // Update checklist in the database
    const result = await db.collection("checklists").updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedChecklist }
    );

    // Check if the update was successful
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    res.status(200).json({ message: "Checklist updated successfully" });

  } catch (err) {
    console.error("Error updating checklist:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
