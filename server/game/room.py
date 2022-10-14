from game.game import Game, GameSyncUnit

class Room:
    def __init__(self, socketio, room_id) -> None:
        self.game = Game()
        self.gsu = GameSyncUnit(self.game, socketio, room_id)
        self.message_list = [
            ('温馨提示','[滚轮]可缩放, [ctrl+滚轮]可旋转, 按住ctrl拖动鼠标可移动画面'),
            ('blokus游戏规则','每个人选一个颜色轮流下棋, 只能下自己的颜色的棋, 1. 只能下到空白格, 2. 每次下棋必须要和自己的颜色有公共点, 3. 但不可以有公共边, 最后谁剩的少谁赢')
            ]
        