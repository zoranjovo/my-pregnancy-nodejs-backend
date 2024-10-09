const resources = [
  {
    title: "Example",
    desc: "blah blah blah... 1st trimester",
    link: "example",
    bgIMG: "/assets/e51564f6e1c60c926aff35d378d5aa12.jpg",
    authorName: "Dr. Vera",
    doctorIMG: "/assets/2154d24d02286926b6e1b308e5640639.png",
    stageOfPregnancy: "1st Trimester",
  },
  {
    title: "Example",
    desc: "blah blah blah... 2nd trimester",
    link: "example",
    bgIMG: "/assets/e51564f6e1c60c926aff35d378d5aa12.jpg",
    authorName: "Dr. Vera",
    doctorIMG: "/assets/2154d24d02286926b6e1b308e5640639.png",
    stageOfPregnancy: "2nd Trimester",
  },
];

module.exports = async (mclient, req, res) => {
  try {
    res.json(resources);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};