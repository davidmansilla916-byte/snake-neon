from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# Configuración de la base de datos (SQLite local)
db_path = os.path.join(os.path.dirname(__file__), 'scores.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Puntaje
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)

# Crear base de datos al iniciar
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scores', methods=['GET'])
def get_scores():
    # Obtener los 10 mejores puntajes
    scores = Score.query.order_by(Score.score.desc()).limit(10).all()
    return jsonify([{'name': s.name, 'score': s.score} for s in scores])

@app.route('/api/scores', methods=['POST'])
def save_score():
    data = request.get_json()
    if not data or 'name' not in data or 'score' not in data:
        return jsonify({'error': 'Datos faltantes'}), 400
    
    # Limitar nombre a 20 caracteres
    name = data['name'][:20].strip() or "Anónimo"
    new_score = Score(name=name, score=data['score'])
    db.session.add(new_score)
    db.session.commit()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)