import os

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from sqlalchemy import or_
import resend

from api.models import (
    db,
    User,
    PlayerProfile,
    Match,
    Season,
    SeasonRankingSnapshot,
    Rules,
    OpenMatch,
    OpenMatchPlayer,
    Notification,
)

api = Blueprint("api", __name__)


# =========================
# HELPERS
# =========================

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


def create_notification(user_id, title, message, notification_type, open_match_id=None):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        open_match_id=open_match_id,
        is_read=False,
    )

    db.session.add(notification)
    return notification


def send_email(to_email, subject, html):
    if not to_email:
        return False

    resend_api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "Ranking Jeddah <onboarding@resend.dev>")

    if not resend_api_key:
        print("RESEND_API_KEY no configurada. Email no enviado.")
        return False

    try:
        resend.api_key = resend_api_key

        resend.Emails.send(
            {
                "from": email_from,
                "to": [to_email],
                "subject": subject,
                "html": html,
            }
        )

        return True
    except Exception as error:
        print(f"Error enviando email a {to_email}: {error}")
        return False


def get_player_display_name(player):
    if not player:
        return "Jugador"

    if player.user and player.user.nickname:
        return player.user.nickname

    if player.user and player.user.name:
        return player.user.name

    return "Jugador"


def format_open_match_date(open_match):
    if not open_match or not open_match.match_date:
        return "-"

    return open_match.match_date.strftime("%d/%m/%Y")


def format_open_match_time(open_match):
    if not open_match or not open_match.match_time:
        return "-"

    return open_match.match_time.strftime("%H:%M")


def send_open_match_completed_emails(open_match, players):
    if not open_match or not players:
        return

    unique_emails = set()

    player_names = [get_player_display_name(player) for player in players if player]
    players_html = "".join([f"<li>{name}</li>" for name in player_names])

    subject = "Tu partido está completo 🎾"

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Tu partido está completo 🎾</h2>

      <p>Ya se han unido los 4 jugadores y las parejas se han creado automáticamente.</p>

      <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p><strong>Club:</strong> {open_match.club or "-"}</p>
        <p><strong>Fecha:</strong> {format_open_match_date(open_match)}</p>
        <p><strong>Hora:</strong> {format_open_match_time(open_match)}</p>
        <p><strong>Nivel:</strong> {open_match.level or "-"}</p>
      </div>

      <p><strong>Jugadores:</strong></p>
      <ul>
        {players_html}
      </ul>

      <p>Entra en la app para revisar los detalles del partido.</p>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Ranking Jeddah · Out of the Court
      </p>
    </div>
    """

    for player in players:
        if not player or not player.user or not player.user.email:
            continue

        email = player.user.email.strip().lower()

        if email in unique_emails:
            continue

        unique_emails.add(email)
        send_email(email, subject, html)


def send_result_registered_emails(match):
    if not match:
        return

    players = [
        match.team_a_player_1,
        match.team_a_player_2,
        match.team_b_player_1,
        match.team_b_player_2,
    ]

    unique_emails = set()

    team_a_names = [
        get_player_display_name(match.team_a_player_1),
        get_player_display_name(match.team_a_player_2),
    ]

    team_b_names = [
        get_player_display_name(match.team_b_player_1),
        get_player_display_name(match.team_b_player_2),
    ]

    winner_text = "Equipo A" if match.winner_team == "A" else "Equipo B"

    subject = "Resultado registrado 🎾"

    html = f"""
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2>Resultado registrado 🎾</h2>

      <p>El resultado de tu partido se ha registrado correctamente y el ranking se ha actualizado.</p>

      <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p><strong>Club:</strong> {match.club or "-"}</p>
        <p><strong>Nivel:</strong> {match.level or "-"}</p>
        <p><strong>Resultado:</strong> {match.score or "-"}</p>
        <p><strong>Ganador:</strong> {winner_text}</p>
      </div>

      <p><strong>Equipo A:</strong> {team_a_names[0]} / {team_a_names[1]}</p>
      <p><strong>Equipo B:</strong> {team_b_names[0]} / {team_b_names[1]}</p>

      <p>Entra en la app para ver el ranking actualizado.</p>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Ranking Jeddah · Out of the Court
      </p>
    </div>
    """

    for player in players:
        if not player or not player.user or not player.user.email:
            continue

        email = player.user.email.strip().lower()

        if email in unique_emails:
            continue

        unique_emails.add(email)
        send_email(email, subject, html)


def expire_old_open_matches():
    now = datetime.utcnow()

    open_matches = OpenMatch.query.filter(
        OpenMatch.status == "open",
        OpenMatch.result_match_id.is_(None),
    ).all()

    expired_count = 0

    for open_match in open_matches:
        if not open_match.match_date or not open_match.match_time:
            continue

        match_datetime = datetime.combine(
            open_match.match_date,
            open_match.match_time,
        )

        if match_datetime < now:
            open_match.status = "cancelled"
            expired_count += 1

    if expired_count > 0:
        db.session.commit()

    return expired_count


def get_ranking_sorted_players():
    players = PlayerProfile.query.filter_by(status="approved").all()

    return sorted(
        players,
        key=lambda player: (
            player.win_percentage(),
            player.wins,
            player.matches_played,
        ),
        reverse=True,
    )


def get_profile_ranking_index(profile_id):
    sorted_players = get_ranking_sorted_players()

    for index, player in enumerate(sorted_players, start=1):
        if player.id == profile_id:
            return index

    return 999999


def close_open_match_if_full(open_match):
    if open_match.status != "open":
        return False

    joined_players = [item.player_profile for item in open_match.players]

    if len(joined_players) < open_match.max_players:
        return False

    ranked_players = sorted(
        joined_players,
        key=lambda player: get_profile_ranking_index(player.id),
    )

    if len(ranked_players) != 4:
        return False

    open_match.team_a_player_1_id = ranked_players[0].id
    open_match.team_a_player_2_id = ranked_players[2].id

    open_match.team_b_player_1_id = ranked_players[1].id
    open_match.team_b_player_2_id = ranked_players[3].id

    open_match.status = "closed"
    open_match.closed_at = datetime.utcnow()

    for player in ranked_players:
        if player and player.user_id:
            create_notification(
                user_id=player.user_id,
                title="Partido completo",
                message=(
                    f"El partido en {open_match.club} ya está completo. "
                    f"Sois {len(ranked_players)}/{open_match.max_players} jugadores. "
                    f"Las parejas se han creado automáticamente."
                ),
                notification_type="open_match_closed",
                open_match_id=open_match.id,
            )

    send_open_match_completed_emails(open_match, ranked_players)

    return True


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

    players = sorted(
        PlayerProfile.query.filter_by(status="approved").all(),
        key=lambda player: (
            player.win_percentage(),
            player.wins,
            player.matches_played,
        ),
        reverse=True,
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


# =========================
# BASIC
# =========================

@api.route("/hello", methods=["GET"])
def handle_hello():
    return jsonify({"message": "Hello from Fuera de Pista"}), 200


# =========================
# AUTH
# =========================

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

    if data.get("terms_accepted") is not True:
        return jsonify(
            {"msg": "Debes aceptar los Términos y Condiciones para registrarte"}
        ), 400

    if data.get("privacy_accepted") is not True:
        return jsonify(
            {"msg": "Debes aceptar la Política de Privacidad para registrarte"}
        ), 400

    email = data.get("email").lower().strip()
    nickname = data.get("nickname").strip()

    existing_email = User.query.filter_by(email=email).first()

    if existing_email:
        return jsonify({"msg": "Ya existe un usuario con este email"}), 400

    existing_nickname = User.query.filter(
        db.func.lower(User.nickname) == nickname.lower()
    ).first()

    if existing_nickname:
        return jsonify(
            {"msg": "Este nickname ya está en uso. Elige otro."}
        ), 400

    now = datetime.utcnow()

    user = User(
        name=data.get("name").strip(),
        last_name=data.get("last_name").strip(),
        nickname=nickname,
        email=email,
        password_hash=generate_password_hash(data.get("password")),
        phone=data.get("phone").strip(),
        instagram=data.get("instagram", "").strip(),
        is_admin=False,
        terms_accepted=True,
        terms_accepted_at=now,
        privacy_accepted=True,
        privacy_accepted_at=now,
    )

    db.session.add(user)
    db.session.flush()

    profile = PlayerProfile(
        user_id=user.id,
        level=data.get("level"),
        position=data.get("position"),
        status="pending",
        payment_status="unpaid",
        payment_method=None,
        payment_reference=None,
        paid_at=None,
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
            "profile": profile.serialize(),
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


# =========================
# PROFILE
# =========================

@api.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user = get_current_user()

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    return jsonify(user.serialize()), 200



# =========================
# SEASONS / RANKING
# =========================

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

    players = query.filter(PlayerProfile.status == "approved").all()

    sorted_players = sorted(
        players,
        key=lambda player: (
            player.win_percentage(),
            player.wins,
            player.matches_played,
        ),
        reverse=True,
    )

    return jsonify([player.serialize() for player in sorted_players]), 200


@api.route("/players", methods=["GET"])
@jwt_required()
def get_players():
    players = (
        PlayerProfile.query.filter_by(status="approved")
        .order_by(PlayerProfile.level.asc())
        .all()
    )

    return jsonify([player.serialize() for player in players]), 200


# =========================
# MATCH RESULTS
# =========================

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

    current_user = get_current_user()

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    if not current_user.profile:
        return jsonify({"msg": "Usuario sin perfil de jugador"}), 400

    current_profile = current_user.profile

    if current_profile.status != "approved":
        return jsonify({"msg": "Tu perfil debe estar aprobado para subir resultados"}), 403

    if current_profile.payment_status != "paid":
        return jsonify(
            {
                "msg": "Para subir resultados tienes que tener el pago STC confirmado"
            }
        ), 403

    data = request.get_json() or {}

    open_match_id = data.get("open_match_id")
    open_match = None

    if open_match_id:
        try:
            open_match_id = int(open_match_id)
        except (ValueError, TypeError):
            return jsonify({"msg": "Partido abierto no válido"}), 400

        open_match = OpenMatch.query.get(open_match_id)

        if not open_match:
            return jsonify({"msg": "Partido abierto no encontrado"}), 404

        if open_match.status != "closed":
            return jsonify({"msg": "El partido abierto todavía no está cerrado"}), 400

        if open_match.result_match_id:
            return jsonify({"msg": "Este partido abierto ya tiene un resultado subido"}), 400

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
    except (ValueError, TypeError):
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

    players_by_id = {}

    for player_id in player_ids:
        profile = PlayerProfile.query.get(player_id)

        if not profile:
            return jsonify({"msg": "Uno de los jugadores no existe"}), 404

        if profile.status != "approved":
            return jsonify({"msg": "Todos los jugadores deben estar aprobados"}), 400

        if profile.payment_status != "paid":
            player_name = (
                profile.user.nickname
                if profile.user and profile.user.nickname
                else "Un jugador"
            )

            return jsonify(
                {
                    "msg": f"{player_name} no tiene el pago STC confirmado"
                }
            ), 403

        players_by_id[player_id] = profile

    if open_match:
        open_match_player_ids = [
            open_match.team_a_player_1_id,
            open_match.team_a_player_2_id,
            open_match.team_b_player_1_id,
            open_match.team_b_player_2_id,
        ]

        if None in open_match_player_ids:
            return jsonify({"msg": "El partido abierto no tiene parejas creadas"}), 400

        if set(player_ids) != set(open_match_player_ids):
            return jsonify(
                {"msg": "Los jugadores no coinciden con el partido abierto"}
            ), 400

        if data.get("level") != open_match.level:
            return jsonify(
                {"msg": "El nivel no coincide con el partido abierto"}
            ), 400

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
        status="confirmed",
        submitted_by_id=current_user.id,
        submitted_by_profile_id=current_profile.id,
        confirmed_by_profile_id=current_profile.id,
        confirmed_at=datetime.utcnow(),
    )

    db.session.add(match)
    db.session.flush()

    if open_match:
        open_match.result_match_id = match.id
        open_match.status = "closed"

    db.session.commit()

    recalculate_ranking_internal(active_season.id)

    db.session.refresh(match)

    if open_match:
        db.session.refresh(open_match)

    send_result_registered_emails(match)

    return jsonify(
        {
            "msg": "Resultado subido correctamente. El ranking se ha actualizado automáticamente.",
            "match": match.serialize(),
            "open_match": open_match.serialize() if open_match else None,
        }
    ), 201


# =========================
# NOTIFICATIONS
# =========================

@api.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    notifications = (
        Notification.query.filter_by(
            user_id=current_user.id,
            is_read=False,
        )
        .order_by(Notification.created_at.desc())
        .all()
    )

    return jsonify([notification.serialize() for notification in notifications]), 200

@api.route("/notifications/read-all", methods=["PUT"])
@jwt_required()
def mark_all_notifications_as_read():
    current_user = get_current_user()

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    notifications = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False,
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.session.commit()

    return jsonify(
        {
            "msg": "Todas las notificaciones han sido borradas",
            "count": len(notifications),
        }
    ), 200

@api.route("/notifications/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_as_read(notification_id):
    current_user = get_current_user()

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    notification = Notification.query.get(notification_id)

    if not notification:
        return jsonify({"msg": "Notificación no encontrada"}), 404

    if notification.user_id != current_user.id:
        return jsonify({"msg": "No autorizado"}), 403

    notification.is_read = True
    db.session.commit()

    return jsonify(
        {
            "msg": "Notificación marcada como leída",
            "notification": notification.serialize(),
        }
    ), 200


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
            {"msg": "Solo un jugador de la pareja rival puede validar este resultado"}
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
            {"msg": "Solo un jugador de la pareja rival puede rechazar este resultado"}
        ), 403

    match.status = "rejected"
    match.rejected_by_profile_id = current_profile.id
    match.rejected_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {
            "msg": "Resultado rechazado correctamente. No se guardará en resultados.",
            "match": match.serialize(),
        }
    ), 200


# =========================
# OPEN MATCHES
# =========================

@api.route("/open-matches", methods=["GET"])
@jwt_required()
def get_open_matches():
    expire_old_open_matches()

    current_user = get_current_user()

    if not current_user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    query = OpenMatch.query

    query = query.filter(OpenMatch.result_match_id.is_(None))
    query = query.filter(OpenMatch.status != "cancelled")

    if not current_user.is_admin:
        if not current_user.profile:
            return jsonify({"msg": "Perfil no encontrado"}), 404

        query = query.filter(OpenMatch.level == current_user.profile.level)

    open_matches = query.order_by(
        OpenMatch.match_date.asc(),
        OpenMatch.match_time.asc(),
    ).all()

    return jsonify([open_match.serialize() for open_match in open_matches]), 200


@api.route("/admin/open-matches", methods=["POST"])
@jwt_required()
def admin_create_open_match():
    expire_old_open_matches()

    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json() or {}

    required_fields = ["level", "club", "match_date", "match_time"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"msg": f"Falta el campo {field}"}), 400

    try:
        match_date = datetime.strptime(data.get("match_date"), "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"msg": "Fecha no válida"}), 400

    try:
        match_time = datetime.strptime(data.get("match_time"), "%H:%M").time()
    except ValueError:
        return jsonify({"msg": "Hora no válida"}), 400

    match_datetime = datetime.combine(match_date, match_time)

    if match_datetime < datetime.utcnow():
        return jsonify(
            {"msg": "No puedes crear un partido con una fecha u hora pasada"}
        ), 400

    open_match = OpenMatch(
        level=data.get("level"),
        club=data.get("club").strip(),
        match_date=match_date,
        match_time=match_time,
        max_players=4,
        status="open",
        description=data.get("description", "").strip(),
        created_by_id=current_user_id,
    )

    db.session.add(open_match)
    db.session.flush()

    players_to_notify = PlayerProfile.query.filter_by(
        level=open_match.level,
        status="approved",
        payment_status="paid",
    ).all()

    for player in players_to_notify:
        if player.user_id:
            create_notification(
                user_id=player.user_id,
                title=f"Nuevo partido en {open_match.level}",
                message=(
                    f"El admin ha abierto un partido en {open_match.club} "
                    f"el {open_match.match_date.strftime('%d/%m/%Y')} "
                    f"a las {open_match.match_time.strftime('%H:%M')}."
                ),
                notification_type="open_match_created",
                open_match_id=open_match.id,
            )

    db.session.commit()

    return jsonify(
        {
            "msg": "Partido abierto creado correctamente",
            "open_match": open_match.serialize(),
        }
    ), 201


@api.route("/open-matches/<int:open_match_id>/join", methods=["POST"])
@jwt_required()
def join_open_match(open_match_id):
    expire_old_open_matches()

    current_profile = get_current_profile()

    if not current_profile:
        return jsonify({"msg": "Perfil no encontrado"}), 404

    if current_profile.status != "approved":
        return jsonify(
            {"msg": "Tu perfil debe estar aprobado para unirte a partidos"}
        ), 403

    if current_profile.payment_status != "paid":
        return jsonify(
            {
                "msg": "Para apuntarte a partidos tienes que tener el pago STC confirmado"
            }
        ), 403

    open_match = OpenMatch.query.get(open_match_id)

    if not open_match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    if open_match.status == "cancelled":
        return jsonify(
            {"msg": "Este partido ya no está disponible porque la fecha ha pasado"}
        ), 400

    if open_match.status != "open":
        return jsonify({"msg": "Este partido ya está cerrado"}), 400

    if open_match.result_match_id:
        return jsonify({"msg": "Este partido ya tiene resultado subido"}), 400

    if open_match.match_date and open_match.match_time:
        match_datetime = datetime.combine(
            open_match.match_date,
            open_match.match_time,
        )

        if match_datetime < datetime.utcnow():
            open_match.status = "cancelled"
            db.session.commit()

            return jsonify(
                {"msg": "Este partido ya no está disponible porque la fecha ha pasado"}
            ), 400

    if open_match.level != current_profile.level:
        return jsonify(
            {"msg": "Solo puedes apuntarte a partidos de tu nivel"}
        ), 403

    already_joined = OpenMatchPlayer.query.filter_by(
        open_match_id=open_match.id,
        player_profile_id=current_profile.id,
    ).first()

    if already_joined:
        return jsonify({"msg": "Ya estás apuntado a este partido"}), 400

    current_players_count = OpenMatchPlayer.query.filter_by(
        open_match_id=open_match.id
    ).count()

    if current_players_count >= open_match.max_players:
        return jsonify({"msg": "El partido ya está completo"}), 400

    existing_players = OpenMatchPlayer.query.filter_by(
        open_match_id=open_match.id
    ).all()

    open_match_player = OpenMatchPlayer(
        open_match_id=open_match.id,
        player_profile_id=current_profile.id,
    )

    db.session.add(open_match_player)
    db.session.flush()

    updated_players_count = current_players_count + 1

    player_name = (
        current_profile.user.nickname
        if current_profile.user and current_profile.user.nickname
        else "Un jugador"
    )

    for existing_player in existing_players:
        player_profile = existing_player.player_profile

        if player_profile and player_profile.user_id:
            create_notification(
                user_id=player_profile.user_id,
                title="Nuevo jugador apuntado",
                message=(
                    f"{player_name} se ha unido al partido en {open_match.club}. "
                    f"Ya sois {updated_players_count}/{open_match.max_players} jugadores."
                ),
                notification_type="open_match_joined",
                open_match_id=open_match.id,
            )

    was_closed = close_open_match_if_full(open_match)

    db.session.commit()
    db.session.refresh(open_match)

    if was_closed:
        response_message = (
            "Te has unido al partido correctamente. "
            "El partido ya está completo y las parejas se han creado automáticamente."
        )
    else:
        response_message = "Te has unido al partido correctamente"

    return jsonify(
        {
            "msg": response_message,
            "open_match": open_match.serialize(),
        }
    ), 200


@api.route("/open-matches/<int:open_match_id>/leave", methods=["DELETE"])
@jwt_required()
def leave_open_match(open_match_id):
    current_profile = get_current_profile()

    if not current_profile:
        return jsonify({"msg": "Perfil no encontrado"}), 404

    open_match = OpenMatch.query.get(open_match_id)

    if not open_match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    if open_match.status != "open":
        return jsonify({"msg": "No puedes salir de un partido ya cerrado"}), 400

    if open_match.match_date and open_match.match_time:
        match_datetime = datetime.combine(
            open_match.match_date,
            open_match.match_time,
        )

        time_until_match = match_datetime - datetime.utcnow()

        if time_until_match <= timedelta(hours=24):
            return jsonify(
                {
                    "msg": "No puedes salirte del partido cuando faltan menos de 24 horas."
                }
            ), 400

    open_match_player = OpenMatchPlayer.query.filter_by(
        open_match_id=open_match.id,
        player_profile_id=current_profile.id,
    ).first()

    if not open_match_player:
        return jsonify({"msg": "No estás apuntado a este partido"}), 400

    db.session.delete(open_match_player)
    db.session.commit()

    return jsonify(
        {
            "msg": "Has salido del partido correctamente",
            "open_match": open_match.serialize(),
        }
    ), 200


@api.route("/admin/open-matches/<int:open_match_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_open_match(open_match_id):
    current_user_id = get_jwt_identity()

    if not is_admin_user(current_user_id):
        return jsonify({"msg": "No autorizado"}), 403

    open_match = OpenMatch.query.get(open_match_id)

    if not open_match:
        return jsonify({"msg": "Partido no encontrado"}), 404

    db.session.delete(open_match)
    db.session.commit()

    return jsonify({"msg": "Partido eliminado correctamente"}), 200


# =========================
# RULES
# =========================

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


# =========================
# ADMIN PLAYERS
# =========================

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

    if "payment_status" in data:
        if data["payment_status"] not in ["unpaid", "paid"]:
            return jsonify({"msg": "Estado de pago no válido"}), 400

        profile.payment_status = data["payment_status"]

        if data["payment_status"] == "paid":
            if not profile.paid_at:
                profile.paid_at = datetime.utcnow()

            profile.payment_method = "stc_manual"

            if profile.status == "pending":
                profile.status = "approved"

        else:
            profile.paid_at = None
            profile.payment_method = None
            profile.payment_reference = None

    if "payment_reference" in data:
        profile.payment_reference = data["payment_reference"].strip()

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

    if "is_admin" in data:
        if data["is_admin"] is not True:
            return jsonify(
                {"msg": "Solo se permite convertir usuarios en admin desde este panel"}
            ), 400

        if user.is_admin:
            return jsonify(
                {"msg": "Este usuario ya es administrador", "player": profile.serialize()}
            ), 200

        user.is_admin = True

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


# =========================
# ADMIN MATCHES
# =========================

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

    linked_open_match = OpenMatch.query.filter_by(result_match_id=match.id).first()

    if linked_open_match:
        linked_open_match.result_match_id = None
        linked_open_match.status = "closed"

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


# =========================
# ADMIN SEASONS
# =========================

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