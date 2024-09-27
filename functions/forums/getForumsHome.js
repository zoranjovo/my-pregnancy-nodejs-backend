const { ObjectId } = require('mongodb');

module.exports = async (mclient, res, minioClient) => {
  try {
    const db = mclient.db("my-pregnancy-dev");
    const forumsCollection = db.collection("forums");
    const usersCollection = db.collection("users");

    // Find the most recent post for each category: general, info, support
    const categories = ['general', 'info', 'support'];
    const categoryPosts = {};

    for (const category of categories) {
      // Find the most recent post for the given category
      const post = await forumsCollection.findOne(
        { category },
        { sort: { date: -1 } } // Sort by date in descending order
      );

      if (post) {
        // Fetch user information for the author of the post
        const user = await usersCollection.findOne(
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

        // Attach the user data to the post
        post.user = {
          fullname: user.firstname + ' ' + user.lastname,
          pfpExists: user.pfpExists,
          role: user.role
        };

        // Add the post to the result object under the appropriate category
        categoryPosts[category] = post;
      } else {
        // No posts found for this category
        categoryPosts[category] = null;
      }
    }

    // Send the response with the category posts
    res.json({ ...categoryPosts, imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/` });
    
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
