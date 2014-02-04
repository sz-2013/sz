import socket
import bert
PORT = 8789
HOST_DEST = '192.168.0.102'
# Echo server program
# HOST = ''                 # Symbolic name meaning all available interfaces
# PORT = 50007              # Arbitrary non-privileged port
# s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# s.bind((HOST, PORT))
# s.listen(1)
# conn, addr = s.accept()
# print 'Connected by', addr
# while 1:
#     data = conn.recv(1024)
#     if not data:
#         break
#     conn.sendall(data)
# conn.close()

# Echo client program

send_data = dict(lubimiy='kotik')
send_bert = bert.BERTDecoder(send_data)
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.connect((HOST_DEST, PORT))
s.sendall(send_bert)
s.close()
# print 'Received', repr(data)
