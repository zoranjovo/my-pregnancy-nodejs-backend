const jwt = require('jsonwebtoken');
const multer = require('multer');

const multerUpload = multer({
  storage: multer.memoryStorage(), // Store the file in memory (buffer)
  limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit (e.g., 5MB)
  fileFilter: (req, file, cb) => {
    // Allow only png and jpg mimetypes
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only .png and .jpg formats under 10mb are allowed!'), false); // Reject the file
    }
  },
}).single('profilePhoto'); // Name of the form field for the file


module.exports = async (mclient, req, res, JWTsecret, minioClient) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { return res.status(401).send({ error: "No token provided" }); }

    // Verify the token
    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) { return res.status(401).send({ error: "Token invalid" }); }
    
    const db = mclient.db("my-pregnancy-dev");
    const collection = db.collection("users");

    // Fetch the user from the database
    const user = await collection.findOne({ email: decoded.email });
    if (!user) { return res.status(404).send({ error: "User not found" }); }


    multerUpload(req, res, async function (err) {
      if (err) { return res.status(400).send({ error: "File upload failed", details: err.message }); }
      if (!req.file) { return res.status(400).send({ error: "No file provided" }); }

      // Extract the uploaded file's buffer and original name
      const fileBuffer = req.file.buffer;
      const fileName = `${user._id}`;

      // Set up MinIO bucket and object details
      const bucketName = 'my-pregnancy-user-photos';
      const objectName = `${fileName}`; // Use a unique name for the uploaded object

      try {
        // Ensure the bucket exists (MinIO creates buckets dynamically if they don't exist)
        const bucketExists = await minioClient.bucketExists(bucketName);
        if (!bucketExists) {
          await minioClient.makeBucket(bucketName, 'us-east-1'); // Specify region if necessary
        }

        // Upload the file to MinIO
        await minioClient.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
          'Content-Type': req.file.mimetype
        });

        await collection.updateOne(
          { email: user.email },
          { $set: { pfpExists: true } }
        );

        return res.sendStatus(200);
      } catch (minioErr) {
        console.error('MinIO Error:', minioErr);
        return res.status(500).send({ error: "Error uploading to MinIO" });
      }
    });

  } catch (err) {
    console.log(err);
    if (err.name === "JsonWebTokenError") {
      res.status(401).send({ error: "Token is invalid" });
    } else {
      res.status(500).send({ error: "Internal Server Error" });
    }
  }
};