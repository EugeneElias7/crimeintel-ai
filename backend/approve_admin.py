from app.database import SessionLocal
from app.models import User, AccountStatus

db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@ksp.gov.in').first()
if admin:
    admin.account_status = AccountStatus.APPROVED
    db.commit()
    print('Admin approved!')
else:
    print('Admin not found')
db.close()