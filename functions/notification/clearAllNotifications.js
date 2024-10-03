const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) {
      return res.status(401).json({ error: "Token invalid" });
    }

    const db = mclient.db("my-pregnancy-dev");
    const usersCollection = db.collection("users");
    const notificationsCollection = db.collection("notifications");

    // Fetch the user from the database using the email from the decoded token
    const user = await usersCollection.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clear all notifications for the current doctor (doctorID)
    const result = await notificationsCollection.deleteMany({ doctorID: user._id.toString() });

    if (result.deletedCount > 0) {
      res.status(200).json({ message: `Successfully cleared ${result.deletedCount} notifications` });
    } else {
      res.status(404).json({ message: "No notifications found to clear" });
    }

  } catch (err) {
    console.error("Error clearing notifications:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token is invalid or expired" });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
