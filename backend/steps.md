cd backend

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload  #for runnnig fastapi(backend) server
