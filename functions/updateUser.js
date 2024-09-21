const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) { return res.status(401).send({ error: "Token invalid" }); }

    // Ensure the request is sending JSON content
    if (req.headers['content-type'] !== 'application/json'){ return res.status(400).send({ error: "Invalid content type, expected application/json" }); }

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("users");

    // Fetch the user from the database
    const user = await collection.findOne({ email: decoded.email });
    if (!user) { return res.status(404).send({ error: "User not found" }); }

    // Get the user's role
    const { role } = user;

    // Get updated user data from request body
    const {
      firstname, lastname, phone, dob, address,
      aphraVerification, specialization, yearsExperience, gender,
      weight, pregnancyMonth, conceptionDate, bloodType, allergens
    } = JSON.parse(req.body.data);

    let updatedFields = {
      ...(firstname !== undefined && { firstname }),
      ...(lastname !== undefined && { lastname }),
      ...(phone !== undefined && { phone }),
      ...(dob !== undefined && { dob: new Date(dob).getTime() }), // Convert DOB to timestamp
      ...(address !== undefined && { address }),
    };

    // Update fields based on the user's role
    if (role === "pregnant") {
      // Pregnant users can update health-related fields
      updatedFields = {
        ...updatedFields,
        ...(weight !== undefined && { weight }),
        ...(pregnancyMonth !== undefined && { pregnancyMonth }),
        ...(conceptionDate !== undefined && { conceptionDate: new Date(conceptionDate).getTime() }), // Convert conception date to timestamp
        ...(bloodType !== undefined && { bloodType }),
        ...(allergens !== undefined && { allergens }),
      };
    } else if (role === "doctor") {
      // Doctors can update professional-related fields
      updatedFields = {
        ...updatedFields,
        ...(aphraVerification !== undefined && { aphraVerification }),
        ...(specialization !== undefined && { specialization }),
        ...(yearsExperience !== undefined && { yearsExperience }),
        ...(gender !== undefined && { gender }),
      };
    } else {
      // If the role is not recognized, return an error
      return res.status(400).send({ error: "Invalid user role" });
    }

    // Check if there are any fields to update
    if (Object.keys(updatedFields).length === 0) { return res.status(400).send({ error: "No fields to update" }); }

    // Update the user in the database
    const updateResult = await collection.updateOne(
      { email: decoded.email },
      { $set: updatedFields }
    );

    if (updateResult.modifiedCount === 0) { return res.status(400).send({ error: "Nothing was updated" }); }

    // Return 200 for success
    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError") {
      res.status(401).send({ error: "Token is invalid" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};