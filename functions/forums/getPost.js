const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, minioClient) => {
  try {
    const db = mclient.db("my-pregnancy-dev");
    const forumsCollection = db.collection("forums");
    const usersCollection = db.collection("users");
    const repliesCollection = db.collection("post-replies");

    // Get the post ID from the request query
    const { postId } = req.query;

    if(!postId){ return res.status(400).json({ error: "Post ID is required" }); }

    let post;
    try {
      // Find the post by its _id
      post = await forumsCollection.findOne({ _id: new ObjectId(postId) });
      if(!post){ return res.status(404).json({ error: "Post not found" }); }
    } catch (err) {
      return res.status(400).json({ error: "Invalid Post ID format" });
    }

    // Fetch the author's information
    const author = await usersCollection.findOne(
      { _id: new ObjectId(post.authorID) },
      {
        projection: {
          firstname: 1,
          lastname: 1,
          pfpExists: 1,
          role: 1
        }
      }
    );

    // Attach the author's information to the post
    if (author) {
      post.user = {
        fullname: `${author.firstname} ${author.lastname}`,
        pfpExists: author.pfpExists,
        role: author.role
      };
    } else {
      post.user = { fullname: "Unknown", pfpExists: false, role: "guest" };
    }

    // Fetch all replies for this post from the "post-replies" collection
    const replies = await repliesCollection.find({ postID: postId }).toArray();

    // Enrich each reply with the user's information
    const enrichedReplies = await Promise.all(replies.map(async (reply) => {
      const user = await usersCollection.findOne(
        { _id: new ObjectId(reply.userID) },
        {
          projection: {
            firstname: 1,
            lastname: 1,
            pfpExists: 1,
            role: 1
          }
        }
      );

      reply.user = user
        ? {
            fullname: `${user.firstname} ${user.lastname}`,
            pfpExists: user.pfpExists,
            role: user.role
          }
        : { fullname: "Unknown", pfpExists: false, role: "guest" };

      return reply;
    }));

    // increment view count
    await forumsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { views: 1 } } // Increment the views count
    );

    // Send the response with the enriched post and replies
    res.json({
      post,
      replies: enrichedReplies,
      imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/`
    });

  } catch (err) {
    console.error("Error fetching post or replies:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
