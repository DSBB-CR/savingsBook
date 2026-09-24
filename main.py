
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from database import Base, engine, get_db
import models
import crud
from schemas import OperationCreate, OperationOut, Position

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Broker App")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    return FileResponse("templates/index.html")


@app.get("/api/operations", response_model=List[OperationOut])
def get_operations(db: Session = Depends(get_db)):
    return crud.list_operations(db)


@app.post("/api/operations", response_model=OperationOut)
def add_operation(data: OperationCreate, db: Session = Depends(get_db)):
    return crud.create_operation(db, data)


@app.delete("/api/operations/{op_id}")
def remove_operation(op_id: int, db: Session = Depends(get_db)):
    op = crud.delete_operation(db, op_id)
    if not op:
        raise HTTPException(404, "Operation not found")
    return {"ok": True}


@app.get("/api/portfolio", response_model=List[Position])
def get_portfolio(db: Session = Depends(get_db)):
    return crud.calc_portfolio(db)