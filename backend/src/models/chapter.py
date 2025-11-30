"""
Data models for textbook chapters.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class Chapter(BaseModel):
    """Represents a complete chapter in the textbook."""

    id: int = Field(..., gt=0, description="Unique chapter identifier")
    title: str = Field(..., min_length=3, max_length=100, description="Chapter title")
    slug: str = Field(..., pattern=r"^[a-z0-9-]+$", description="URL-friendly identifier")
    order: int = Field(..., gt=0, description="Display order in navigation")
    description: str = Field(..., max_length=500, description="Brief chapter overview")
    learning_outcomes: List[str] = Field(
        ...,
        min_length=3,
        max_length=10,
        description="List of learning objectives"
    )
    prerequisites: Optional[List[int]] = Field(
        default=None,
        description="IDs of prerequisite chapters"
    )
    estimated_time: int = Field(..., ge=5, description="Reading time in minutes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator('learning_outcomes')
    @classmethod
    def validate_learning_outcomes(cls, v: List[str]) -> List[str]:
        """Ensure each learning outcome is non-empty."""
        if not all(outcome.strip() for outcome in v):
            raise ValueError("Learning outcomes cannot be empty strings")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "id": 2,
                "title": "Kinematics and Dynamics",
                "slug": "kinematics-dynamics",
                "order": 2,
                "description": "Explore the mathematical foundations of humanoid robot motion and forces.",
                "learning_outcomes": [
                    "Define forward and inverse kinematics for humanoid arms",
                    "Apply DH parameters to describe robot geometry",
                    "Calculate forces and torques in humanoid robot systems",
                    "Analyze stability using Zero Moment Point (ZMP)"
                ],
                "prerequisites": [1],
                "estimated_time": 45
            }
        }
