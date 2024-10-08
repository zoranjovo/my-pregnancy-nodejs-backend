const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = async (mclient, req, res, JWTsecret) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: "No token provided" });

    const decoded = jwt.verify(token, JWTsecret);
    if (!decoded) return res.status(401).send({ error: "Token invalid" });

    const db = mclient.db("my-pregnancy-dev");
    const users = db.collection("users");
    const user = await users.findOne({ email: decoded.email });
    if (!user) return res.status(404).send({ error: "User not found" });

    const { id } = req.params;

    const result = await db.collection("checklists").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Checklist not found" });
    }

    res.status(200).json({ message: "Checklist deleted successfully" });
  } catch (err) {
    console.error("Error deleting checklist:", err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
