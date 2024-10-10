const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, minioClient) => {
  try {
    const db = mclient.db("my-pregnancy-dev");
    const resourcesCollection = db.collection('resources');
    const usersCollection = db.collection('users');

    // Fetch all resources from the collection
    const resources = await resourcesCollection.find().toArray();

    // For each resource, fetch the author's name from the users collection
    const resourcesWithAuthorNames = await Promise.all(
      resources.map(async (resource) => {
        const author = await usersCollection.findOne(
          { _id: new ObjectId(resource.author)},
        );

        // If author is found, add authorName to the resource
        if (author) {
          resource.authorName = `Dr. ${author.firstname} ${author.lastname}`;
          resource.pfpExists = author.pfpExists;
        } else {
          resource.authorName = "Unknown Author"; // Fallback if author not found
        }

        return resource;
      })
    );

    res.json({ resources: resourcesWithAuthorNames, imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/` });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};