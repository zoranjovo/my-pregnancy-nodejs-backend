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
    const consultationRequestsCollection = db.collection("consultation-requests");

    const { consultationid, newstatus } = req.body;

    // fetch consultation by id and ensure it exists
    const consultation = await consultationRequestsCollection.findOne({ _id: new ObjectId(consultationid) });
    if(!consultation){ return res.status(404).send({ error: "Consultation not found" }); }

    // validate new state is valid
    const validStatus= ["accepted", "rejected", "completed", "cancelled"];
    if(!validStatus.includes(newstatus)){ return res.status(400).send({ error: "Invalid state value" }); }
    if(consultation.status === "pending"){
      if(newstatus === "completed"){ return res.status(400).send({ error: "Invalid state value" }); }
    }
    if(consultation.status === "accepted"){
      if(newstatus === "rejected"){ return res.status(400).send({ error: "Invalid state value" }); }
    }
    if(consultation.status === "rejected"){ return res.status(400).send({ error: "Invalid state value" }); }
    if(consultation.status === "cancelled"){ return res.status(400).send({ error: "Invalid state value" }); }

    // update consultation request with new state
    const result = await consultationRequestsCollection.updateOne({ _id: new ObjectId(consultationid) }, { $set: { status: newstatus } });

    // check if update was successful
    if (result.modifiedCount === 0) { return res.status(400).send({ error: "State not changed" }); }

    // send success msg
    res.status(200).send({ message: `Successfully ${newstatus} consultation` });

  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
