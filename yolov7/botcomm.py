import serial
import time

s = serial.Serial('/dev/ttyUSB0',115200)
s.write("\r\n\r\n".encode()) # Hit enter a few times to wake the Printrbot
# Wait for response with carriage return


grbl_out = s.readline() 
print(grbl_out.decode("utf-8"))
time.sleep(2)   # Wait for delta printer to initialize
grbl_out = s.readline() 
print(grbl_out.decode("utf-8"))
s.flushInput()  # F
ready = True

def HOME():
    return ["G90","G28 X0","G28 Y0","G28 Z0"]
def PICTURE():
    return ["G1 Z149 F5000","G1 X1 F5000", "G1 Y1 F5000"]

def executegcode(commands):
    for line in commands:
        l = line.strip() # Strip all EOL characters for streaming
        if (l.isspace()==False and len(l)>0) :
            print(l)
            cmd = (l + "\n").encode()
            s.write(cmd) # Send g-code block
            response = s.readline().decode("utf-8")
            while ("ok" not in response):
                time.sleep(0.1)
                #s.write(cmd)
                response = s.readline().decode("utf-8")

