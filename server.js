// CHECK THAT THE CONFIG.JS IS THE SAME AS WHAT IT IS ON DISCORD IF YOU GET ERRORS

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json'));

const register = require('./functions/register.js'); 
const login = require('./functions/login.js'); 
const getUser = require('./functions/getUser.js');
const updateUser = require('./functions/updateUser.js');
const updateUserPhoto = require('./functions/updateUserPhoto.js');
const newJournalEntry = require('./functions/journal/newJournalEntry.js');
const getAllJournalEntries = require('./functions/journal/getAllEntries.js');
const getAllFitnessVideos = require('./functions/fitness/getAllFitnessVideos.js');
const getAllDoctors = require('./functions/consultation/getAllDoctors.js');
const newConsultationRequest = require('./functions/consultation/newConsultationRequest.js');
const getExistingConsultationRequests = require('./functions/consultation/getExistingConsultationRequests.js');
const updateConsultationState = require('./functions/consultation/updateConsultationState.js');

const PORT = 8000;

//mongo
const {MongoClient} = require('mongodb');
const mclient = new MongoClient(config.mongoURL);
async function connectMongo(){
  try {
    await mclient.connect();
  } catch(err) {
    console.log(err)
  } finally {
    console.log('connected to mongo')
  }
}
connectMongo()

//express
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(500).json({ error: true, errorMsg: 'Malformed JSON' });
      throw new Error('Malformed JSON');
    }
  }
}));

app.use((err, req, res, next) => {
  if (res.headersSent) { return next(err); }
  res.status(500).json({ error: true, errorMsg: 'Malformed JSON' });
});

app.use(cors())
app.listen(PORT, () => { console.log(`express server active, http://localhost:${PORT}`); });

const Minio = require('minio');
const minioClient = new Minio.Client({
  endPoint: config.minioURL,
  port: 9000,
  useSSL: false,
  accessKey: config.minioUsr,
  secretKey: config.minioPwd
});


app.get('//test', async (req, res) => { res.sendStatus(200); });

app.post('//register', async (req,res) => { register(mclient, req, res, config.JWTsecret); });
app.post('//login', async (req,res) => { login(mclient, req, res, config.JWTsecret); });
app.get('//getuser', async (req,res) => { getUser(mclient, req, res, config.JWTsecret, minioClient); });
app.post('//updateUser', async (req,res) => { updateUser(mclient, req, res, config.JWTsecret); });
app.post('//updateUserPhoto', async (req,res) => { updateUserPhoto(mclient, req, res, config.JWTsecret, minioClient); });
app.post('//journal/newentry', async (req,res) => { newJournalEntry(mclient, req, res, config.JWTsecret); });
app.get('//journal/allentries', async (req,res) => { getAllJournalEntries(mclient, req, res, config.JWTsecret); });
app.get('//fitness/allvideos', async (req,res) => { getAllFitnessVideos(mclient, req, res); });
app.get('//consultation/alldoctors', async (req,res) => { getAllDoctors(mclient, req, res); });
app.post('//consultation/newrequest', async (req,res) => { newConsultationRequest(mclient, req, res, config.JWTsecret); });
app.get('//consultation/getexisting', async (req,res) => { getExistingConsultationRequests(mclient, req, res, config.JWTsecret); });
app.post('//consultation/updatestate', async (req,res) => { updateConsultationState(mclient, req, res, config.JWTsecret); });