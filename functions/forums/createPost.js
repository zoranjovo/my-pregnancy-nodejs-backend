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

    // Fetch the user based on the decoded token email
    const user = await usersCollection.findOne({ email: decoded.email });
    if(!user){ return res.status(404).send({ error: "User not found" }); }

    // Get category, title, and post content from the request body
    const { category, title, postText } = req.body;

    // Validate input fields
    if(!category || !title || !postText){ return res.status(400).json({ error: "Category, title, and post text are required" }); }

    const validCategories = ['general', 'info', 'support'];
    if(!validCategories.includes(category)){ return res.status(400).json({ error: "Category is invalid" }); }

    // Create a new post object
    const newPost = {
      category: category,
      title: title,
      post: postText,
      authorID: user._id.toString(),
      date: new Date().toString(),
      views: 0,
      replies: 0,
    };

    // Insert the new post into the forums collection
    const result = await forumsCollection.insertOne(newPost);

    // Return success response with the created post ID
    res.status(200).json({
      message: "Post created successfully",
      postId: result.insertedId,
    });

  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      res.status(401).send({ error: "Token is invalid or expired" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};
