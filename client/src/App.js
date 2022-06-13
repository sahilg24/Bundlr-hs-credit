import {useState} from 'react';
import './App.css';
import * as api from './api'
import image from './images/dragon.png'

function App() {

    const [file, setFile] = useState();
    const [link, setLink] = useState();
    const [message, setMessage] = useState();

    async function upload(e) {
      e.preventDefault();
      if (file) {
        setMessage("Please wait while the file is being submitted");
        const startingTime = new Date()
  
        const formData = new FormData();
        formData.append('uploadedFile', file)
        const {data} = await api.post(formData);
  
        setMessage(data.message);
        if (data?.id) {
          console.log(data?.id);
          setLink(`https://arweave.net/${data.id}`)
        }
  
        const endingTime = new Date()
        
        console.log(`The upload/request took ${Math.abs(endingTime - startingTime) / 1000} seconds.`)
      }

    }
    
    const onFileChange = (e) => {
      setFile(e.target.files[0]);
    }

    return (
      <div className="App">

          <form className = "upload-form" onSubmit = {upload} encType = "multipart/form-data" >
            <input className = "choose-file" type = "file" onChange = {onFileChange} />
            <button type = "submit" className = "submit"> Submit </button>
          </form>

        {link && 
            <a href = {link} target = "_blank" rel="noreferrer">
              <img className = "image" src = {image} alt = "dragon-img" 
              title = "Obtained for completing Calculus with the hard rubric. Click to view your work">

              </img>
            </a>
        }
        {message && 
          <p className = "message">
            {message}
          </p>
        }
      </div>
    );
  
  
}

export default App;
