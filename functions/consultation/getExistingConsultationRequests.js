const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){ return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const usersCollection = db.collection("users");

    // Fetch the user from the database using the email from the decoded token
    const user = await usersCollection.findOne({ email: decoded.email });
    if(!user){ return res.status(404).send({ error: "User not found" });}

    const consultationRequestsCollection = db.collection("consultation-requests");

    if (user.role === "pregnant") {
      // Fetch the pregnant user's consultation requests
      const requests = await consultationRequestsCollection.find({ userId: user._id.toString() }).toArray();

      // Fetch doctor details for each consultation request
      const updatedRequests = await Promise.all(
        requests.map(async (request) => {
          const doctor = await usersCollection.findOne({ _id: new ObjectId(request.doctorId) });
          if (doctor) {
            request.doctorName = `${doctor.firstname} ${doctor.lastname}`;
          }
          return request;
        })
      );

      res.json({ role: user.role, requests: updatedRequests });

    } else if (user.role === "doctor") {
      // Fetch the doctor's consultation requests
      const requests = await consultationRequestsCollection.find({ doctorId: user._id.toString() }).toArray();

      // Fetch user (pregnant person) details for each consultation request
      const updatedRequests = await Promise.all(
        requests.map(async (request) => {
          const pregnantUser = await usersCollection.findOne({ _id: new ObjectId(request.userId) });
          if (pregnantUser) {
            request.userName = `${pregnantUser.firstname} ${pregnantUser.lastname}`;
          }
          return request;
        })
      );

      res.json({ role: user.role, requests: updatedRequests });

    } else {
      return res.status(400).send({ error: "Invalid user role" });
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
