import logo from './logo.svg';
import './App.css';
import {useCamera} from './hooks/useCamera';
import React, { useEffect, useState, createRef, useRef  } from "react";
import request from 'superagent';
import FisheyeGl from './lib/fish';
import {deltaX, deltaY} from './lib/coords';

function App() {
  const canvasRef = useRef();
  const boundsRef = useRef({x:0,y:0,w:0,h:0});
  const videoRef = createRef();
  const canvasGLRef = createRef();

  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  const [display, setDisplay] = useState("none")

  const setBounds = (_bounds)=>{
    boundsRef.current=_bounds;
  }

  const handleClick = async (e)=>{
    const px = e.clientX;
    const py = e.clientY;  
    console.log(px,py, "=>",deltaX(px, py), deltaY(px,py));
    await press(deltaX(px, py), deltaY(px,py));
  }

  const grabImage = ()=>{
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.drawImage(video, 0, 0, 640, 360);
    const dataURL = c.toDataURL("image/jpeg");
    return dataURL;
  }

  const renderBoxes = (results=[])=>{
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    for (const result of results){
      const {x,y,w,h} = result;
      const width = w-x;
      const height = h-y;
      ctx.beginPath();
      ctx.rect(x, y, w-x, h-y);
      ctx.stroke();
    }
  };

  const fetchPredictions = ()=>{
    return new Promise((resolve, reject)=>{
      const dataURL = grabImage();
      request.post("/predict").send({image:dataURL}).end(async (err, res)=>{
        if (err){
          reject(err)
        }else{
          renderBoxes([res.body]);
          resolve(res.body);
        }
      });
    });
  }

  const fetchBounds = ()=>{
    return new Promise((resolve, reject)=>{
      const dataURL = grabImage();
  
      request.post("/bounds").send({image:dataURL}).end(async (err, res)=>{
        if (err){
          reject(err)
        }else{
          //renderBoxes(res.body);
          setBounds(res.body);
          resolve(res.body);
        }
      });
    });
  }

  const fetchFaces = ()=>{
    return new Promise((resolve, reject)=>{
      const dataURL = grabImage();
  
      request.post("/faces").send({image:dataURL}).end(async (err, res)=>{
        if (err){
          reject(err)
        }else{
          renderBoxes(res.body);
          resolve(res.body);
        }
      });
    });
  }

  const centerpoint = (x,y,w,h)=>{
    console.log("getting center point",x,y,w,h);
    const width = w-x;
    const height = h-y;
    const px = Math.floor(x + (width / 2));
    const py = Math.floor(y + (height / 2));
    return [px,py];
  }

  const sendPhoto = ()=>{
    return new Promise((resolve, reject)=>{
      const dataURL = grabImage();
      request.post("/snap").send({image:dataURL}).end((err, res)=>{
        resolve(res.body)
      })
    });
  }

  const takePhotos = (totake, timeout)=>{
    return new Promise((resolve, reject)=>{
      const takepic = async (taken)=>{
        await sendPhoto();
        if (taken <= totake){
          setTimeout(()=>{takepic(taken+1)}, timeout);
        }else{
          resolve();
        }
      }
      takepic(0);
    });
  }

  const readiPhotos = async()=>{
    console.log("iphone, reading screen");
    const _results = await fetchPredictions();
    const results = pickbest(_results);
    const iphotoforyou = results.find(r=>r.category==="iphotoforyou");

    if (iphotoforyou){
      console.log("seen an iphotoforyou")
      const {x,y,w,h} = iphotoforyou;
      const [px,py] = centerpoint(x,y,w,h);
      await doublepress(deltaX(px,py), deltaY(px,py));
      const faces = await fetchFaces();
      console.log("have faces", faces);
      if (faces.length > 0){
         const {x,y,w,h} = faces[0];
         const [px,py] = centerpoint(x,y,w,h);
         await press(deltaX(px,py), deltaY(px,py));
      }else{
        console.log("pressing in center of the phone");
        await press();
      }
      //at this point we should have a slideshow running!
      //so take 15 photos at 1 second intervals
      await takePhotos(15, 1500);
    }else{
      for (const result of pickbest(results || [])){
        const {category,x,y,w,h} = result;
        const [px,py] = centerpoint(x,y,w,h);
        await press(deltaX(px,py), deltaY(px,py));
      }
    }
  }

  const handleApp = async ({category, x, y, width, height})=>{  
    const px = Math.floor(x + (width / 2));
    const py = Math.floor(y + (height / 2));
    

    if (category === "iphotos"){
      await press(deltaX(px,py), deltaY(px,py));
      await readiPhotos();
    }
   
  }

  //TODO, if low prediction or multiple with same category
  //then handle accordingly
  const pickbest = (results)=>{
    return results;
  }

  const sendToServer = async ()=>{
   
    setDisplay("block");
    await fetchBounds();
    
    const results = await fetchPredictions(); 
    
    for (const result of pickbest(results || [])){
        const {category,x,y,w,h} = result;
        const width = w-x;
        const height = h-y;
        await handleApp({category,x,y,width,height});
    }
    
    setTimeout(()=>{
      setDisplay("none");
    }, 1000) 
  }

  const center = ()=>{
    const {x,y,w,h} = boundsRef.current;
    const x0 = x + (w/2);
    const y0 = y + (h/2);
    return [deltaX(x0,y0), deltaY(x0,y0)]; 
  }

  const press = (dx=undefined,dy=undefined)=>{
    if (dx == undefined || dy==undefined){
      [dx, dy] = center();
    }
    return new Promise((resolve, reject)=>{
      request.get('/press')
      .set('content-Type', 'application/json')
      .query({x:dx, y:dy})
      .end(function(err, res){
        if(err){
          console.log(err);
        }
       
        //give printer time to return to base
        setTimeout(()=>{
          resolve(res.body);
        },3000);
      });
    }); 
  }

  const doublepress = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/doublepress')
      .set('content-Type', 'application/json')
      .query({x:dx, y:dy})
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        console.log(res.body);
        //give printer time to return to base
        setTimeout(()=>{
          resolve(res.body);
        },3000);
      });
    }); 
  }


  const snapToServer = ()=>{
   
    const originalImageURL = grabImage();
    
    //need an await here!
    const distorter = FisheyeGl({
      image: originalImageURL,
      canvas: canvasGLRef.current, // a canvas element to work with
      lens: {
        a: 0.872,    // 0 to 4;  default 1
        b: 0.939,    // 0 to 4;  default 1
        Fx: 0.03, // 0 to 4;  default 0.0
        Fy: 0.08, // 0 to 4;  default 0.0
        scale: 0.909 // 0 to 20; default 1.5
      },
      fov: {
        x: 1, // 0 to 2; default 1
        y: 1  // 0 to 2; default 1
      }
    });
    
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        const dataURL = distorter.getImage("image/jpeg");

        request.post("/snap").send({image:dataURL}).end((err, res)=>{
          resolve(res.body)
        })
      },500)
    });
  }
 
  const canvasstyle = {
    display:display, 
    position:"absolute", 
    top:0, 
    left:0
  }
  
  return (
    <div>
        <video onClick={sendToServer} ref={videoRef} style={{width: 640, height: 360}}/>
        <canvas  ref={canvasRef} id="canvas" width="640" height="360" style={canvasstyle}/>
        <canvas ref={canvasGLRef} id="canvas" width="640" height="360" /*style={{display:"none"}}*/ />
    </div>
  );
}

export default App;
