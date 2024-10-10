const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send({ error: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) {
      return res.status(401).send({ error: "Token invalid" });
    }

    // Get the video ID from the request body or URL parameters (as needed)
    const videoId = req.params.id || req.body.id;
    if (!videoId) {
      return res.status(400).send({ error: "No video ID provided" });
    }

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("resources");

    // Convert the videoId to an ObjectId type and delete if it matches the user's ID
    const result = await collection.deleteOne({ 
      _id: new ObjectId(videoId), 
      author: decoded.userId 
    });

    // Check if any document was deleted
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Resource not found or unauthorized" });
    }

    // Success response
    res.status(200).send({ success: "Resource deleted successfully" });
  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else if (err.name === "BSONTypeError") {
      res.status(400).send({ error: "Invalid resource ID format" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
