from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import or_

from api.models import (
    db,
    User,
    PlayerProfile,
    Match,
    Rules,
    Season,
    SeasonRankingSnapshot,
)

api = Blueprint("api", __name__)


def is_admin_user(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


def get_current_user():
    current_user_id = get_jwt_identity()
    return User.query.get(current_user_id)


def get_current_profile():
    user = get_current_user()

    if not user or not user.profile:
        return None

    return user.profile


def get_match_validation_team_ids(match):
    team_a_ids = [
        match.team_a_player_1_id,
        match.team_a_player_2_id,
    ]

    team_b_ids = [
        match.team_b_player_1_id,
        match.team_b_player_2_id,
    ]

    submitted_by_profile_id = match.submitted_by_profile_id

    if not submitted_by_profile_id and match.submitted_by and match.submitted_by.profile:
        submitted_by_profile_id = match.submitted_by.profile.id
        match.submitted_by_profile_id = submitted_by_profile_id

    if submitted_by_profile_id in team_a_ids:
        return team_b_ids

    if submitted_by_profile_id in team_b_ids:
        return team_a_ids

    return []


def get_or_create_active_season():
    active_season = Season.query.filter_by(is_active=True, is_closed=False).first()

    if active_season:
        return active_season

    season = Season(
        name="Temporada actual",
        start_date=datetime.utcnow(),
        is_active=True,
        is_closed=False,
    )

    db.session.add(season)
    db.session.commit()

    return season


def assign_old_matches_to_active_season():
    active_season = get_or_create_active_season()

    old_matches = Match.query.filter(Match.season_id.is_(None)).all()

    for match in old_matches:
        match.season_id = active_season.id

    db.session.commit()

    return active_season


def recalculate_ranking_internal(season_id=None):
    if not season_id:
        active_season = assign_old_matches_to_active_season()
        season_id = active_season.id

    profiles = PlayerProfile.query.all()

    for profile in profiles:
        profile.matches_played = 0
        profile.wins = 0
        profile.losses = 0
        profile.points = 0

    matches = Match.query.filter_by(
        season_id=season_id,
        status="confirmed",
    ).all()

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


def reset_current_ranking_stats():
    profiles = PlayerProfile.query.all()

    for profile in profiles:
        profile.matches_played = 0
        profile.wins = 0
        profile.losses = 0
        profile.points = 0

    db.session.commit()


def create_season_snapshots(season):
    old_snapshots = SeasonRankingSnapshot.query.filter_by(
        season_id=season.id
    ).all()

    for snapshot in old_snapshots:
        db.session.delete(snapshot)

    db.session.flush()

    players = (
        PlayerProfile.query.filter_by(status="approved")
        .order_by(
            PlayerProfile.points.desc(),
            PlayerProfile.wins.desc(),
            PlayerProfile.matches_played.desc(),
        )
        .all()
    )

    for index, player in enumerate(players, start=1):
        snapshot = SeasonRankingSnapshot(
            season_id=season.id,
            profile_id=player.id,
            final_position=index,
            nickname=player.user.nickname if player.user else "Jugador",
            name=player.user.name if player.user else "",
            last_name=player.user.last_name if player.user else "",
            level=player.level,
            player_position=player.position,
            matches_played=player.matches_played,
            wins=player.wins,
            losses=player.losses,
            points=player.points,
            win_percentage=player.win_percentage(),
        )

        db.session.add(snapshot)

    db.session.commit()


@api.route("/hello", methods=["GET"])
def handle_hello():
    return jsonify({"message": "Hello from Fuera de Pista"}), 200


@api.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

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
    data = request.get_json() or {}

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


@api.route("/profile/photo", methods=["PUT"])
@jwt_required()
def update_profile_photo():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    data = request.get_json() or {}
    profile_image = data.get("profile_image")

    if not profile_image:
        return jsonify({"msg": "No se ha enviado ninguna imagen"}), 400

    if not profile_image.startswith("data:image/"):
        return jsonify({"msg": "Formato de imagen no válido"}), 400

    if len(profile_image) > 1500000:
        return jsonify(
            {"msg": "La imagen es demasiado grande. Usa una imagen más ligera."}
        ), 400

    user.profile_image = profile_image

    db.session.commit()

    return jsonify(
        {
            "msg": "Foto de perfil actualizada correctamente",
            "user": user.serialize(),
        }
    ), 200


@api.route("/seasons", methods=["GET"])
@jwt_required()
def get_seasons():
    assign_old_matches_to_active_season()

    seasons = Season.query.order_by(Season.created_at.desc()).all()

    return jsonify([season.serialize() for season in seasons]), 200


@api.route("/ranking", methods=["GET"])
@jwt_required()
def get_ranking():
    assign_old_matches_to_active_season()

    level = request.args.get("level")
    season_id = request.args.get("season_id")

    if season_id:
        season = Season.query.get(season_id)

        if not season:
            return jsonify({"msg": "Temporada no encontrada"}), 404

        if season.is_closed:
            query = SeasonRankingSnapshot.query.filter_by(season_id=season.id)

            if level and level != "Todos":
                query = query.filter(SeasonRankingSnapshot.level == level)

            snapshots = query.order_by(
                SeasonRankingSnapshot.final_position.asc()
            ).all()

            return jsonify([snapshot.serialize() for snapshot in snapshots]), 200

        recalculate_ranking_internal(season.id)

    else:
        active_season = get_or_create_active_season()
        recalculate_ranking_internal(active_season.id)

    query = PlayerProfile.query.join(User)

    if level and level != "Todos":
        query = query.filter(PlayerProfile.level == level)

    players = (
        query.filter(PlayerProfile.status == "approved")
        .order_by(
            PlayerProfile.points.desc(),
            PlayerProfile.wins.desc(),
            PlayerProfile.matches_played.desc(),
        )
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
@jwt_required()
def get_matches():
    assign_old_matches_to_active_season()

    season_id = request.args.get("season_id")

    query = Match.query.filter_by(status="confirmed")

    if season_id:
        query = query.filter_by(season_id=season_id)
    else:
        active_season = get_or_create_active_season()
        query = query.filter_by(season_id=active_season.id)

    matches = query.order_by(Match.created_at.desc()).all()

    return jsonify([match.serialize() for match in matches]), 200


@api.route("/matches", methods=["POST"])
@jwt_required()
def create_match():
    active_season = assign_old_matches_to_active_season()

    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    if not current_user.profile:
        return jsonify({"msg": "Usuario sin perfil de jugador"}), 400

    current_profile = current_user.profile

    if current_profile.status != "approved":
        return jsonify({"msg": "Tu perfil debe estar aprobado para subir resultados"}), 403

    data = request.get_json() or {}

    required_fields = [
        "level",
        "team_a_player_1_id",
        "team_a_player_2_id",
        "team_b_player_1_id",
        "team_b_player_2_id",
        "score",
        "winner_team",
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"msg": f"Falta el campo {field}"}), 400

    try:
        team_a_player_1_id = int(data.get("team_a_player_1_id"))
        team_a_player_2_id = int(data.get("team_a_player_2_id"))
        team_b_player_1_id = int(data.get("team_b_player_1_id"))
        team_b_player_2_id = int(data.get("team_b_player_2_id"))
    except ValueError:
        return jsonify({"msg": "Los jugadores seleccionados no son válidos"}), 400

    player_ids = [
        team_a_player_1_id,
        team_a_player_2_id,
        team_b_player_1_id,
        team_b_player_2_id,
    ]

    if len(player_ids) != len(set(player_ids)):
        return jsonify({"msg": "No puedes repetir jugadores en el mismo partido"}), 400

    if current_profile.id not in player_ids:
        return jsonify(
            {
                "msg": "Para subir un resultado tienes que ser uno de los 4 jugadores del partido"
            }
        ), 403

    for player_id in player_ids:
        profile = PlayerProfile.query.get(player_id)

        if not profile:
            return jsonify({"msg": "Uno de los jugadores no existe"}), 404

        if profile.status != "approved":
            return jsonify({"msg": "Todos los jugadores deben estar aprobados"}), 400

    winner_team = data.get("winner_team")

    if winner_team not in ["A", "B"]:
        return jsonify({"msg": "El ganador debe ser Equipo A o Equipo B"}), 400

    if data.get("played_at"):
        try:
            played_at = datetime.fromisoformat(data.get("played_at"))
        except ValueError:
            return jsonify({"msg": "Fecha no válida"}), 400
    else:
        played_at = datetime.utcnow()

    match = Match(
        season_id=active_season.id,
        level=data.get("level"),
        team_a_player_1_id=team_a_player_1_id,
        team_a_player_2_id=team_a_player_2_id,
        team_b_player_1_id=team_b_player_1_id,
        team_b_player_2_id=team_b_player_2_id,
        score=data.get("score").strip(),
        winner_team=winner_team,
        club=data.get("club", "").strip(),
        played_at=played_at,
        status="pending",
        submitted_by_id=current_user_id,
        submitted_by_profile_id=current_profile.id,
    )

    db.session.add(match)
    db.session.commit()

    return jsonify(
        {
            "msg": "Resultado enviado correctamente. Está pendiente de validación por la pareja rival.",
            "match": match.serialize(),
        }
    ), 201


@api.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    current_profile = get_current_profile()

    if not current_profile:
        return jsonify({"msg": "Perfil no encontrado"}), 404

    pending_matches = (
        Match.query.filter_by(status="pending")
        .order_by(Match.created_at.desc())
        .all()
    )

    notifications = []

    for match in pending_matches:
        validation_team_ids = get_match_validation_team_ids(match)

        if current_profile.id in validation_team_ids:
            notifications.append(match.serialize())

    db.session.commit()

    return jsonify(notifications), 200


@api.route("/matches/<int:match_id>/confirm", methods=["POST"])
@jwt_required()
def confirm_match(match_id):
    current_profile = get_current_profile()

    if not current_profile:
        return jsonify({"msg": "Perfil no encontrado"}), 404

    match = Match.query.get(match_id)

    if not match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    if match.status != "pending":
        return jsonify({"msg": "Este partido ya no está pendiente"}), 400

    validation_team_ids = get_match_validation_team_ids(match)

    if current_profile.id not in validation_team_ids:
        return jsonify(
            {
                "msg": "Solo un jugador de la pareja rival puede validar este resultado"
            }
        ), 403

    match.status = "confirmed"
    match.confirmed_by_profile_id = current_profile.id
    match.confirmed_at = datetime.utcnow()

    db.session.commit()

    recalculate_ranking_internal(match.season_id)

    return jsonify(
        {
            "msg": "Resultado aceptado correctamente. El ranking se ha actualizado.",
            "match": match.serialize(),
        }
    ), 200


@api.route("/matches/<int:match_id>/reject", methods=["POST"])
@jwt_required()
def reject_match(match_id):
    current_profile = get_current_profile()

    if not current_profile:
        return jsonify({"msg": "Perfil no encontrado"}), 404

    match = Match.query.get(match_id)

    if not match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    if match.status != "pending":
        return jsonify({"msg": "Este partido ya no está pendiente"}), 400

    validation_team_ids = get_match_validation_team_ids(match)

    if current_profile.id not in validation_team_ids:
        return jsonify(
            {
                "msg": "Solo un jugador de la pareja rival puede rechazar este resultado"
            }
        ), 403

    match.status = "rejected"
    match.rejected_by_profile_id = current_profile.id
    match.rejected_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {
            "msg": "Resultado rechazado correctamente. No sumará puntos.",
            "match": match.serialize(),
        }
    ), 200


@api.route("/rules", methods=["GET"])
@jwt_required()
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

    data = request.get_json() or {}

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

    user = User.query.get(profile.user_id)

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    data = request.get_json() or {}

    if "status" in data:
        if data["status"] not in ["pending", "approved", "rejected"]:
            return jsonify({"msg": "Estado no válido"}), 400

        profile.status = data["status"]

    if "level" in data:
        if not data["level"]:
            return jsonify({"msg": "El nivel no puede estar vacío"}), 400

        profile.level = data["level"]

    if "position" in data:
        if not data["position"]:
            return jsonify({"msg": "La posición no puede estar vacía"}), 400

        profile.position = data["position"]

    if "name" in data:
        if not data["name"].strip():
            return jsonify({"msg": "El nombre no puede estar vacío"}), 400

        user.name = data["name"].strip()

    if "last_name" in data:
        if not data["last_name"].strip():
            return jsonify({"msg": "Los apellidos no pueden estar vacíos"}), 400

        user.last_name = data["last_name"].strip()

    if "nickname" in data:
        nickname = data["nickname"].strip()

        if not nickname:
            return jsonify({"msg": "El nickname no puede estar vacío"}), 400

        existing_nickname = User.query.filter(
            User.nickname == nickname,
            User.id != user.id,
        ).first()

        if existing_nickname:
            return jsonify({"msg": "Ya existe otro usuario con este nickname"}), 400

        user.nickname = nickname

    if "email" in data:
        email = data["email"].lower().strip()

        if not email:
            return jsonify({"msg": "El email no puede estar vacío"}), 400

        existing_email = User.query.filter(
            User.email == email,
            User.id != user.id,
        ).first()

        if existing_email:
            return jsonify({"msg": "Ya existe otro usuario con este email"}), 400

        user.email = email

    if "phone" in data:
        user.phone = data["phone"].strip()

    if "instagram" in data:
        user.instagram = data["instagram"].strip()

    db.session.commit()

    active_season = get_or_create_active_season()
    recalculate_ranking_internal(active_season.id)

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
        or_(
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

    active_season = get_or_create_active_season()
    recalculate_ranking_internal(active_season.id)

    return jsonify({"msg": "Jugador eliminado correctamente"}), 200


@api.route("/admin/matches", methods=["GET"])
@jwt_required()
def admin_get_matches():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    assign_old_matches_to_active_season()

    season_id = request.args.get("season_id")
    status = request.args.get("status")

    query = Match.query

    if season_id:
        query = query.filter_by(season_id=season_id)

    if status and status != "Todos":
        query = query.filter_by(status=status)

    matches = query.order_by(Match.created_at.desc()).all()

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

    season_id = match.season_id

    db.session.delete(match)
    db.session.commit()

    recalculate_ranking_internal(season_id)

    return jsonify({"msg": "Partido eliminado correctamente"}), 200


@api.route("/admin/recalculate-ranking", methods=["POST"])
@jwt_required()
def admin_recalculate_ranking():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    active_season = assign_old_matches_to_active_season()
    recalculate_ranking_internal(active_season.id)

    return jsonify({"msg": "Ranking recalculado correctamente"}), 200


@api.route("/admin/seasons/create", methods=["POST"])
@jwt_required()
def admin_create_season():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json() or {}

    name = data.get("name", "").strip()

    if not name:
        return jsonify({"msg": "El nombre de la temporada es obligatorio"}), 400

    active_season = Season.query.filter_by(is_active=True, is_closed=False).first()

    if active_season:
        return jsonify(
            {
                "msg": "Ya existe una temporada activa. Cierra la actual antes de crear otra."
            }
        ), 400

    season = Season(
        name=name,
        start_date=datetime.utcnow(),
        is_active=True,
        is_closed=False,
    )

    db.session.add(season)
    db.session.commit()

    return jsonify(
        {
            "msg": "Temporada creada correctamente",
            "season": season.serialize(),
        }
    ), 201


@api.route("/admin/seasons/close", methods=["POST"])
@jwt_required()
def admin_close_current_season():
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json() or {}

    next_season_name = data.get("next_season_name", "").strip()

    if not next_season_name:
        return jsonify({"msg": "El nombre de la nueva temporada es obligatorio"}), 400

    active_season = assign_old_matches_to_active_season()

    recalculate_ranking_internal(active_season.id)

    create_season_snapshots(active_season)

    active_season.is_active = False
    active_season.is_closed = True
    active_season.end_date = datetime.utcnow()
    active_season.closed_at = datetime.utcnow()

    new_season = Season(
        name=next_season_name,
        start_date=datetime.utcnow(),
        is_active=True,
        is_closed=False,
    )

    db.session.add(new_season)
    db.session.commit()

    reset_current_ranking_stats()

    return jsonify(
        {
            "msg": "Temporada cerrada correctamente. Nueva temporada creada.",
            "closed_season": active_season.serialize(),
            "new_season": new_season.serialize(),
        }
    ), 200