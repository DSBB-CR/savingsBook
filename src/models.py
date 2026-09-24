from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from src.database import Base


class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    ticker = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)          # "buy" | "sell"
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    commission = Column(Float, default=0.0)
    note = Column(String, default="")