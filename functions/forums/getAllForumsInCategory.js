const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, minioClient) => {
  try {
    const db = mclient.db("my-pregnancy-dev");
    const forumsCollection = db.collection("forums");
    const usersCollection = db.collection("users");

    // Get the category from the request body
    const { category } = req.query;

    if(!category){ return res.status(400).json({ error: "Category is required" }); }

    const validCategories = ['general', 'info', 'support'];
    if(!validCategories.includes(category)){ return res.status(400).json({ error: "Category is invalid" }); }

    // Find all posts in the specified category, sorted by date in descending order
    const posts = await forumsCollection.find(
      { category }, 
      { sort: { date: -1 } } // Sort by date descending
    ).toArray();

    // If no posts are found, return an empty array
    if (posts.length === 0) { return res.json({ posts: [], imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/` }); }

    // Fetch user information for each post and attach it to the post
    const enrichedPosts = await Promise.all(posts.map(async post => {
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

      if (user) {
        post.user = {
          fullname: user.firstname + ' ' + user.lastname,
          pfpExists: user.pfpExists,
          role: user.role
        };
      } else {
        post.user = null; // Handle case where user info is not found
      }

      return post;
    }));

    // Send the response with the posts and images URL
    res.json({ posts: enrichedPosts, imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/` });
    
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
