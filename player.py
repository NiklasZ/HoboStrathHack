class Player:
	def __init__(self, sid):
		self.sid = sid
		self.x = 0
		self.y = 0
		self.r = 0

		self.fx = 0
		self.fy = 0
		self.fr = 0

		self.bx = 0
		self.by = 0
		self.br = 0

	def set_position(self, position):
		self.x = position['x']
		self.y = position['y']
		self.r = position['r']

		self.fx = position['fx']
		self.fy = position['fy']

		self.bx = position['bx']
		self.by = position['by']

	def get_data(self):
		return {"x": self.x, "y": self.y, "r": self.r, "fx": self.fx, "fy": self.fy, "bx": self.bx, "by": self.by}
