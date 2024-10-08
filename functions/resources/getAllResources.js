// unused

const resources = [
  {title: "Example", url: "example", desc: "blah blah blah"},
  {title: "Example", url: "example", desc: "blah blah blah"},
  {title: "Example", url: "example", desc: "blah blah blah"},
  {title: "Example", url: "example", desc: "blah blah blah"},
];

module.exports = async (mclient, req, res) => {
  try {
    res.json(resources);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};