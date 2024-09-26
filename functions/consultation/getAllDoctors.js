module.exports = async (mclient, req, res, minioClient) => {
  try {

    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("users");

    // Fetch the user from the database excluding _id and password
    const doctors = await collection.find(
      { 
        role: "doctor",
        specialization: { $ne: "", $exists: true },
        yearsExperience: { $ne: "", $exists: true, $ne: null },
        aphraVerification: { $ne: "", $exists: true, $ne: null },
        gender: { $ne: "", $exists: true }
      }, 
      { projection: { _id: 1, firstname: 1, lastname: 1, specialization: 1, yearsExperience: 1, aphraVerification: 1, gender: 1, pfpExists: 1 } }
    ).toArray();
    
    // Return the doctors
    res.json({doctors: doctors, imagesURL: `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/my-pregnancy-user-photos/`});
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
