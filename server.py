from gevent import monkey
monkey.patch_all()

import time
import random
from threading import Thread
from flask import Flask, render_template, session, request, jsonify
from flask.ext.socketio import SocketIO, emit, join_room, leave_room, session
from flask.ext.cors import CORS, cross_origin
from player import Player
from apiQuery import specialAndyRequestRequest, initData

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
cors = CORS(app)
thread = None
players = dict()
heights = list()
stock_name = ''
normalized_heights = list()

def background_thread():
    while True:
        time.sleep(0.05)
        data = dict()
        for sid, player in players.iteritems():
            data[sid] = player.get_data()
        socketio.emit('broadcast_positions', data, namespace='/race')

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
    sid = get_player(session['sid']).sid
    print(sid)
    emit('player_info', sid)
    emit('track_info', {"name": stock_name})

@socketio.on('get_height', namespace='/race')
def get_height(msg):
    if msg < len(normalized_heights):
        height = normalized_heights[msg]
    else:
        height = 0
    emit('data', {"height": height, "pos": msg})

@socketio.on('send_position', namespace='/race')
def send_position(msg):
    player = get_player(session['sid'])
    player.set_position(msg)

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
    # heights = makeHistoricalRequest('Allianz SE', 'dax', 'PX_MID', '20140101', '20140801', 'DAILY')
    special_data = specialAndyRequestRequest('20140101', '20141001', 'DAILY')
    heights = special_data['Data']
    heightPercentageDeltas = getHeightDeltas(heights)
    stock_name = special_data['Stock Name']
    normalize_heights()
    print 'Loaded data from the API'
    socketio.run(app, host='0.0.0.0')

def getHeightDeltas(heights):
    deltas = []
    heights_len = len(heights)
    for i in range(0, heights_len-1)
        deltas[i] =  (heights[i-1] - heights[i])/heights(i)
    print deltas
    return deltas
