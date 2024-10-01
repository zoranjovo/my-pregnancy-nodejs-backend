const { ObjectId } = require('mongodb');
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
    const usersCollection = db.collection("users");
    const forumsCollection = db.collection("forums");
    const repliesCollection = db.collection("post-replies");

    // Fetch the user based on the decoded token email
    const user = await usersCollection.findOne({ email: decoded.email });
    if(!user){ return res.status(404).send({ error: "User not found" }); }

    // Get the postId and reply text from the request body
    const { postId, replyText } = req.body;

    if(replyText.length > 500){ return res.status(400).json({ error: "Max reply length is 500 characters" });}
    
    // Validate postId and replyText
    if(!postId || !ObjectId.isValid(postId)){ return res.status(400).json({ error: "Invalid or missing Post ID" }); }
    if(!replyText || replyText.trim() === ""){ return res.status(400).json({ error: "Reply text cannot be empty" }); }

    // Check if the post exists
    const post = await forumsCollection.findOne({ _id: new ObjectId(postId) });
    if(!post){ return res.status(404).json({ error: "Post not found" }); }

    // Create a new reply
    const newReply = {
      postID: postId,
      userID: user._id.toString(),
      message: replyText,
      date: new Date().toString(),
    };

    // Insert the new reply into the post-replies collection
    await repliesCollection.insertOne(newReply);

    // Update the reply count in the original post
    await forumsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { replies: 1 } } // Increment the reply count
    );

    // Return success response
    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
