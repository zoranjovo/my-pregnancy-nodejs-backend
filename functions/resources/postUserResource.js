const jwt = require('jsonwebtoken');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if(!token){ return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if(!decoded){ return res.status(401).send({ error: "Token invalid" }); }

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("resources");
    const { title, desc, url, content, stage, imgurl } = req.body;

    //check if the url is already taken if so then return an error that says url already taken
    const existingResource = await collection.findOne({ url: url });
    if(existingResource){ return res.status(400).json({ error: "URL already taken" }); }

    const resourceEntry = {
      author: decoded.userId,
      name: title,
      desc: desc,
      url: url,
      content: content,
      stage: stage,
      imgurl: imgurl,
    };

    // Insert the video entry into the database
    const result = await collection.insertOne(resourceEntry);
    if (result.acknowledged) {
      res.status(200).send({ success: "Resource added successfully" });
    } else {
      res.status(500).send({ error: "Failed to add resource" });
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