const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
    try {
      const {email, password} = req.body;

      if(!email){ return res.status(500).send("Invalid email"); }
      if(!password){ return res.status(500).send("Invalid password"); }

      const db = mclient.db("my-pregnancy-dev");
      const collection = db.collection("users");

      const user = await collection.findOne({ email: email });
      if(!user) { return res.status(404).send("User not found"); }

      // Compare the password with the hashed password stored in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch) { return res.status(401).send("Invalid password"); }

      // Generate a JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        JWTsecret,
        { expiresIn: '365d' }
      );

      res.json({ token: token });
    } catch (err) {
      res.status(500).send("Internal Server Error: " + err.message);
      console.log('Error:', err);
    }
  }