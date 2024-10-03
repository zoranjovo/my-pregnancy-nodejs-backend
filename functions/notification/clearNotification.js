const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

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

    // Get the notification ID from the request params
    const { notificationId } = req.body;

    // Validate the notificationId
    if(!notificationId){ return res.status(400).json({ error: "Invalid or missing notification ID" }); }

    // Find the notification to ensure it belongs to the authenticated user (doctor)
    const notification = await notificationsCollection.findOne({ _id: new ObjectId(notificationId) });
    
    if(!notification){ return res.status(404).json({ error: "Notification not found" }); }

    // Ensure the user is authorized to delete this notification (belongs to the doctor)
    if(notification.doctorID !== user._id.toString()){ return res.status(403).json({ error: "You are not authorized to clear this notification" }); }

    // Delete the notification
    const result = await notificationsCollection.deleteOne({ _id: new ObjectId(notificationId) });

    if (result.deletedCount === 1) {
      // Notification was successfully deleted
      res.sendStatus(200);
    } else {
      // Notification was not found
      res.status(404).json({ error: "Notification not found" });
    }

  } catch (err) {
    console.error("Error clearing notification:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
