const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded) { return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("users");

    // Fetch the user from the database excluding _id and password
    const user = await collection.findOne({ email: decoded.email }, { projection: { _id: 0, password: 0 } });

    if (!user) {return res.status(404).send({ error: "User not found" }); }

    // Return the user data
    res.json(user);
  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError") {
      res.status(401).send({ error: "Token is invalid" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
