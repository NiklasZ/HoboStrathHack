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

def background_thread():
    """Example of how to send server generated events to clients."""
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

    initData()
    msg = makeHistoricalRequest('Allianz SE', 'apiRequests/dax.csv', 'PX_MID', '20140101', '20140801', 'DAILY')

    emit('data', msg)

def get_player(sid):
    if not sid in players:
        players[sid] = Player(sid)
    return players[sid]    

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
