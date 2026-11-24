import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update

from app.db.session import get_db
from app.api.deps import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.automation import AutomationJob, AutomationRun
from app.models.ai import Notification
from app.schemas.automation import (
    AutomationJobCreate,
    AutomationJobRead,
    AutomationRunRead,
    PlatformHealthCheckItem,
    DeepLinkHealthCheckItem,
    EcosystemHealthSummary,
    NotificationRead
)
from app.schemas.common import ResponseEnvelope
from app.services.automation_service import (
    seed_default_automation_jobs,
    run_platform_health_check,
    trigger_job_execution
)
from app.core.logging import logger

router = APIRouter()

@router.get(
    "/jobs",
    response_model=ResponseEnvelope[List[AutomationJobRead]],
    summary="List all configured background automation jobs"
)
async def list_jobs(db: AsyncSession = Depends(get_db)):
    """Retrieve all automation jobs, automatically seeding defaults if none exist."""
    stmt = select(AutomationJob).order_by(AutomationJob.name)
    res = await db.execute(stmt)
    jobs = res.scalars().all()

    if not jobs:
        jobs = await seed_default_automation_jobs(db)

    # Resolve last run info for each job
    job_reads = []
    for j in jobs:
        run_stmt = select(AutomationRun).where(AutomationRun.job_id == j.id).order_by(desc(AutomationRun.created_at)).limit(1)
        r_res = await db.execute(run_stmt)
        last_run = r_res.scalar_one_or_none()

        job_reads.append(
            AutomationJobRead(
                id=j.id,
                name=j.name,
                job_type=j.job_type,
                cron_schedule=j.cron_schedule,
                is_active=j.is_active,
                config_payload=j.config_payload,
                last_run_at=str(last_run.created_at) if last_run else None,
                last_status=last_run.status if last_run else None,
                created_at=str(j.created_at)
            )
        )

    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(job_reads)} automation jobs",
        data=job_reads
    )

@router.post(
    "/jobs",
    response_model=ResponseEnvelope[AutomationJobRead],
    summary="Create a new automation job"
)
async def create_job(
    payload: AutomationJobCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
):
    """Register a new automation or monitoring job."""
    job = AutomationJob(
        id=str(uuid.uuid4()),
        name=payload.name,
        job_type=payload.job_type,
        cron_schedule=payload.cron_schedule,
        is_active=payload.is_active,
        config_payload=payload.config_payload
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    return ResponseEnvelope(
        success=True,
        message=f"Created automation job '{job.name}'",
        data=AutomationJobRead(
            id=job.id,
            name=job.name,
            job_type=job.job_type,
            cron_schedule=job.cron_schedule,
            is_active=job.is_active,
            config_payload=job.config_payload,
            created_at=str(job.created_at)
        )
    )

@router.post(
    "/jobs/{job_id}/run",
    summary="Trigger immediate execution of an automation job"
)
async def trigger_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Manually dispatch an immediate run of a background job."""
    success, message, duration_ms = await trigger_job_execution(db, job_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    return ResponseEnvelope(
        success=True,
        message=f"Job executed in {duration_ms}ms: {message}",
        data={"job_id": job_id, "duration_ms": duration_ms, "details": message}
    )

@router.get(
    "/runs",
    response_model=ResponseEnvelope[List[AutomationRunRead]],
    summary="List automation execution run history"
)
async def list_runs(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve historical logs and audit details of past automation executions."""
    stmt = select(AutomationRun).order_by(desc(AutomationRun.created_at)).limit(limit)
    res = await db.execute(stmt)
    runs = res.scalars().all()

    run_reads = [
        AutomationRunRead(
            id=r.id,
            job_id=r.job_id,
            status=r.status,
            duration_ms=r.duration_ms,
            details=r.details,
            created_at=str(r.created_at)
        )
        for r in runs
    ]

    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(run_reads)} execution records",
        data=run_reads
    )

@router.get(
    "/health-summary",
    response_model=ResponseEnvelope[EcosystemHealthSummary],
    summary="Get overall streaming platform and link health summary"
)
async def get_health_summary(db: AsyncSession = Depends(get_db)):
    """Retrieve live statistics on platform uptime, average latency, and deep link health."""
    summary, _, _ = await run_platform_health_check(db)
    return ResponseEnvelope(
        success=True,
        message="Platform ecosystem health calculated",
        data=summary
    )

@router.get(
    "/platforms-health",
    response_model=ResponseEnvelope[List[PlatformHealthCheckItem]],
    summary="Get detailed link check report for all 43 platforms"
)
async def get_platforms_health(db: AsyncSession = Depends(get_db)):
    """Detailed latency, HTTP status, and uptime report for all platforms."""
    _, platform_items, _ = await run_platform_health_check(db)
    return ResponseEnvelope(
        success=True,
        message=f"Scanned {len(platform_items)} entertainment platforms",
        data=platform_items
    )

# ==============================================================================
# NOTIFICATIONS ENDPOINTS
# ==============================================================================
@router.get(
    "/notifications",
    response_model=ResponseEnvelope[List[NotificationRead]],
    summary="Get current user's notifications"
)
async def get_user_notifications(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Retrieve user's notifications (releases, subscription renewal notices, system updates)."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(desc(Notification.created_at))
        .limit(30)
    )
    res = await db.execute(stmt)
    notifs = res.scalars().all()

    reads = [
        NotificationRead(
            id=n.id,
            user_id=n.user_id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            action_url=n.action_url,
            created_at=str(n.created_at)
        )
        for n in notifs
    ]
    return ResponseEnvelope(
        success=True,
        message=f"Retrieved {len(reads)} notifications",
        data=reads
    )

@router.patch(
    "/notifications/{notif_id}/read",
    response_model=ResponseEnvelope[bool],
    summary="Mark a notification as read"
)
async def mark_notification_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Mark a specific notification as read."""
    stmt = select(Notification).where(Notification.id == notif_id, Notification.user_id == user.id)
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return ResponseEnvelope(success=True, message="Marked notification as read", data=True)

@router.post(
    "/notifications/read-all",
    response_model=ResponseEnvelope[bool],
    summary="Mark all user notifications as read"
)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """Mark all active notifications for current user as read."""
    stmt = update(Notification).where(Notification.user_id == user.id).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return ResponseEnvelope(success=True, message="All notifications marked as read", data=True)
