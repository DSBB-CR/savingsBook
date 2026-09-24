from sqlalchemy.orm import Session
from datetime import datetime
from models import Operation
from schemas import OperationCreate


def list_operations(db: Session):
    return db.query(Operation).order_by(Operation.date.desc(), Operation.id.desc()).all()


def create_operation(db: Session, data: OperationCreate):
    op = Operation(
        date=data.date or datetime.utcnow(),
        ticker=data.ticker.upper(),
        side=data.side,
        quantity=data.quantity,
        price=data.price,
        commission=data.commission,
        note=data.note,
    )
    db.add(op)
    db.commit()
    db.refresh(op)
    return op


def delete_operation(db: Session, op_id: int):
    op = db.query(Operation).filter(Operation.id == op_id).first()
    if op:
        db.delete(op)
        db.commit()
    return op


def calc_portfolio(db: Session):
    """Считаем позиции из операций хронологически."""
    ops = db.query(Operation).order_by(Operation.date.asc(), Operation.id.asc()).all()

    positions: dict[str, dict] = {}

    for op in ops:
        pos = positions.setdefault(op.ticker, {"quantity": 0.0, "avg_price": 0.0})

        if op.side == "buy":
            new_qty = pos["quantity"] + op.quantity
            # средняя цена с учётом комиссии
            total_cost = pos["quantity"] * pos["avg_price"] + op.quantity * op.price + op.commission
            pos["avg_price"] = total_cost / new_qty if new_qty else 0.0
            pos["quantity"] = new_qty
        else:  # sell
            pos["quantity"] -= op.quantity
            # avg_price не меняется при продаже (списываем по средней)

        if abs(pos["quantity"]) < 1e-9:
            pos["quantity"] = 0.0
            pos["avg_price"] = 0.0

    result = []
    for ticker, pos in positions.items():
        if pos["quantity"] > 0:
            result.append({
                "ticker": ticker,
                "quantity": round(pos["quantity"], 6),
                "avg_price": round(pos["avg_price"], 4),
                "invested": round(pos["quantity"] * pos["avg_price"], 2),
            })
    return result