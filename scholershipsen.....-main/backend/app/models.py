from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ActionRequest(BaseModel):
    action: str
    note: str
    assignee: Optional[str] = None

class SignalReason(BaseModel):
    signal: str
    label: str
    points: int
    text: str

class ClusterStudent(BaseModel):
    id: str
    name: str
    institution: str
    institution_id: str
    course: str
    year: str
    attendance: float
    bank_masked: str
    mobile_masked: str
    address: str
    amount: float
    scheme: str
    doc_hash: str
    status: str

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    risk: str
    is_shared: Optional[bool] = False
    details: Optional[str] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    flagged: bool

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class ClusterTimelineItem(BaseModel):
    time: str
    officer: str
    action: str
    note: str

class ClusterDetail(BaseModel):
    id: str
    title: str
    pattern: str
    score: int
    band: str
    status: str
    is_hero: Optional[bool] = False
    created_at: str
    counts: Dict[str, int]
    reasons: List[SignalReason]
    students: List[ClusterStudent]
    timeline: List[ClusterTimelineItem]
    graph: GraphData
