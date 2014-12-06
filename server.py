from gevent import monkey
monkey.patch_all()

import time
import random
from threading import Thread
from flask import Flask, render_template, session, request
from flask.ext.socketio import SocketIO, emit, join_room, leave_room, session
from player import Player

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
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
    emit('start','test')

def get_player(sid):
    if not sid in players:
        players[sid] = Player(sid)
    return players[sid]    

if __name__ == '__main__':
    socketio.run(app)