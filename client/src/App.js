import { useState } from 'react';
import './App.css';
import * as api from './api'
import image from './images/dragon.png'
import Flip from "react-reveal/Flip";
import Bounce from "react-reveal/Bounce";

function App() {

  const [file, setFile] = useState();
  const [link, setLink] = useState();
  const [message, setMessage] = useState();

    async function upload(e) {
      e.preventDefault();
      setMessage("Please wait while the file is being submitted");
      const startingTime = new Date()
  
      const formData = new FormData();
      formData.append('uploadedFile', file)
      const {data} = await api.post(formData);
  
      setMessage(data.message);
      if (data?.id) {
        setLink(`https://arweave.net/${data.id}`)
      }
  
      const endingTime = new Date()
      
      console.log(`The upload/request took ${Math.abs(endingTime - startingTime) / 1000} seconds.`)

    }

  

  const onFileChange = (e) => {
    setFile(e.target.files[0]);

    // Get the selected file
    const displayfile = e.target.files[0];
    // Get the file name and size
    const { name: fileName, size } = displayfile;
    // Convert size in bytes to kilo bytes
    const fileSize = (size / 1000).toFixed(2);
    // Set the text content
    const fileNameAndSize = `${fileName} - ${fileSize}KB`;
    document.querySelector('.file-name').textContent = fileNameAndSize;
  }

  return (
    <div className="App">
      <Bounce top><div className="header">Arweave Storage Using Bundlr Demo</div></Bounce>
      <div className="bg-container">
        <Flip top>
          <form className="upload-form" onSubmit={upload} encType="multipart/form-data" >
            <div class="file-input">
              <input type="file" id="file" class="choose-file" onChange={onFileChange} />
              <label for="file">
                Choose file
                <p class="file-name"></p>
              </label>
            </div>
            <button type="submit" className="submit"><span>Submit</span></button>
          </form>
        </Flip>

        {link &&
          <a href={link} target="_blank" rel="noreferrer">
            <img className="image" src={image} alt="dragon-img"
              title="Obtained for completing Calculus with the hard rubric. Click to view your work">

            </img>
          </a>
        }
        {message &&
          <p className="message">
            {message}
          </p>
        }
      </div>
    </div>
  );


}

export default App;
