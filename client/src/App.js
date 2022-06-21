import { useState } from 'react';
import './App.css';
import * as api from './api'
import dragonImage from './images/dragon.png'
import Flip from 'react-reveal/Flip'

function App() {
  
  const [name, setName] = useState({firstName: '', lastName: ''});
  const [file, setFile] = useState();
  const [fileName, setFileName] = useState();
  const [link, setLink] = useState();
  const [message, setMessage] = useState();
  const [videoOpen, setVideoOpen] = useState(false);

    async function upload(e) {
      e.preventDefault();
      setMessage("Please wait while your file is being submitted.");
      const startingTime = new Date();
      const funds = await api.hasFunds(file.size);

      if (!funds.data.success) {
        setMessage(funds.data.message);
      } else { 
        const formData = new FormData();
        formData.append('uploadedFile', file)
        const {data} = await api.upload(formData);
        setMessage(data.message);

        if (data?.id) {
          setLink(`https://arweave.net/${data.id}`)
          setMessage(`${data.message} Your upload can be accessed at https://arweave.net/${data.id}`);
        }
      }

      const endingTime = new Date()
      
      console.log(`The upload/request took ${Math.abs(endingTime - startingTime) / 1000} seconds.`)

    }

  
  const onNameChange = (e) => {
    setName({...name, [e.target.name] : e.target.value})
  }

  const onFileChange = (e) => {
    setFile(e.target.files[0]);

    // Get the selected file
    const displayfile = e.target.files[0];
    // Get the file name and size
    const { name: fileName, size } = displayfile;
    let fileSize = 0;
    let fileNameAndSize = '';

    if (size > Math.pow(10,9)) {
      // Convert size in bytes to kilo bytes
      fileSize = (size / Math.pow(2,30)).toFixed(2);
      // Set the text content
      fileNameAndSize = `${fileName} - ${fileSize}GB`;
    } else if (size > Math.pow(10,6)){
      fileSize = (size / Math.pow(2,20)).toFixed(2);
      fileNameAndSize = `${fileName} - ${fileSize}MB`;
    } else {
      fileSize = (size / 1024).toFixed(2);
      fileNameAndSize = `${fileName} - ${fileSize}KB`;
    }

    setFileName(fileNameAndSize)
  }

  const toggleVideo = (e) => {
    setVideoOpen(videoOpen => !videoOpen);
  }

  return (
    <div className="App">
      <section className='main-container'>

        <Flip top>
          <form className="upload-form" onSubmit={upload} encType="multipart/form-data">
            <input onChange={onNameChange} name="firstName" className="form-field" type="text" placeholder = "Enter Your First Name" required/>
            <input onChange={onNameChange} name="lastName" className="form-field" type="text" placeholder = "Enter Your Last Name" required/> 
            <div className="file-input">
              <input type="file" id="file" className="choose-file" onChange={onFileChange} required/>
              <label htmlFor = "file">
                Choose file
              </label>
              <p className="file-name"> {fileName ? fileName : <span>&nbsp;</span> } </p>
            </div>
            <button type="submit" className="submit"><span> Submit </span></button>
          </form>
        </Flip>

        {videoOpen && (
          /* Based on the badge and content, this'll be changed to display that content rather than just a video*/
          <div className = "video-popup">
            <div className = "modal-background" onClick = {toggleVideo}></div>
            <video controls className = "video" preload = "metadata">
              <source src = "https://arweave.net/fwDHidsjj5pEstGDtgyOEhnaC99jBhHuwatrcMZxly4" type = "video/mp4" />
            </video>
          </div>
        )}

        {link &&
          <button onClick = {toggleVideo} className = "open-video">
            <img className="dragon-image" src={dragonImage} alt="dragon-img"
              title="Obtained for completing Calculus with the hard rubric. Click to view your work">
            </img>
          </button>
        }

        {message && (
          <p className="message">
            {message}
          </p>
        )}
      </section>
    </div>
  );


}

export default App;
