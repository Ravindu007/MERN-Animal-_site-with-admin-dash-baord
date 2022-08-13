const express = require("express");
const {MongoClient, ObjectId} = require("mongodb");

const multer = require("multer")
const upload = multer() 

const fse = require("fs-extra")
const sharp = require("sharp")

const sanitizeHTML = require("sanitize-html")

let db

const path = require("path")

const React = require("react")
const ReactDOMServer = require("react-dom/server")

const AnimalCard = require("./src/components/AnimalCard").default

//when the app first runs, make sure the "public/uploaded-photos exists"
fse.ensureDirSync(path.join("public", "uploaded-photos"))

const app = express()

app.set("view engine", "ejs")
app.set("views", "./views")
app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({extended:false}))


function passwordProtected(req,res, next){
  res.set("WWW-Authenticate", "Basic realm = 'Our MERN App'")
  if(req.headers.authorization == "Basic YWRtaW46UnNAMTk5ODA1MDQ="){
    next()
  }else{
    console.log(req.headers.authorization);
    res.status(401).send("Try Again")
  }
}


app.get("/", async(req, res)=> {
  const allAnimals = await db.collection("Animals").find().toArray()
  const generatedHTML = ReactDOMServer.renderToString( 
    <div className="container">
      <div className="animal-grid mb-3">
        {allAnimals.map((animal)=>(
          <AnimalCard key={animal._id} name={animal.name} species={animal.species} photo={animal.photo} id={animal._id} readOnly={true}/>
        ))}
      </div>
    </div>
  )
  res.render("home", {generatedHTML})
})



app.use(passwordProtected)

app.get("/admin" ,(req, res) => {
  res.render("admin")
})

app.get("/api/animals", async(req, res)=>{
  const allAnimals = await db.collection("Animals").find().toArray();
  res.json(allAnimals)
})

app.post("/create-animal", upload.single("photo"), ourCleanup,async(req, res)=>{
  if(req.file){
    const photoFileName = `${Date.now()}.jpg`;
    await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join("public", "uploaded-photos", photoFileName))
    req.cleanData.photo = photoFileName
  }

  console.log(req.body);
  const info = await db.collection("Animals").insertOne(req.cleanData)
  const newAnimal = await db.collection("Animals").findOne({_id: new ObjectId(info.insertedId)})
  res.send(newAnimal )
})

//req.parms is how you can access the wildcards in the url 

app.delete("/animal/:id", async(req, res)=>{
  if(typeof req.params.id != "string") req.params.id = ""
  const doc = await db.collection("Animals").findOne({_id: new ObjectId(req.params.id)}) 
  if(doc.photo){
    fse.remove(path.join("public", "uploaded-photos",doc.photo))
  }
  db.collection("Animals").deleteOne({_id: new ObjectId(req.params.id)})
  res.send("Deleted Successfully!!!")
})


app.post("/update-animal", upload.single("photo"), ourCleanup, async(req,res) => {
  // differentiate requests
  if(req.file){
    // if they are uploading a photo
    const photoFileName = `${Date.now()}.jpg`;
    await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join("public", "uploaded-photos", photoFileName))
    req.cleanData.photo = photoFileName
    
    const info = await db.collection("Animals").findOneAndUpdate({_id:new ObjectId(req.body._id)}, {$set:req.cleanData})
    if(info.value.photo){
      fse.remove(path.join("public", "uploaded-photos",info.value.photo))
    }
    res.send(photoFileName)
  }else{
    //if they are not uploading a photo 
    db.collection("Animals").findOneAndUpdate({_id:new ObjectId(req.body._id)}, {$set:req.cleanData})
    res.send(false)
  }
})










// data-cleanup
function ourCleanup(req, res, next){
  if(typeof req.body.name != "string") req.body.name = ""
  if(typeof req.body.species != "string") req.body.species = ""
  if(typeof req.body._id != "string") req.body._id = ""

  req.cleanData = { 
    name: sanitizeHTML(req.body.name.trim(), {allowedTags:[], allowedAttributes:[]}),
    species: sanitizeHTML(req.body.species.trim(), {allowedTags:[], allowedAttributes:[]})
  }

  next()
}


async function start_connection(){
  const client = new MongoClient("mongodb+srv://ravindu0504:Rs19980504@database.8ylmtab.mongodb.net/Database?retryWrites=true&w=majority")
  await client.connect()
  db = client.db()
  app.listen(3000)
}

start_connection()



