import React, { useState, useEffect} from "react";
import {createRoot} from "react-dom/client";
import Axios from "axios"

import AnimalCard from "./components/AnimalCard";
import CreateNewForm from "./components/CreateNewForm";


function App(){

  const [animals, setAnimals] = useState([])

  useEffect(()=>{
    async function go(){
      const response = await Axios.get("/api/animals")
      setAnimals(response.data)
    }
    go()
  },[])
  

  return(
      <div className="container">
        <p><a href="/">&laquo; Back to publick home page</a></p>
        <CreateNewForm setAnimals={setAnimals}/>
        <div className="animal-grid">
        {animals.map((animal)=>(
          <AnimalCard key={animal._id} name={animal.name} species = {animal.species} photo={animal.photo} id={animal._id} setAnimals={setAnimals}/>
        ))}
        </div>
      </div>
    )
}

const root = createRoot(document.querySelector("#app"))
root.render(<App/>)

