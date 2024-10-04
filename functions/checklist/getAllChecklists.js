module.exports = async (mclient, res) => {
  try {
    const db = mclient.db('my-pregnancy-dev');
    const checklists = await db.collection('checklists').find().toArray();
    res.status(200).json(checklists);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};