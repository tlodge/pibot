import cv2
faceCascade = cv2.CascadeClassifier("cascader.xml")

def findfaces(filename):
    image = cv2.imread(filename)
    portraitimg = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    gray = cv2.cvtColor(portraitimg, cv2.COLOR_BGR2GRAY)

    faces = faceCascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
        flags = cv2.CASCADE_SCALE_IMAGE
    )
    print("Found {0} faces!".format(len(faces)))
    found = []
    
    for (x, y, w, h) in faces:
        x0 = y
        y0 = x
        y1 = y0-(2*(y0-180))-h
        print(x0, y0)
        found.append({"x":int(x0), "y":int(y1), "w":int(x0+h), "h":int(y1+w)})
        #cv2.rectangle(image, (x0, y1), (x0+h, y1+w), (255, 0, 0), 2)
        #cv2.rectangle(image, (320, 180), (321,181), (255,255,0), 2)
    
    print(found)  
    return found