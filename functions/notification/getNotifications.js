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
    const notificationsCollection = db.collection("notifications");

    // Fetch the user from the database using the email from the decoded token
    const user = await usersCollection.findOne({ email: decoded.email });
    if(!user){ return res.status(404).send({ error: "User not found" }); }

    // Fetch notifications for the doctor (match doctorID with user's _id as string)
    const notifications = await notificationsCollection
      .find({ doctorID: user._id.toString() }) // doctorID matches the current user's ID
      .toArray();

    // Return the notifications
    res.json(notifications);

  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
