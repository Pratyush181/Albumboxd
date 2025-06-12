import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios';

function App() {
  const [count, setCount] = useState(0);
  const [array, setArray] = useState([]);
  const [albums, setAlbums] = useState([]);


  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:3000/exampleApi");
    console.log(response.data.message);
    setArray(response.data.message);
  };

  const fetchAlbums = async () => {
    const response = await axios.get("http://localhost:3000/albums");
    console.log(response.data);
    setAlbums(response.data);
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, []);

  return (
    <>
      <div>
        {
          array.map((message, index) => (
            <div key={index}>
              <p>{message}</p>
              <br></br>
            </div>

          ))
        }

        {
          albums?.map((album, index) => (
            <div key={index}>
              <p>{album.title} by {album.artist}</p>
              <br></br>
            </div>
          ))
        }

      </div>
      
    </>
  )
}

export default App;
