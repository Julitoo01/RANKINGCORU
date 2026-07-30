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

    profile_image = db.Column(db.Text, nullable=True)

    is_admin = db.Column(db.Boolean, default=False)

    terms_accepted = db.Column(db.Boolean, default=False)
    terms_accepted_at = db.Column(db.DateTime, nullable=True)

    privacy_accepted = db.Column(db.Boolean, default=False)
    privacy_accepted_at = db.Column(db.DateTime, nullable=True)

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
            "profile_image": self.profile_image,
            "is_admin": self.is_admin,
            "terms_accepted": self.terms_accepted,
            "terms_accepted_at": (
                self.terms_accepted_at.isoformat() if self.terms_accepted_at else None
            ),
            "privacy_accepted": self.privacy_accepted,
            "privacy_accepted_at": (
                self.privacy_accepted_at.isoformat() if self.privacy_accepted_at else None
            ),
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
    # pending = pendiente de aprobación
    # approved = aprobado por admin
    # rejected = rechazado

    payment_status = db.Column(db.String(50), default="unpaid")
    # unpaid = no pagado
    # paid = pagado por STC Pay

    payment_method = db.Column(db.String(50), nullable=True)
    # stc_manual = STC Pay manual

    payment_reference = db.Column(db.String(160), nullable=True)
    paid_at = db.Column(db.DateTime, nullable=True)

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
            "profile_image": self.user.profile_image if self.user else None,
            "level": self.level,
            "position": self.position,
            "status": self.status,
            "payment_status": self.payment_status,
            "payment_method": self.payment_method,
            "payment_reference": self.payment_reference,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
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

    status = db.Column(db.String(50), default="pending")

    submitted_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    submitted_by_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

    confirmed_by_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

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


class OpenMatch(db.Model):
    __tablename__ = "open_matches"

    id = db.Column(db.Integer, primary_key=True)

    level = db.Column(db.String(50), nullable=False)
    club = db.Column(db.String(120), nullable=False)

    match_date = db.Column(db.Date, nullable=False)
    match_time = db.Column(db.Time, nullable=False)

    max_players = db.Column(db.Integer, default=4)

    status = db.Column(db.String(50), default="open")
    # open = abierto
    # closed = completo y parejas creadas
    # cancelled = cancelado por admin

    description = db.Column(db.Text, nullable=True)

    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    team_a_player_1_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )
    team_a_player_2_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )
    team_b_player_1_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )
    team_b_player_2_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=True
    )

    result_match_id = db.Column(
        db.Integer, db.ForeignKey("matches.id"), nullable=True
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime, nullable=True)

    created_by = db.relationship("User", foreign_keys=[created_by_id])

    players = db.relationship(
        "OpenMatchPlayer",
        back_populates="open_match",
        cascade="all, delete-orphan",
    )

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

    result_match = db.relationship("Match", foreign_keys=[result_match_id])

    def serialize(self):
        return {
            "id": self.id,
            "level": self.level,
            "club": self.club,
            "match_date": self.match_date.isoformat() if self.match_date else None,
            "match_time": self.match_time.strftime("%H:%M") if self.match_time else None,
            "max_players": self.max_players,
            "status": self.status,
            "description": self.description,
            "created_by": self.created_by.nickname if self.created_by else None,
            "players_count": len(self.players) if self.players else 0,
            "players": [player.serialize() for player in self.players],
            "team_a": [
                self.team_a_player_1.serialize() if self.team_a_player_1 else None,
                self.team_a_player_2.serialize() if self.team_a_player_2 else None,
            ],
            "team_b": [
                self.team_b_player_1.serialize() if self.team_b_player_1 else None,
                self.team_b_player_2.serialize() if self.team_b_player_2 else None,
            ],
            "result_match_id": self.result_match_id,
            "has_result": self.result_match_id is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
        }


class OpenMatchPlayer(db.Model):
    __tablename__ = "open_match_players"

    id = db.Column(db.Integer, primary_key=True)

    open_match_id = db.Column(
        db.Integer, db.ForeignKey("open_matches.id"), nullable=False
    )

    player_profile_id = db.Column(
        db.Integer, db.ForeignKey("player_profiles.id"), nullable=False
    )

    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    open_match = db.relationship("OpenMatch", back_populates="players")
    player_profile = db.relationship("PlayerProfile", foreign_keys=[player_profile_id])

    def serialize(self):
        return {
            "id": self.id,
            "open_match_id": self.open_match_id,
            "player_profile_id": self.player_profile_id,
            "player": self.player_profile.serialize() if self.player_profile else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(160), nullable=False)
    message = db.Column(db.Text, nullable=False)

    notification_type = db.Column(db.String(80), nullable=False)
    # open_match_created
    # open_match_joined
    # open_match_closed

    open_match_id = db.Column(
        db.Integer, db.ForeignKey("open_matches.id"), nullable=True
    )

    is_read = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id])
    open_match = db.relationship("OpenMatch", foreign_keys=[open_match_id])

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type,
            "open_match_id": self.open_match_id,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "open_match": self.open_match.serialize() if self.open_match else None,
        }