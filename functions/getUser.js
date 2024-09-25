const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret, minioClient) => {
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
    const user = await collection.findOne({ email: decoded.email }, { projection: { password: 0 } });

    if(!user){return res.status(404).send({ error: "User not found" }); }

    const bucketName = 'my-pregnancy-user-photos';
    const objectName = user._id.toString();
    let profilePhotoUrl = null;

    // Check if the object exists in MinIO and generate a URL
    try {
      // You can either provide a pre-signed URL (valid for a limited time) or direct public URL
      profilePhotoUrl = await minioClient.presignedGetObject(bucketName, objectName);
    } catch (minioErr) {
      console.log('Error retrieving MinIO object:', minioErr);
      // If the object doesn't exist or there's an error, fallback or return null for profilePhotoUrl
      profilePhotoUrl = null; 
    }

    const userData = {
      ...user,
      profilePhotoUrl // Include the profile photo URL in the response
    };

    // Return the user data
    res.json(userData);
  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError") {
      res.status(401).send({ error: "Token is invalid" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
