class Player:
	def __init__(self, sid):
		self.sid = sid
		self.x = 0
		self.y = 0
		self.r = 0

	def set_position(self, position):
		self.x = position['x']
		self.y = position['y']
		self.r = position['r']

	def get_data(self):
		return {"x": self.x, "y": self.y, "r": self.r}
