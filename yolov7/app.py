from flask import Flask, jsonify,request
import re 
import base64
import cv2
from predict import init, detect
from botcomm import executegcode, HOME, PICTURE
from facedetect import findfaces

import time

app = Flask(__name__)

init()
executegcode(HOME())
executegcode(PICTURE())

@app.route("/")
def root():
    print(request.args)
    return jsonify({"hello":"world"})

@app.route("/bounds", methods=['POST'])
def bounds():
  try:
    content = request.json
    imgdata = base64.b64decode(re.sub("^data:image\/\w+;base64,", "", content["image"]))

    with open("images/bounds.jpg", 'wb') as f:
        f.write(imgdata)
   
    im = cv2.imread("images/bounds.jpg")
    frame_HSV = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    frame_threshold = cv2.inRange(frame_HSV, (0, 0, 101), (180, 255, 255))
    contours, hierarchy = cv2.findContours(frame_threshold,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)[-2:]
    
    maxarea = 0
    maxcont = []
    for cnt in contours:
        x,y,w,h = cv2.boundingRect(cnt)
        if (x != 0  and y != 0):
          a = cv2.contourArea( cnt)
          if maxarea < a:
            maxarea = a
            maxcont = cnt

    x,y,w,h = cv2.boundingRect(maxcont)
    print ((x,y,w,h))
    return jsonify({"x":x,"y":y,"w":w,"h":h})
  except:
    return jsonify({"x":0,"y":0,"w":0,"h":0})

@app.route("/predict", methods=['POST'])
def predict():
    
    content = request.json
    imgdata = base64.b64decode(re.sub("^data:image\/\w+;base64,", "", content["image"]))
    try:
        with open("images/photo.jpg", 'wb') as f:
            f.write(imgdata)
        results = detect("images/photo.jpg")
        return jsonify(results)
    except:
        return []

@app.route("/faces", methods=['POST'])
def faces():
    content = request.json
    imgdata = base64.b64decode(re.sub("^data:image\/\w+;base64,", "", content["image"]))
    try:
        with open("images/faces.jpg", 'wb') as f:
            f.write(imgdata)
        results = findfaces("images/faces.jpg")
        print("have results")
        print(results)
        print(jsonify(results))
        return jsonify(results)
    except Exception as e:
        print("exception! " + str(e))
        return []

@app.route("/doublepress", methods=["GET"])
def doublepress():
    print("seen a press request")
    args = request.args
    x = args.get("x")
    y = args.get("y")
    commands = ["G90", "G1 X"+ x + " Y"+ y + " Z20 F20000", "G0 Z9 F20000", "G4 P10", "G0 Z20 F20000","G4 P200","G0 Z9 F20000", "G4 P10", "G0 Z20 F20000"]
    executegcode(commands)
    executegcode(PICTURE())
    return jsonify({"command":"doublepress", "complete":True})

@app.route("/press", methods=["GET"])
def press():
    print("seen a press request")
    args = request.args
    x = args.get("x")
    y = args.get("y")
    commands = ["G90", "G1 X"+ x + " Y"+ y + " Z20 F20000", "G0 Z9 F20000", "G4 P10", "G0 Z20 F20000"]
    executegcode(commands)
    executegcode(PICTURE())
    return jsonify({"command":"press", "complete":True})

@app.route("/snap", methods=['POST'])
def snap():
    ts = int(time.time())
    content = request.json
    imgdata = base64.b64decode(re.sub("^data:image\/\w+;base64,", "", content["image"]))
    with open("images/" + str(ts) + ".jpg", 'wb') as f:
        f.write(imgdata)
       
    return jsonify({"hello":"world"})

