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

    profile = db.relationship(
        "PlayerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

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
            "profile": self.profile.serialize() if self.profile else None,
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
            "name": self.user.name if self.user else None,
            "last_name": self.user.last_name if self.user else None,
            "nickname": self.user.nickname if self.user else None,
            "email": self.user.email if self.user else None,
            "phone": self.user.phone if self.user else None,
            "instagram": self.user.instagram if self.user else None,
            "level": self.level,
            "position": self.position,
            "status": self.status,
            "matches_played": self.matches_played,
            "wins": self.wins,
            "losses": self.losses,
            "points": self.points,
            "win_percentage": self.win_percentage(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Season(db.Model):
    __tablename__ = "seasons"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)

    is_active = db.Column(db.Boolean, default=False)
    is_closed = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)

    matches = db.relationship("Match", back_populates="season")

    snapshots = db.relationship(
        "SeasonRankingSnapshot",
        back_populates="season",
        cascade="all, delete-orphan",
    )

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "is_closed": self.is_closed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
        }


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)

    season_id = db.Column(db.Integer, db.ForeignKey("seasons.id"), nullable=True)

    level = db.Column(db.String(50), nullable=False)

    team_a_player_1_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=False
    )
    team_a_player_2_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=False
    )
    team_b_player_1_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=False
    )
    team_b_player_2_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=False
    )

    score = db.Column(db.String(100), nullable=False)
    winner_team = db.Column(db.String(1), nullable=False)

    club = db.Column(db.String(120), nullable=True)
    played_at = db.Column(db.DateTime, nullable=False)

    # Estados posibles:
    # pending   -> resultado subido pero pendiente de validación rival
    # confirmed -> resultado aceptado por un rival y ya suma puntos
    # rejected  -> resultado rechazado y no suma puntos
    status = db.Column(db.String(50), default="pending")

    # Usuario que sube el resultado
    submitted_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Perfil del jugador que sube el resultado
    submitted_by_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

    # Perfil del rival que acepta
    confirmed_by_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

    # Perfil del rival que rechaza
    rejected_by_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

    confirmed_at = db.Column(db.DateTime, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    season = db.relationship("Season", back_populates="matches")

    team_a_player_1 = db.relationship(
        "PlayerProfile", foreign_keys=[team_a_player_1_id]
    )
    team_a_player_2 = db.relationship(
        "PlayerProfile", foreign_keys=[team_a_player_2_id]
    )
    team_b_player_1 = db.relationship(
        "PlayerProfile", foreign_keys=[team_b_player_1_id]
    )
    team_b_player_2 = db.relationship(
        "PlayerProfile", foreign_keys=[team_b_player_2_id]
    )

    submitted_by = db.relationship("User", foreign_keys=[submitted_by_id])

    submitted_by_profile = db.relationship(
        "PlayerProfile", foreign_keys=[submitted_by_profile_id]
    )

    confirmed_by_profile = db.relationship(
        "PlayerProfile", foreign_keys=[confirmed_by_profile_id]
    )

    rejected_by_profile = db.relationship(
        "PlayerProfile", foreign_keys=[rejected_by_profile_id]
    )

    def get_team_a_ids(self):
        return [self.team_a_player_1_id, self.team_a_player_2_id]

    def get_team_b_ids(self):
        return [self.team_b_player_1_id, self.team_b_player_2_id]

    def get_all_player_ids(self):
        return [
            self.team_a_player_1_id,
            self.team_a_player_2_id,
            self.team_b_player_1_id,
            self.team_b_player_2_id,
        ]

    def get_submitted_team(self):
        if not self.submitted_by_profile_id:
            return None

        if self.submitted_by_profile_id in self.get_team_a_ids():
            return "A"

        if self.submitted_by_profile_id in self.get_team_b_ids():
            return "B"

        return None

    def get_validation_team_ids(self):
        submitted_team = self.get_submitted_team()

        if submitted_team == "A":
            return self.get_team_b_ids()

        if submitted_team == "B":
            return self.get_team_a_ids()

        return []

    def can_be_validated_by(self, profile_id):
        if self.status != "pending":
            return False

        return profile_id in self.get_validation_team_ids()

    def serialize(self):
        return {
            "id": self.id,
            "season_id": self.season_id,
            "season": self.season.name if self.season else None,
            "level": self.level,
            "team_a": [
                self.team_a_player_1.serialize(),
                self.team_a_player_2.serialize(),
            ],
            "team_b": [
                self.team_b_player_1.serialize(),
                self.team_b_player_2.serialize(),
            ],
            "score": self.score,
            "winner_team": self.winner_team,
            "club": self.club,
            "played_at": self.played_at.isoformat() if self.played_at else None,
            "status": self.status,
            "submitted_by": self.submitted_by.nickname if self.submitted_by else None,
            "submitted_by_profile_id": self.submitted_by_profile_id,
            "submitted_by_profile": (
                self.submitted_by_profile.serialize()
                if self.submitted_by_profile
                else None
            ),
            "confirmed_by_profile_id": self.confirmed_by_profile_id,
            "confirmed_by_profile": (
                self.confirmed_by_profile.serialize()
                if self.confirmed_by_profile
                else None
            ),
            "rejected_by_profile_id": self.rejected_by_profile_id,
            "rejected_by_profile": (
                self.rejected_by_profile.serialize()
                if self.rejected_by_profile
                else None
            ),
            "confirmed_at": self.confirmed_at.isoformat()
            if self.confirmed_at
            else None,
            "rejected_at": self.rejected_at.isoformat() if self.rejected_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SeasonRankingSnapshot(db.Model):
    __tablename__ = "season_ranking_snapshots"

    id = db.Column(db.Integer, primary_key=True)

    season_id = db.Column(db.Integer, db.ForeignKey("seasons.id"), nullable=False)
    profile_id = db.Column(db.Integer, db.ForeignKey("player_profiles.id"), nullable=True)

    final_position = db.Column(db.Integer, nullable=False)

    nickname = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    last_name = db.Column(db.String(120), nullable=True)

    level = db.Column(db.String(50), nullable=False)
    player_position = db.Column(db.String(50), nullable=False)

    matches_played = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    win_percentage = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    season = db.relationship("Season", back_populates="snapshots")
    profile = db.relationship("PlayerProfile", foreign_keys=[profile_id])

    def serialize(self):
        return {
            "id": self.id,
            "season_id": self.season_id,
            "profile_id": self.profile_id,
            "final_position": self.final_position,
            "nickname": self.nickname,
            "name": self.name,
            "last_name": self.last_name,
            "level": self.level,
            "position": self.player_position,
            "matches_played": self.matches_played,
            "wins": self.wins,
            "losses": self.losses,
            "points": self.points,
            "win_percentage": self.win_percentage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Rules(db.Model):
    __tablename__ = "rules"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

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