const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb')

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    const db = mclient.db("my-pregnancy-dev");

    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){return res.status(401).send({ error: "Token invalid" }); }

    const users = db.collection("users");
    const user = await users.findOne({ email: decoded.email });
    if(!user){ return res.status(404).send({ error: "User not found" }); }

    const doctorsCollection = db.collection("users");
    const consultationRequestsCollection = db.collection("consultation-requests");

    const { date, reason, communication, consultant } = req.body;

    // Validate that consultant is a valid doctor
    if(!ObjectId.isValid(consultant)) { return res.status(400).send({ error: "Invalid consultant ID" }); }
    const doctor = await doctorsCollection.findOne({ _id: new ObjectId(consultant) });
    if(!doctor){ return res.status(400).send({ error: "Consultant not found" }); }

    // Check if the user already has a booking with the same doctor
    const existingConsultation = await consultationRequestsCollection.findOne({ status: "pending", userId: decoded.userId, doctorId: consultant });
    if(existingConsultation){ return res.status(400).send({ error: "You already have a consultation request pending with this doctor" }); }

    // Create the consultation request entry
    const consultationRequest = {
      status: "pending",
      userId: decoded.userId,
      doctorId: consultant,
      date: new Date(date).getTime(),
      reason : reason,
      communicationMedium: communication,
      createdAt: Date.now()
    };

    // Insert the consultation request into the database
    const result = await consultationRequestsCollection.insertOne(consultationRequest);
    if(result.acknowledged){
      const notificationsCollection = db.collection("notifications");
      const notification = {
        doctorID: consultant,
        notificationText: `You have a new consultation booking from ${user.firstname} ${user.lastname}`,
        date: new Date().toISOString(),
        link: `/consultation/manage`
      };
      await notificationsCollection.insertOne(notification);

      res.sendStatus(200);
    } else {
      res.status(500).send({ error: "Failed to add consultation request" });
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
