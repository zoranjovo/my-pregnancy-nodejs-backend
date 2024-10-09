const staticVids = [
  { name: 'Relaxing stability ball workout', desc: 'Relax with this stability ball workout that combines gentle movements to relieve stress and improve flexibility and core strength.', url: 'uznqUmKBDVw', time: '20 min' },
  { name: 'Intense cardio session', desc: 'Boost your cardiovascular fitness with this high-energy cardio session, perfect for burning calories and improving stamina.', url: 'T6_cRgYN40s', time: '30 min' },
  { name: 'Yoga for beginners', desc: 'A gentle introduction to yoga, focusing on basic poses and techniques to improve flexibility, strength, and balance.', url: 'v7AYKMP6rOE', time: '15 min' },
  { name: 'Quick HIIT workout', desc: 'An effective HIIT workout that burns calories and builds muscle in just 10 minutes, perfect for busy schedules.', url: 'ml6cT4AZdqI', time: '10 min' },
  { name: 'Meditation guide', desc: 'A guide to mindfulness and meditation techniques to reduce stress, improve concentration, and promote mental well-being.', url: 'inpok4MKVLM', time: '25 min' },
  { name: 'Strength training basics', desc: 'Learn the basics of strength training with exercises like squats, lunges, and push-ups to build muscle and improve strength.', url: 'UItWltVZZmE', time: '35 min' },
  { name: 'Advanced pilates', desc: 'Challenge yourself with advanced pilates exercises designed to improve core strength, flexibility, and overall body control.', url: 'lCg_gh_fppI', time: '40 min' },
  { name: 'Dance workout', desc: 'Get fit with this energetic dance workout that combines high-energy dance moves with fitness routines to burn calories and improve coordination.', url: 'ZWk19OVon2k', time: '45 min' },
];

module.exports = async (mclient, req, res) => {
  try {
    const db = mclient.db("my-pregnancy-dev");
    const videosCollection = db.collection('fitness-videos');
    
    // Fetch all videos from MongoDB collection
    const mongoVids = await videosCollection.find().toArray();
    
    // Combine static videos with those fetched from MongoDB
    const allVideos = [...staticVids, ...mongoVids];
    
    // Randomize the order of all videos
    const randomizedVideos = allVideos.sort(() => Math.random() - 0.5);
    
    // Return the randomized list of videos as JSON
    res.json(randomizedVideos);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
