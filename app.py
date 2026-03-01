from flask import (Flask, render_template, request, redirect, url_for,
                   session, jsonify, flash, send_from_directory, abort)
from functools import wraps
import sqlite3, os, hashlib, datetime, json, io, shutil
from werkzeug.utils import secure_filename

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_OK = True
except ImportError:
    PIL_OK = False

app = Flask(__name__)
app.secret_key = 'eagle_security_lms_2024_v3'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_DIR
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024
ALLOWED_EXT = {'pdf','ppt','pptx','mp4','mov','avi','mkv','webm','png','jpg','jpeg'}

COMPANY = {
    'name':'Eagle Industrial Services Pvt. Ltd.',
    'short':'Eagle Security',
    'phone':'+91 89566 79935',
    'email':'eagleisplpune@gmail.com',
    'address':'Kasarwadi, Pimpri-Chinchwad, Pune, Maharashtra 411034',
    'tagline':'Reform. Perform. Transform.',
    'years':'35+',
}

DEFAULT_MODULES = [
    ("Security Fundamentals & Post Orders","Core principles of security operations, post orders, standing instructions and site-specific responsibilities.","Security Operations","#3B5BDB"),
    ("Fire Safety & Emergency Response","Fire prevention, evacuation procedures, use of fire extinguishers, and emergency contact protocols.","Safety & Compliance","#F04438"),
    ("Access Control & Visitor Management","Managing entry/exit points, visitor registration, badge systems, and unauthorized access procedures.","Security Operations","#0BA5EC"),
    ("CCTV Operations & Surveillance","Operating CCTV systems, monitoring feeds, recording procedures, and incident documentation.","Technology","#7C3AED"),
    ("Patrolling Techniques & QRT Procedures","Effective patrolling methods, Quick Response Team deployment, and incident escalation procedures.","Field Operations","#F79009"),
    ("Housekeeping Standards & Hygiene Protocols","Professional cleaning standards, hygiene compliance, waste management, and workplace sanitation.","Facility Management","#12B76A"),
    ("Legal Aspects of Security","PSARA Act, rights and limitations of security personnel, FIR procedures, and legal documentation.","Legal & Compliance","#6D28D9"),
    ("Soft Skills & Client Interaction","Professional communication, conflict de-escalation, customer service mindset, and grooming standards.","Professional Development","#0891B2"),
    ("Crowd & Event Management","Managing large gatherings, crowd control techniques, VIP protection, and event security protocols.","Field Operations","#D97706"),
    ("First Aid & Basic Medical Response","CPR techniques, wound care, handling medical emergencies, and coordination with medical services.","Safety & Compliance","#059669"),
]

DEFAULT_CHAPTERS = [
    ["Introduction & Overview","Core Concepts & Principles","Practical Applications","Assessment & Review"],
    ["Fire Hazard Identification","Evacuation Drill Procedures","Extinguisher Types & Usage","Post-Incident Reporting"],
    ["Access Control Systems","Visitor Registration Flow","Suspicious Persons Protocol","Documentation Requirements"],
    ["Camera System Overview","Monitoring Best Practices","Evidence Preservation","Incident Log Maintenance"],
    ["Patrol Route Planning","Night Patrol Protocols","QRT Activation Procedure","Coordination with Police"],
    ["Daily Cleaning Schedule","Chemicals & Safety Handling","Waste Segregation Standards","Reporting & Quality Check"],
    ["PSARA Act Overview","Rights of Security Personnel","Use of Force Guidelines","FIR & Legal Documentation"],
    ["Professional Communication","Conflict Resolution Skills","Client Handling Techniques","Grooming & Uniform Standards"],
    ["Crowd Psychology Basics","Barrier & Zone Management","VIP & Dignitary Protection","Incident Response Drill"],
    ["Basic Life Support","CPR Step-by-Step Guide","Common Emergency Scenarios","Medical Escalation Protocols"],
]

def get_db():
    db = sqlite3.connect(os.path.join(BASE_DIR, 'lms.db'))
    db.row_factory = sqlite3.Row
    return db

def hash_pw(p): return hashlib.sha256(p.encode()).hexdigest()
def allowed_file(f): return '.' in f and f.rsplit('.',1)[1].lower() in ALLOWED_EXT

def login_required(f):
    @wraps(f)
    def d(*a,**kw):
        if 'user_id' not in session: return redirect(url_for('login'))
        return f(*a,**kw)
    return d

def trainer_required(f):
    @wraps(f)
    def d(*a,**kw):
        if 'user_id' not in session or session.get('role')!='trainer': return redirect(url_for('login'))
        return f(*a,**kw)
    return d

def create_notification(db, user_id, title, body, ntype='info', link=''):
    db.execute('INSERT INTO notifications(user_id,title,body,type,link) VALUES(?,?,?,?,?)',
               (user_id,title,body,ntype,link))

def notify_trainees(db, title, body, ntype='info', link=''):
    for t in db.execute('SELECT id FROM users WHERE role="trainee"').fetchall():
        create_notification(db, t['id'], title, body, ntype, link)

def watermark_image(src, dst, text):
    if not PIL_OK: shutil.copy(src, dst); return
    try:
        img = Image.open(src).convert("RGBA")
        overlay = Image.new("RGBA", img.size, (255,255,255,0))
        draw = ImageDraw.Draw(overlay)
        W, H = img.size
        try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", max(18,W//35))
        except: font = ImageFont.load_default()
        for y in range(-H, H*2, max(H//5,100)):
            for x in range(-W, W*2, max(W//3,200)):
                draw.text((x,y), text, font=font, fill=(180,0,0,50))
        result = Image.alpha_composite(img, overlay).convert("RGB")
        result.save(dst, quality=90)
    except: shutil.copy(src, dst)

def watermark_pdf(src, dst, text):
    try:
        from pypdf import PdfReader, PdfWriter
        from reportlab.pdfgen import canvas as rl_c
        reader = PdfReader(src); writer = PdfWriter()
        for page in reader.pages:
            w = float(page.mediabox.width); h = float(page.mediabox.height)
            buf = io.BytesIO()
            c = rl_c.Canvas(buf, pagesize=(w,h))
            c.saveState()
            c.setFont("Helvetica-Bold", max(14, int(w/30)))
            c.setFillColorRGB(0.65, 0, 0, alpha=0.12)
            c.translate(w/2, h/2); c.rotate(38)
            c.drawCentredString(0, 40, text)
            c.drawCentredString(0, -30, "CONFIDENTIAL — DO NOT DISTRIBUTE")
            c.setFont("Helvetica", max(8, int(w/50)))
            c.setFillColorRGB(0.5, 0, 0, alpha=0.09)
            c.drawCentredString(0, -75, COMPANY['phone']+" | "+COMPANY['email'])
            c.restoreState(); c.save(); buf.seek(0)
            from pypdf import PdfReader as PR2
            op = PR2(buf).pages[0]
            page.merge_page(op); writer.add_page(page)
        with open(dst,'wb') as f: writer.write(f)
    except: shutil.copy(src, dst)

def init_db():
    with get_db() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'trainee',
            phone TEXT, department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS modules(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL, description TEXT, category TEXT,
            trainer_id INTEGER, start_datetime TIMESTAMP, end_datetime TIMESTAMP,
            status TEXT DEFAULT 'draft', is_default BOOLEAN DEFAULT 0,
            color TEXT DEFAULT '#3B5BDB',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(trainer_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS chapters(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL, title TEXT NOT NULL,
            order_num INTEGER DEFAULT 0,
            FOREIGN KEY(module_id) REFERENCES modules(id));
        CREATE TABLE IF NOT EXISTS enrollments(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER, trainee_id INTEGER,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed BOOLEAN DEFAULT 0,
            FOREIGN KEY(module_id) REFERENCES modules(id),
            FOREIGN KEY(trainee_id) REFERENCES users(id),
            UNIQUE(module_id,trainee_id));
        CREATE TABLE IF NOT EXISTS materials(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER, chapter_id INTEGER,
            title TEXT NOT NULL, file_path TEXT, watermarked_path TEXT,
            file_type TEXT, release_phase TEXT DEFAULT 'pre',
            order_num INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(module_id) REFERENCES modules(id));
        CREATE TABLE IF NOT EXISTS tests(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER, title TEXT NOT NULL,
            test_type TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 30,
            start_datetime TIMESTAMP, end_datetime TIMESTAMP,
            passing_marks INTEGER DEFAULT 60, max_attempts INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(module_id) REFERENCES modules(id));
        CREATE TABLE IF NOT EXISTS questions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER, question_text TEXT NOT NULL,
            option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT,
            correct_option TEXT, marks INTEGER DEFAULT 1,
            FOREIGN KEY(test_id) REFERENCES tests(id));
        CREATE TABLE IF NOT EXISTS test_attempts(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER, trainee_id INTEGER,
            score INTEGER, total_marks INTEGER, percentage REAL,
            passed BOOLEAN, answers TEXT,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            submitted_at TIMESTAMP,
            FOREIGN KEY(test_id) REFERENCES tests(id),
            FOREIGN KEY(trainee_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS progress(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER, trainee_id INTEGER, material_id INTEGER,
            completed BOOLEAN DEFAULT 0, watch_percent INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(module_id) REFERENCES modules(id),
            FOREIGN KEY(trainee_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS notifications(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, title TEXT NOT NULL,
            body TEXT, type TEXT DEFAULT 'info',
            link TEXT DEFAULT '', is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id));
        ''')
        trainer_id = None
        try:
            cur = db.execute("INSERT INTO users(name,email,password,role,department,phone) VALUES(?,?,?,?,?,?)",
                ('Rajesh Kumar','trainer@eagle.com',hash_pw('trainer123'),'trainer','Training & Development','+91 98765 43210'))
            trainer_id = cur.lastrowid
            db.execute("INSERT INTO users(name,email,password,role,department,phone) VALUES(?,?,?,?,?,?)",
                ('Arjun Sharma','trainee@eagle.com',hash_pw('trainee123'),'trainee','Security Operations','+91 91234 56789'))
            db.execute("INSERT INTO users(name,email,password,role,department,phone) VALUES(?,?,?,?,?,?)",
                ('Priya Mehta','priya@eagle.com',hash_pw('trainee123'),'trainee','Facility Management','+91 90987 65432'))
            db.execute("INSERT INTO users(name,email,password,role,department,phone) VALUES(?,?,?,?,?,?)",
                ('Mohammed Iqbal','iqbal@eagle.com',hash_pw('trainee123'),'trainee','QRT Division','+91 88765 43210'))
            db.commit()
        except:
            row = db.execute("SELECT id FROM users WHERE role='trainer' LIMIT 1").fetchone()
            if row: trainer_id = row['id']

        if db.execute("SELECT COUNT(*) as c FROM modules WHERE is_default=1").fetchone()['c'] == 0 and trainer_id:
            now = datetime.datetime.now()
            mod_ids = []
            for i,(title,desc,cat,color) in enumerate(DEFAULT_MODULES):
                start = now + datetime.timedelta(days=i*4+1)
                end   = start + datetime.timedelta(hours=8)
                cur = db.execute(
                    'INSERT INTO modules(title,description,category,trainer_id,start_datetime,end_datetime,status,is_default,color) VALUES(?,?,?,?,?,?,?,?,?)',
                    (title,desc,cat,trainer_id,start.strftime('%Y-%m-%dT%H:%M'),end.strftime('%Y-%m-%dT%H:%M'),'published',1,color))
                mid = cur.lastrowid; mod_ids.append(mid)
                for j,ch in enumerate(DEFAULT_CHAPTERS[i]):
                    db.execute('INSERT INTO chapters(module_id,title,order_num) VALUES(?,?,?)',(mid,ch,j))
            db.commit()
            trainees = db.execute("SELECT id FROM users WHERE role='trainee'").fetchall()
            for t in trainees:
                for mid in mod_ids:
                    try: db.execute('INSERT INTO enrollments(module_id,trainee_id) VALUES(?,?)',(mid,t['id']))
                    except: pass
                create_notification(db,t['id'],'🎉 Welcome to Eagle LMS!',
                    'You have been enrolled in 10 professional training modules. Start your journey today!','welcome','/trainee/dashboard')
            db.commit()

init_db()

@app.context_processor
def inject_globals():
    nc = 0
    if 'user_id' in session:
        nc = get_db().execute('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0',(session['user_id'],)).fetchone()['c']
    return dict(COMPANY=COMPANY, notif_count=nc)

# AUTH
@app.route('/')
def index(): return redirect(url_for('login'))

@app.route('/login',methods=['GET','POST'])
def login():
    if request.method=='POST':
        db=get_db()
        user=db.execute('SELECT * FROM users WHERE email=? AND password=?',(request.form['email'],hash_pw(request.form['password']))).fetchone()
        if user:
            session.update({'user_id':user['id'],'role':user['role'],'name':user['name']})
            return redirect(url_for('trainer_dashboard' if user['role']=='trainer' else 'trainee_dashboard'))
        flash('Invalid email or password.','error')
    return render_template('login.html')

@app.route('/register',methods=['GET','POST'])
def register():
    if request.method=='POST':
        try:
            db=get_db()
            db.execute('INSERT INTO users(name,email,password,role,department,phone) VALUES(?,?,?,?,?,?)',
                (request.form['name'],request.form['email'],hash_pw(request.form['password']),
                 request.form.get('role','trainee'),request.form.get('department',''),request.form.get('phone','')))
            db.commit()
            uid=db.execute("SELECT id FROM users WHERE email=?",(request.form['email'],)).fetchone()['id']
            for m in db.execute("SELECT id FROM modules WHERE status='published'").fetchall():
                try: db.execute('INSERT INTO enrollments(module_id,trainee_id) VALUES(?,?)',(m['id'],uid))
                except: pass
            db.commit()
            flash('Account created! Please sign in.','success')
            return redirect(url_for('login'))
        except: flash('Email already registered.','error')
    return render_template('register.html')

@app.route('/logout')
def logout(): session.clear(); return redirect(url_for('login'))

# NOTIFICATIONS
@app.route('/notifications')
@login_required
def notifications():
    db=get_db(); uid=session['user_id']
    notifs=db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 60',(uid,)).fetchall()
    db.execute('UPDATE notifications SET is_read=1 WHERE user_id=?',(uid,)); db.commit()
    return render_template('notifications.html',notifs=notifs)

@app.route('/api/notifications/unread')
@login_required
def notif_api():
    db=get_db(); uid=session['user_id']
    c=db.execute('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0',(uid,)).fetchone()['c']
    items=db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 8',(uid,)).fetchall()
    return jsonify({'count':c,'items':[dict(r) for r in items]})

@app.route('/api/notifications/mark-read',methods=['POST'])
@login_required
def mark_notifs_read():
    db=get_db(); uid=session['user_id']
    db.execute('UPDATE notifications SET is_read=1 WHERE user_id=?',(uid,)); db.commit()
    return jsonify({'status':'ok'})

@app.route('/api/notifications/mark-read-all',methods=['POST'])
@login_required
def mark_all_read():
    db=get_db(); uid=session['user_id']
    db.execute('UPDATE notifications SET is_read=1 WHERE user_id=?',(uid,)); db.commit()
    flash('All notifications marked as read.','success')
    return redirect(url_for('notifications'))

# TRAINER DASHBOARD
@app.route('/trainer/dashboard')
@trainer_required
def trainer_dashboard():
    db=get_db(); uid=session['user_id']
    now=datetime.datetime.now().isoformat()
    modules=db.execute('SELECT * FROM modules WHERE trainer_id=? ORDER BY start_datetime',(uid,)).fetchall()
    total_trainees=db.execute('SELECT COUNT(*) as c FROM users WHERE role="trainee"').fetchone()['c']
    upcoming=[m for m in modules if m['start_datetime'] and m['start_datetime']>now]
    ongoing=[m for m in modules if m['start_datetime'] and m['end_datetime'] and m['start_datetime']<=now<=m['end_datetime']]
    recent=db.execute('''SELECT u.name,m.title,e.enrolled_at FROM enrollments e
        JOIN users u ON e.trainee_id=u.id JOIN modules m ON e.module_id=m.id
        WHERE m.trainer_id=? ORDER BY e.enrolled_at DESC LIMIT 6''',(uid,)).fetchall()
    mod_stats={}
    for m in modules:
        total_e=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE module_id=?',(m['id'],)).fetchone()['c']
        done_e=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE module_id=? AND completed=1',(m['id'],)).fetchone()['c']
        mod_stats[m['id']]={'total':total_e,'done':done_e}
    return render_template('trainer_dashboard.html',modules=modules,total_trainees=total_trainees,
        total_modules=len(modules),upcoming=len(upcoming),ongoing=len(ongoing),recent=recent,mod_stats=mod_stats,now=now)

# TRAINER MODULES LIST
@app.route('/trainer/modules')
@trainer_required
def trainer_modules():
    db=get_db(); uid=session['user_id']
    now=datetime.datetime.now().isoformat()
    modules=db.execute('SELECT * FROM modules WHERE trainer_id=? ORDER BY start_datetime',(uid,)).fetchall()
    mod_stats={}
    for m in modules:
        chapters=db.execute('SELECT COUNT(*) as c FROM chapters WHERE module_id=?',(m['id'],)).fetchone()['c']
        materials=db.execute('SELECT COUNT(*) as c FROM materials WHERE module_id=?',(m['id'],)).fetchone()['c']
        trainees=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE module_id=?',(m['id'],)).fetchone()['c']
        mod_stats[m['id']]={'chapters':chapters,'materials':materials,'trainees':trainees}
    return render_template('trainer_modules.html',modules=modules,mod_stats=mod_stats,now=now)

# TRAINER MODULE DETAIL
@app.route('/trainer/module/<int:module_id>')
@trainer_required
def trainer_module_detail(module_id):
    db=get_db()
    module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    if not module: abort(404)
    chapters=db.execute('SELECT * FROM chapters WHERE module_id=? ORDER BY order_num',(module_id,)).fetchall()
    materials=db.execute('SELECT * FROM materials WHERE module_id=? ORDER BY chapter_id,order_num',(module_id,)).fetchall()
    tests=db.execute('SELECT * FROM tests WHERE module_id=? ORDER BY created_at',(module_id,)).fetchall()
    enrollments=db.execute('''SELECT u.name,u.email,u.department,e.enrolled_at,e.completed,e.trainee_id
        FROM enrollments e JOIN users u ON e.trainee_id=u.id WHERE e.module_id=?''',(module_id,)).fetchall()
    mat_by_chapter={}
    for mat in materials:
        cid=mat['chapter_id'] or 0
        mat_by_chapter.setdefault(cid,[]).append(dict(mat))
    return render_template('trainer_module_detail.html',module=module,chapters=chapters,
        materials=materials,mat_by_chapter=mat_by_chapter,tests=tests,enrollments=enrollments)

@app.route('/trainer/module/<int:module_id>/schedule',methods=['POST'])
@trainer_required
def schedule_module(module_id):
    db=get_db()
    module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    old_status=module['status']
    db.execute('UPDATE modules SET start_datetime=?,end_datetime=?,status=?,color=? WHERE id=?',
        (request.form['start_datetime'],request.form['end_datetime'],
         request.form.get('status','published'),request.form.get('color','#3B5BDB'),module_id))
    db.commit()
    if request.form.get('status')=='published' and old_status!='published':
        notify_trainees(db,f'📚 Module Scheduled: {module["title"]}',
            f'"{module["title"]}" has been scheduled starting {request.form["start_datetime"][:10]}.',
            'module_published',f'/trainee/module/{module_id}')
        db.commit()
    flash('Schedule updated!','success')
    return redirect(url_for('trainer_module_detail',module_id=module_id))

@app.route('/trainer/module/<int:module_id>/chapter/add',methods=['POST'])
@trainer_required
def add_chapter(module_id):
    db=get_db()
    title=request.form['chapter_title']
    count=db.execute('SELECT COUNT(*) as c FROM chapters WHERE module_id=?',(module_id,)).fetchone()['c']
    db.execute('INSERT INTO chapters(module_id,title,order_num) VALUES(?,?,?)',(module_id,title,count))
    db.commit(); flash(f'Chapter "{title}" added.','success')
    return redirect(url_for('trainer_module_detail',module_id=module_id))

@app.route('/trainer/module/<int:module_id>/chapter/<int:chapter_id>/delete',methods=['POST'])
@trainer_required
def delete_chapter(module_id,chapter_id):
    db=get_db()
    db.execute('DELETE FROM chapters WHERE id=?',(chapter_id,))
    db.execute('DELETE FROM materials WHERE chapter_id=?',(chapter_id,))
    db.commit(); flash('Chapter removed.','success')
    return redirect(url_for('trainer_module_detail',module_id=module_id))

@app.route('/trainer/module/<int:module_id>/delete',methods=['POST'])
@trainer_required
def delete_module(module_id):
    db=get_db()
    db.execute('DELETE FROM modules WHERE id=?',(module_id,))
    db.commit(); flash('Module deleted.','success')
    return redirect(url_for('trainer_modules'))

@app.route('/trainer/module/<int:module_id>/upload',methods=['POST'])
@trainer_required
def upload_material(module_id):
    if 'file' not in request.files: flash('No file selected.','error'); return redirect(url_for('trainer_module_detail',module_id=module_id))
    file=request.files['file']
    if not file or not allowed_file(file.filename): flash('File type not allowed.','error'); return redirect(url_for('trainer_module_detail',module_id=module_id))
    db=get_db(); module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    filename=secure_filename(file.filename)
    ts=datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    fname=f"{module_id}_{ts}_{filename}"
    orig_path=os.path.join(UPLOAD_DIR,fname)
    file.save(orig_path)
    ext=filename.rsplit('.',1)[1].lower()
    ftype='video' if ext in ['mp4','mov','avi','mkv','webm'] else ('pdf' if ext=='pdf' else ('ppt' if ext in ['ppt','pptx'] else 'image'))
    wm_fname=f"wm_{fname}"; wm_path=os.path.join(UPLOAD_DIR,wm_fname)
    wm_text=f"Eagle Industrial Services Pvt. Ltd."
    if ftype=='pdf': watermark_pdf(orig_path,wm_path,wm_text)
    elif ftype=='image': watermark_image(orig_path,wm_path,wm_text)
    else: shutil.copy(orig_path,wm_path)
    chapter_id=request.form.get('chapter_id') or None
    if chapter_id: chapter_id=int(chapter_id)
    phase=request.form.get('phase','pre')
    count=db.execute('SELECT COUNT(*) as c FROM materials WHERE module_id=? AND chapter_id=?',(module_id,chapter_id)).fetchone()['c']
    mat_title=request.form.get('title',filename)
    db.execute('INSERT INTO materials(module_id,chapter_id,title,file_path,watermarked_path,file_type,release_phase,order_num) VALUES(?,?,?,?,?,?,?,?)',
        (module_id,chapter_id,mat_title,fname,wm_fname,ftype,phase,count))
    db.commit()
    notify_trainees(db,f'📎 New Material: {mat_title}',
        f'"{mat_title}" has been added to "{module["title"]}".',
        'material_upload',f'/trainee/module/{module_id}')
    db.commit()
    flash('Material uploaded with watermark!','success')
    return redirect(url_for('trainer_module_detail',module_id=module_id))

@app.route('/trainer/module/<int:module_id>/material/<int:mat_id>/delete',methods=['POST'])
@trainer_required
def delete_material(module_id,mat_id):
    db=get_db(); mat=db.execute('SELECT * FROM materials WHERE id=?',(mat_id,)).fetchone()
    if mat:
        for f in [mat['file_path'],mat['watermarked_path']]:
            if f:
                p=os.path.join(UPLOAD_DIR,f)
                if os.path.exists(p): os.remove(p)
        db.execute('DELETE FROM materials WHERE id=?',(mat_id,)); db.commit()
    flash('Material deleted.','success')
    return redirect(url_for('trainer_module_detail',module_id=module_id))

@app.route('/trainer/module/<int:module_id>/test/create',methods=['GET','POST'])
@trainer_required
def create_test(module_id):
    db=get_db(); module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    if request.method=='POST':
        cur=db.execute('INSERT INTO tests(module_id,title,test_type,duration_minutes,start_datetime,end_datetime,passing_marks,max_attempts) VALUES(?,?,?,?,?,?,?,?)',
            (module_id,request.form['title'],request.form['test_type'],request.form['duration'],
             request.form['start_datetime'],request.form['end_datetime'],
             request.form['passing_marks'],request.form.get('max_attempts',1)))
        test_id=cur.lastrowid; db.commit()
        for q in json.loads(request.form.get('questions','[]')):
            db.execute('INSERT INTO questions(test_id,question_text,option_a,option_b,option_c,option_d,correct_option,marks) VALUES(?,?,?,?,?,?,?,?)',
                (test_id,q['text'],q['a'],q['b'],q['c'],q['d'],q['correct'],q.get('marks',1)))
        db.commit()
        notify_trainees(db,f'📝 New Test: {request.form["title"]}',
            f'A {request.form["test_type"]}-test has been added to "{module["title"]}".',
            'test_created',f'/trainee/module/{module_id}')
        db.commit(); flash('Test created!','success')
        return redirect(url_for('trainer_module_detail',module_id=module_id))
    return render_template('create_test.html',module=module)

@app.route('/trainer/module/<int:module_id>/reports')
@trainer_required
def module_reports(module_id):
    db=get_db()
    module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    tests=db.execute('SELECT * FROM tests WHERE module_id=?',(module_id,)).fetchall()
    trainees=db.execute('''SELECT u.id,u.name,u.email,u.department,e.completed FROM enrollments e
        JOIN users u ON e.trainee_id=u.id WHERE e.module_id=?''',(module_id,)).fetchall()
    report_data=[]
    for t in trainees:
        row=dict(t); row['attempts']={}
        for test in tests:
            att=db.execute('SELECT * FROM test_attempts WHERE test_id=? AND trainee_id=? ORDER BY started_at DESC',(test['id'],t['id'])).fetchone()
            row['attempts'][test['id']]=dict(att) if att else None
        report_data.append(row)
    return render_template('module_reports.html',module=module,tests=tests,report_data=report_data)

@app.route('/trainer/trainees')
@trainer_required
def trainer_trainees():
    db=get_db()
    trainees=db.execute('SELECT * FROM users WHERE role="trainee"').fetchall()
    trainee_data=[]
    for t in trainees:
        enrolled=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE trainee_id=?',(t['id'],)).fetchone()['c']
        attempts=db.execute('SELECT COUNT(*) as c FROM test_attempts WHERE trainee_id=?',(t['id'],)).fetchone()['c']
        trainee_data.append({**dict(t),'enrolled':enrolled,'attempts':attempts})
    return render_template('trainer_trainees.html',trainees=trainee_data)

# TRAINEE
@app.route('/trainee/dashboard')
@login_required
def trainee_dashboard():
    if session['role']=='trainer': return redirect(url_for('trainer_dashboard'))
    db=get_db(); uid=session['user_id']
    now=datetime.datetime.now().isoformat()
    enrollments=db.execute('''SELECT m.*,e.completed as enrolled_complete FROM enrollments e
        JOIN modules m ON e.module_id=m.id WHERE e.trainee_id=? AND m.status="published" ORDER BY m.start_datetime''',(uid,)).fetchall()
    upcoming=[m for m in enrollments if m['start_datetime'] and m['start_datetime']>now]
    ongoing=[m for m in enrollments if m['start_datetime'] and m['end_datetime'] and m['start_datetime']<=now<=m['end_datetime']]
    completed_list=[m for m in enrollments if m['end_datetime'] and m['end_datetime']<now]
    notifs=db.execute('SELECT * FROM notifications WHERE user_id=? AND is_read=0 ORDER BY created_at DESC LIMIT 10',(uid,)).fetchall()
    total_tests=db.execute('SELECT COUNT(*) as c FROM test_attempts WHERE trainee_id=?',(uid,)).fetchone()['c']
    passed_tests=db.execute('SELECT COUNT(*) as c FROM test_attempts WHERE trainee_id=? AND passed=1',(uid,)).fetchone()['c']
    return render_template('trainee_dashboard.html',upcoming=upcoming,ongoing=ongoing,
        completed=completed_list,notifications=notifs,total_tests=total_tests,passed_tests=passed_tests)

@app.route('/trainee/module/<int:module_id>')
@login_required
def trainee_module(module_id):
    if session['role']=='trainer': return redirect(url_for('trainer_module_detail',module_id=module_id))
    db=get_db(); uid=session['user_id']
    module=db.execute('SELECT * FROM modules WHERE id=?',(module_id,)).fetchone()
    if not module: abort(404)
    enrollment=db.execute('SELECT * FROM enrollments WHERE module_id=? AND trainee_id=?',(module_id,uid)).fetchone()
    if not enrollment: flash('Not enrolled.','error'); return redirect(url_for('trainee_dashboard'))
    now=datetime.datetime.now().isoformat()
    phase='upcoming'
    if module['start_datetime'] and module['end_datetime']:
        if now<module['start_datetime']: phase='pre'
        elif now<=module['end_datetime']: phase='live'
        else: phase='post'
    chapters=db.execute('SELECT * FROM chapters WHERE module_id=? ORDER BY order_num',(module_id,)).fetchall()
    materials=db.execute('SELECT * FROM materials WHERE module_id=? ORDER BY chapter_id,order_num',(module_id,)).fetchall()
    tests=db.execute('SELECT * FROM tests WHERE module_id=? ORDER BY created_at',(module_id,)).fetchall()
    progress_rows=db.execute('SELECT * FROM progress WHERE module_id=? AND trainee_id=?',(module_id,uid)).fetchall()
    progress_map={p['material_id']:dict(p) for p in progress_rows}
    mat_by_chapter={}
    for mat in materials:
        cid=mat['chapter_id'] or 0
        mat_by_chapter.setdefault(cid,[]).append(dict(mat))
    attempts_map={}
    for t in tests:
        att=db.execute('SELECT * FROM test_attempts WHERE test_id=? AND trainee_id=? ORDER BY started_at DESC',(t['id'],uid)).fetchone()
        attempts_map[t['id']]=dict(att) if att else None
    total_mats=len(materials)
    done_mats=sum(1 for m in materials if progress_map.get(m['id'],{}).get('completed'))
    overall_pct=int(done_mats/total_mats*100) if total_mats>0 else 0
    return render_template('trainee_module.html',module=module,phase=phase,chapters=chapters,
        mat_by_chapter=mat_by_chapter,tests=tests,progress_map=progress_map,
        attempts_map=attempts_map,overall_pct=overall_pct,total_mats=total_mats,done_mats=done_mats)

@app.route('/trainee/test/<int:test_id>',methods=['GET','POST'])
@login_required
def take_test(test_id):
    db=get_db(); uid=session['user_id']
    test=db.execute('SELECT * FROM tests WHERE id=?',(test_id,)).fetchone()
    if not test: abort(404)
    now=datetime.datetime.now().isoformat()
    if test['start_datetime'] and now<test['start_datetime']: flash('Test not started yet.','error'); return redirect(url_for('trainee_module',module_id=test['module_id']))
    if test['end_datetime'] and now>test['end_datetime']: flash('Test window closed.','error'); return redirect(url_for('trainee_module',module_id=test['module_id']))
    existing=db.execute('SELECT COUNT(*) as c FROM test_attempts WHERE test_id=? AND trainee_id=? AND submitted_at IS NOT NULL',(test_id,uid)).fetchone()['c']
    if existing>=test['max_attempts']: flash('All attempts used.','error'); return redirect(url_for('trainee_module',module_id=test['module_id']))
    questions=db.execute('SELECT * FROM questions WHERE test_id=?',(test_id,)).fetchall()
    if request.method=='POST':
        answers={}; score=0; total=sum(q['marks'] for q in questions)
        for q in questions:
            ans=request.form.get(f'q_{q["id"]}',''); answers[str(q['id'])]=ans
            if ans==q['correct_option']: score+=q['marks']
        pct=(score/total*100) if total>0 else 0
        passed=pct>=test['passing_marks']
        db.execute('INSERT INTO test_attempts(test_id,trainee_id,score,total_marks,percentage,passed,answers,submitted_at) VALUES(?,?,?,?,?,?,?,?)',
            (test_id,uid,score,total,pct,passed,json.dumps(answers),now))
        db.commit()
        return render_template('test_result.html',test=test,score=score,total=total,pct=pct,passed=passed,questions=questions,answers=answers)
    return render_template('take_test.html',test=test,questions=questions)

@app.route('/api/progress/update',methods=['POST'])
@login_required
def update_progress():
    data=request.json; db=get_db(); uid=session['user_id']
    now=datetime.datetime.now().isoformat()
    existing=db.execute('SELECT * FROM progress WHERE module_id=? AND trainee_id=? AND material_id=?',(data['module_id'],uid,data['material_id'])).fetchone()
    if existing:
        db.execute('UPDATE progress SET completed=?,watch_percent=?,updated_at=? WHERE id=?',(data.get('completed',0),data.get('watch_percent',0),now,existing['id']))
    else:
        db.execute('INSERT INTO progress(module_id,trainee_id,material_id,completed,watch_percent) VALUES(?,?,?,?,?)',(data['module_id'],uid,data['material_id'],data.get('completed',0),data.get('watch_percent',0)))
    db.commit()
    return jsonify({'status':'ok'})

@app.route('/uploads/<filename>')
@login_required
def serve_file(filename):
    if session.get('role')=='trainee':
        wm='wm_'+filename; wp=os.path.join(UPLOAD_DIR,wm)
        if os.path.exists(wp): return send_from_directory(UPLOAD_DIR,wm)
    return send_from_directory(UPLOAD_DIR,filename)

@app.route('/trainee/profile')
@login_required
def trainee_profile():
    db=get_db(); uid=session['user_id']
    user=db.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
    attempts=db.execute('''SELECT ta.*,t.title as test_title,t.test_type,m.title as module_title
        FROM test_attempts ta JOIN tests t ON ta.test_id=t.id JOIN modules m ON t.module_id=m.id
        WHERE ta.trainee_id=? ORDER BY ta.started_at DESC''',(uid,)).fetchall()
    total_enrolled=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE trainee_id=?',(uid,)).fetchone()['c']
    total_completed=db.execute('SELECT COUNT(*) as c FROM enrollments WHERE trainee_id=? AND completed=1',(uid,)).fetchone()['c']
    avg_score=db.execute('SELECT AVG(percentage) as a FROM test_attempts WHERE trainee_id=?',(uid,)).fetchone()['a']
    return render_template('trainee_profile.html',user=user,attempts=attempts,
        total_enrolled=total_enrolled,total_completed=total_completed,
        avg_score=round(avg_score,1) if avg_score else 0)

@app.route('/trainee/calendar')
@login_required
def trainee_calendar():
    db=get_db(); uid=session['user_id']
    modules=db.execute('''SELECT m.* FROM modules m JOIN enrollments e ON m.id=e.module_id
        WHERE e.trainee_id=? AND m.status="published"''',(uid,)).fetchall()
    tests=db.execute('''SELECT t.*,m.title as module_title FROM tests t
        JOIN modules m ON t.module_id=m.id JOIN enrollments e ON m.id=e.module_id
        WHERE e.trainee_id=?''',(uid,)).fetchall()
    events=[]
    for m in modules:
        if m['start_datetime']:
            events.append({'title':m['title'],'start':m['start_datetime'],'end':m['end_datetime'],'type':'module','id':m['id'],'color':m['color'] or '#3B5BDB'})
    for t in tests:
        if t['start_datetime']:
            events.append({'title':f"{t['test_type'].title()} Test: {t['module_title']}","start":t['start_datetime'],'end':t['end_datetime'],'type':'test','color':'#F79009'})
    return render_template('trainee_calendar.html',events=json.dumps(events))

if __name__=='__main__':
    app.run(debug=True,port=5000)
