from botcomm import executegcode
import time
executegcode(["G90","G28 X0","G28 Y0","G28 Z0"])
executegcode(["G90","G0 Z30 F15000","G0 X80 F15000","G0 X-10 F15000","G0 Z30 F15000","G0 X80 F15000","G0 Z10 F15000","G0 X-10 F15000","G0 Z30 F15000" ])

#executegcode(["G0 X50 F1000", "G1 Y50 F1000"])
#executegcode(["G0 X2 F1000", "G1 Y0 F1000"])
#executegcode(["G0 Z40 F5000"])
#executegcode(["G0 X2 F5000"])
#executegcode(["G0 Z0 F1000"])
executegcode(["G90","G28 X0","G28 Y0","G28 Z0"])
time.sleep(10)