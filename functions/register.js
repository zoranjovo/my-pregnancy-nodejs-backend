const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const roles = ["doctor", "pregnant", "other"]
module.exports = async (mclient, req, res, JWTsecret) => {
    try {
      const {role, firstname, lastname, email, password} = req.body;

      if(!roles.includes(role)){ return res.status(500).send("Invalid role"); }
      if(!firstname){ return res.status(500).send("Invalid name"); }
      if(!lastname){ return res.status(500).send("Invalid name"); }
      if(!email){ return res.status(500).send("Invalid email"); }
      if(!password){ return res.status(500).send("Invalid password"); }

      const db = mclient.db("my-pregnancy-dev");
      const collection = db.collection("users");

      // check if email is already in use
      const existingUser = await collection.findOne({ email: email });
      if(existingUser){ return res.status(409).send("Email already in use"); }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const doc = {
        role: role,
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: hashedPassword,
        pfpExists: false,
      }

      const result = await collection.insertOne(doc);

      // Generate a JWT token
      const token = jwt.sign(
        { userId: result.insertedId.toString(), email: email },
        JWTsecret,
        { expiresIn: '365d' }
      );

      // insert to db
      if (result.acknowledged) {
          return res.json({ token: token });
      } else {
          return res.status(500).send("Failed to insert data");
      }
    } catch (err) {
      res.status(500).send("Internal Server Error: " + err.message);
      console.log('Error:', err);
    }
  }