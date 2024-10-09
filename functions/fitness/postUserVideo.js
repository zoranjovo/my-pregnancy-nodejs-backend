const jwt = require('jsonwebtoken');

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

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("fitness-videos");

    // Create the video entry schema
    const { title, desc, url, time } = req.body;
    const videoEntry = {
      author: decoded.userId,
      name: title,
      desc: desc,
      url: url,
      time: time
    };

    // Insert the video entry into the database
    const result = await collection.insertOne(videoEntry);
    if (result.acknowledged) {
      res.status(200).send({ success: "Video added successfully" });
    } else {
      res.status(500).send({ error: "Failed to add video" });
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