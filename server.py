from gevent import monkey
monkey.patch_all()

import time
import random
from threading import Thread
from flask import Flask, render_template, session, request, jsonify
from flask.ext.socketio import SocketIO, emit, join_room, leave_room, session
from flask.ext.cors import CORS, cross_origin
from player import Player
from apiQuery import makeHistoricalRequest, initData

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
cors = CORS(app)
thread = None
players = dict()
heights = list()
normalized_heights = list()

def background_thread():
    while True:
        time.sleep(10)
        #count += 1
        #socketio.emit('my response',
        #              {'data': 'Server generated event', 'count': count},
        #              namespace='/test')

@app.route('/')
def index():  
    global thread
    if thread is None:
        thread = Thread(target=background_thread)
        thread.start() 
    if not 'sid' in session:
        session['sid'] = int(random.random()*1000000)
        get_player(session['sid'])

    return render_template('index.html')

@socketio.on('connect', namespace='/race')
def client_connect():
    print(get_player(session['sid']).sid)

@socketio.on('get_height', namespace='/race')
def get_height(msg):
    if msg < len(normalized_heights):
        height = normalized_heights[msg]
    else:
        height = 0
    emit('data', {"height": height, "pos": msg})

def get_player(sid):
    if not sid in players:
        players[sid] = Player(sid)
    return players[sid]    

def normalize_heights():
    global normalized_heights

    min = 10000
    max = 0
    for height in heights:
        if height < min:
            min = height
        if height > max:
            max = height
    normalized_heights = map(lambda h:(h-min)*(500.0/(max-min))-100, heights)

if __name__ == '__main__':
    initData()
    heights = makeHistoricalRequest('Allianz SE', 'dax', 'PX_MID', '20140101', '20140801', 'DAILY')
    normalize_heights()
    print 'Loaded data from the API'
    socketio.run(app, host='0.0.0.0')
