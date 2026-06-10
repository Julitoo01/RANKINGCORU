from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    nickname = db.Column(db.String(80), unique=True, nullable=False)

    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    phone = db.Column(db.String(30), nullable=False)
    instagram = db.Column(db.String(120), nullable=True)

    is_admin = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile = db.relationship("PlayerProfile", back_populates="user", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "nickname": self.nickname,
            "email": self.email,
            "phone": self.phone,
            "instagram": self.instagram,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PlayerProfile(db.Model):
    __tablename__ = "player_profiles"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    level = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50), nullable=False)

    status = db.Column(db.String(50), default="pending")

    matches_played = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="profile")

    def win_percentage(self):
        if self.matches_played == 0:
            return 0
        return round((self.wins / self.matches_played) * 100)

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "nickname": self.user.nickname if self.user else None,
            "level": self.level,
            "position": self.position,
            "status": self.status,
            "matches_played": self.matches_played,
            "wins": self.wins,
            "losses": self.losses,
            "points": self.points,
            "win_percentage": self.win_percentage(),
        }


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)

    level = db.Column(db.String(50), nullable=False)

    team_a_player_1_id = db.Column(db.Integer, db.ForeignKey("player_profiles.id"), nullable=False)
    team_a_player_2_id = db.Column(db.Integer, db.ForeignKey("player_profiles.id"), nullable=False)
    team_b_player_1_id = db.Column(db.Integer, db.ForeignKey("player_profiles.id"), nullable=False)
    team_b_player_2_id = db.Column(db.Integer, db.ForeignKey("player_profiles.id"), nullable=False)

    score = db.Column(db.String(100), nullable=False)
    winner_team = db.Column(db.String(1), nullable=False)  # A o B

    club = db.Column(db.String(120), nullable=True)
    played_at = db.Column(db.DateTime, nullable=False)

    status = db.Column(db.String(50), default="completed")

    submitted_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    team_a_player_1 = db.relationship("PlayerProfile", foreign_keys=[team_a_player_1_id])
    team_a_player_2 = db.relationship("PlayerProfile", foreign_keys=[team_a_player_2_id])
    team_b_player_1 = db.relationship("PlayerProfile", foreign_keys=[team_b_player_1_id])
    team_b_player_2 = db.relationship("PlayerProfile", foreign_keys=[team_b_player_2_id])

    submitted_by = db.relationship("User", foreign_keys=[submitted_by_id])

    def serialize(self):
        return {
            "id": self.id,
            "level": self.level,
            "team_a": [
                self.team_a_player_1.serialize(),
                self.team_a_player_2.serialize()
            ],
            "team_b": [
                self.team_b_player_1.serialize(),
                self.team_b_player_2.serialize()
            ],
            "score": self.score,
            "winner_team": self.winner_team,
            "club": self.club,
            "played_at": self.played_at.isoformat() if self.played_at else None,
            "status": self.status,
            "submitted_by": self.submitted_by.nickname if self.submitted_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Rules(db.Model):
    __tablename__ = "rules"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    updated_by = db.relationship("User", foreign_keys=[updated_by_id])

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "updated_by": self.updated_by.nickname if self.updated_by else None,
        }


class Season(db.Model):
    __tablename__ = "seasons"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)

    is_active = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }