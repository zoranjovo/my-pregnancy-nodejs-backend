const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){ return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const usersCollection = db.collection("users");

    // Fetch the user from the database using the email from the decoded token
    const user = await usersCollection.findOne({ email: decoded.email }, { projection: { _id: 1 } });
    if(!user){ return res.status(404).send({ error: "User not found" }); }

    const fitnessVideosCollection = db.collection("fitness-videos");

    // Fetch all fitness video entries for the user using the user's _id
    const videos = await fitnessVideosCollection.find({ author: user._id.toString() }).toArray();

    // Return the videos in a JSON array
    res.json(videos.reverse());
  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
