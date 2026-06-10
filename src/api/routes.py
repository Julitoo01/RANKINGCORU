from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

from api.models import db, User, PlayerProfile, Match, Rules

api = Blueprint("api", __name__)


def is_admin_user(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


def recalculate_ranking_internal():
    profiles = PlayerProfile.query.all()

    for profile in profiles:
        profile.matches_played = 0
        profile.wins = 0
        profile.losses = 0
        profile.points = 0

    matches = Match.query.all()

    for match in matches:
        team_a_profiles = [
            match.team_a_player_1,
            match.team_a_player_2,
        ]

        team_b_profiles = [
            match.team_b_player_1,
            match.team_b_player_2,
        ]

        if match.winner_team == "A":
            winners = team_a_profiles
            losers = team_b_profiles
        else:
            winners = team_b_profiles
            losers = team_a_profiles

        for player in winners:
            if player:
                player.matches_played += 1
                player.wins += 1
                player.points += 3

        for player in losers:
            if player:
                player.matches_played += 1
                player.losses += 1
                player.points += 1

    db.session.commit()


@api.route("/hello", methods=["GET"])
def handle_hello():
    return jsonify({"message": "Hello from Fuera de Pista"}), 200


@api.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = [
        "name",
        "last_name",
        "nickname",
        "email",
        "password",
        "phone",
        "level",
        "position",
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"msg": f"Falta el campo {field}"}), 400

    email = data.get("email").lower().strip()
    nickname = data.get("nickname").strip()

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({"msg": "Ya existe un usuario con este email"}), 400

    existing_nickname = User.query.filter_by(nickname=nickname).first()
    if existing_nickname:
        return jsonify({"msg": "Ya existe un usuario con este nickname"}), 400

    user = User(
        name=data.get("name").strip(),
        last_name=data.get("last_name").strip(),
        nickname=nickname,
        email=email,
        password_hash=generate_password_hash(data.get("password")),
        phone=data.get("phone").strip(),
        instagram=data.get("instagram", "").strip(),
        is_admin=False,
    )

    db.session.add(user)
    db.session.flush()

    profile = PlayerProfile(
        user_id=user.id,
        level=data.get("level"),
        position=data.get("position"),
        status="pending",
        matches_played=0,
        wins=0,
        losses=0,
        points=0,
    )

    db.session.add(profile)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "msg": "Usuario registrado correctamente",
            "token": access_token,
            "user": user.serialize(),
        }
    ), 201


@api.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Email y contraseña son obligatorios"}), 400

    email = data.get("email").lower().strip()
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Email o contraseña incorrectos"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "msg": "Login correcto",
            "token": access_token,
            "user": user.serialize(),
        }
    ), 200


@api.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    return jsonify(user.serialize()), 200


@api.route("/ranking", methods=["GET"])
def get_ranking():
    level = request.args.get("level")

    query = PlayerProfile.query.join(User)

    if level and level != "Todos":
        query = query.filter(PlayerProfile.level == level)

    players = (
        query.filter(PlayerProfile.status == "approved")
        .order_by(PlayerProfile.points.desc(), PlayerProfile.wins.desc())
        .all()
    )

    return jsonify([player.serialize() for player in players]), 200


@api.route("/players", methods=["GET"])
@jwt_required()
def get_players():
    players = (
        PlayerProfile.query.filter_by(status="approved")
        .order_by(PlayerProfile.level.asc())
        .all()
    )

    return jsonify([player.serialize() for player in players]), 200


@api.route("/matches", methods=["GET"])
def get_matches():
    matches = Match.query.order_by(Match.created_at.desc()).all()
    return jsonify([match.serialize() for match in matches]), 200


@api.route("/matches", methods=["POST"])
@jwt_required()
def create_match():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    required_fields = [
        "level",
        "team_a_player_1_id",
        "team_a_player_2_id",
        "team_b_player_1_id",
        "team_b_player_2_id",
        "score",
        "winner_team",
        "played_at",
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"msg": f"Falta el campo {field}"}), 400

    player_ids = [
        int(data.get("team_a_player_1_id")),
        int(data.get("team_a_player_2_id")),
        int(data.get("team_b_player_1_id")),
        int(data.get("team_b_player_2_id")),
    ]

    if len(player_ids) != len(set(player_ids)):
        return jsonify({"msg": "No puedes repetir jugadores en el mismo partido"}), 400

    for player_id in player_ids:
        profile = PlayerProfile.query.get(player_id)
        if not profile:
            return jsonify({"msg": "Uno de los jugadores no existe"}), 404

        if profile.status != "approved":
            return jsonify({"msg": "Todos los jugadores deben estar aprobados"}), 400

    winner_team = data.get("winner_team")

    if winner_team not in ["A", "B"]:
        return jsonify({"msg": "El ganador debe ser Equipo A o Equipo B"}), 400

    try:
        played_at = datetime.fromisoformat(data.get("played_at"))
    except ValueError:
        return jsonify({"msg": "Fecha no válida"}), 400

    match = Match(
        level=data.get("level"),
        team_a_player_1_id=player_ids[0],
        team_a_player_2_id=player_ids[1],
        team_b_player_1_id=player_ids[2],
        team_b_player_2_id=player_ids[3],
        score=data.get("score"),
        winner_team=winner_team,
        club=data.get("club", ""),
        played_at=played_at,
        status="approved",
        submitted_by_id=current_user_id,
    )

    db.session.add(match)
    db.session.commit()

    recalculate_ranking_internal()

    return jsonify(
        {
            "msg": "Partido creado correctamente",
            "match": match.serialize(),
        }
    ), 201


@api.route("/rules", methods=["GET"])
def get_rules():
    rules = Rules.query.first()

    if not rules:
        return jsonify(
            {
                "title": "Normas de Fuera de Pista",
                "content": "Todavía no se han publicado normas.",
            }
        ), 200

    return jsonify(rules.serialize()), 200


@api.route("/admin/rules", methods=["PUT"])
@jwt_required()
def update_rules():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json()

    if not data.get("title") or not data.get("content"):
        return jsonify({"msg": "Título y contenido son obligatorios"}), 400

    rules = Rules.query.first()

    if not rules:
        rules = Rules(
            title=data.get("title"),
            content=data.get("content"),
            updated_by_id=current_user_id,
        )
        db.session.add(rules)
    else:
        rules.title = data.get("title")
        rules.content = data.get("content")
        rules.updated_by_id = current_user_id
        rules.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {
            "msg": "Normas actualizadas correctamente",
            "rules": rules.serialize(),
        }
    ), 200


@api.route("/admin/players", methods=["GET"])
@jwt_required()
def admin_get_players():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    status = request.args.get("status")
    level = request.args.get("level")

    query = PlayerProfile.query.join(User)

    if status and status != "Todos":
        query = query.filter(PlayerProfile.status == status)

    if level and level != "Todos":
        query = query.filter(PlayerProfile.level == level)

    players = query.order_by(PlayerProfile.created_at.desc()).all()

    return jsonify([player.serialize() for player in players]), 200


@api.route("/admin/players/<int:profile_id>", methods=["PUT"])
@jwt_required()
def admin_update_player(profile_id):
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    profile = PlayerProfile.query.get(profile_id)

    if not profile:
        return jsonify({"msg": "Jugador no encontrado"}), 404

    data = request.get_json()

    if "status" in data:
        if data["status"] not in ["pending", "approved", "rejected"]:
            return jsonify({"msg": "Estado no válido"}), 400

        profile.status = data["status"]

    if "level" in data:
        profile.level = data["level"]

    if "position" in data:
        profile.position = data["position"]

    db.session.commit()

    return jsonify(
        {
            "msg": "Jugador actualizado correctamente",
            "player": profile.serialize(),
        }
    ), 200


@api.route("/admin/players/<int:profile_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_player(profile_id):
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    profile = PlayerProfile.query.get(profile_id)

    if not profile:
        return jsonify({"msg": "Jugador no encontrado"}), 404

    user = User.query.get(profile.user_id)

    if user and user.is_admin:
        return jsonify({"msg": "No puedes eliminar un administrador"}), 400

    related_matches = Match.query.filter(
        db.or_(
            Match.team_a_player_1_id == profile.id,
            Match.team_a_player_2_id == profile.id,
            Match.team_b_player_1_id == profile.id,
            Match.team_b_player_2_id == profile.id,
        )
    ).all()

    for match in related_matches:
        db.session.delete(match)

    if user:
        db.session.delete(user)
    else:
        db.session.delete(profile)

    db.session.commit()

    recalculate_ranking_internal()

    return jsonify({"msg": "Jugador eliminado correctamente"}), 200


@api.route("/admin/matches", methods=["GET"])
@jwt_required()
def admin_get_matches():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    matches = Match.query.order_by(Match.created_at.desc()).all()

    return jsonify([match.serialize() for match in matches]), 200


@api.route("/admin/matches/<int:match_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_match(match_id):
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    match = Match.query.get(match_id)

    if not match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    db.session.delete(match)
    db.session.commit()

    recalculate_ranking_internal()

    return jsonify({"msg": "Partido eliminado correctamente"}), 200


@api.route("/admin/recalculate-ranking", methods=["POST"])
@jwt_required()
def admin_recalculate_ranking():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    recalculate_ranking_internal()

    return jsonify({"msg": "Ranking recalculado correctamente"}), 200