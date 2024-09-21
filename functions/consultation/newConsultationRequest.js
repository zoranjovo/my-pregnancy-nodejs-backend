const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb')

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
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
    if (result.acknowledged) {
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
